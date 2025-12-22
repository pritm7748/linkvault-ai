import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { SchemaType, Schema } from '@google/generative-ai'
import * as cheerio from 'cheerio';
import { getYouTubeVideoId, getYouTubeVideoDetails, getYouTubeTranscript } from '@/lib/youtube'
import { generateContentWithFallback, embedContentWithFallback } from '@/lib/gemini'
import * as mammoth from 'mammoth';

// Polyfill DOMMatrix for Vercel/Node environment
if (typeof global.DOMMatrix === 'undefined') {
  // @ts-ignore
  global.DOMMatrix = class {
    constructor() { return this; }
    toString() { return '[object DOMMatrix]'; }
  };
}

// FIX: Use require() to avoid ESM errors with pdf-parse
const pdf = require('pdf-parse');

const jsonSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    "title": { "type": SchemaType.STRING },
    "summary": { "type": SchemaType.STRING },
    "tags": {
      "type": SchemaType.ARRAY,
      "items": { "type": SchemaType.STRING }
    },
  },
  required: ["title", "summary", "tags"]
};

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServer(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const contentType = formData.get('contentType') as string;
    let originalContent: string | null = null;
    let contentForAI: any[] = [];
    let storagePath: string | null = null;
    let processedType = contentType; // Allow changing type (e.g. tweet -> link if needed)
    
    let finalPrompt = `
      Analyze the following content. Perform these actions:
      1. Create a concise, descriptive title.
      2. Generate a list of 5-10 relevant tags.
      3. Write a detailed, paragraph-long summary. You MUST incorporate key insights, specific names, or technical terms mentioned in the text to optimize for searchability.

      Here is the content:
    `;

    if (contentType === 'image') {
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('vault.images').upload(filePath, file);
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
      storagePath = uploadData.path;
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString('base64');
      contentForAI = [{ text: finalPrompt }, { inlineData: { mimeType: file.type, data: base64Data } }];
      originalContent = file.name;
    } 
    // DOCUMENT HANDLER
    else if (contentType === 'document') {
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        
        const filePath = `${user.id}/docs/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('vault.images').upload(filePath, file);
        if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
        storagePath = uploadData.path;
        originalContent = file.name;

        const buffer = Buffer.from(await file.arrayBuffer());
        let extractedText = "";

        if (file.type === 'application/pdf') {
            const data = await pdf(buffer);
            extractedText = data.text;
        } else if (file.type.includes('wordprocessingml') || file.name.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer: buffer });
            extractedText = result.value;
        } else {
            extractedText = buffer.toString('utf-8');
        }

        finalPrompt += `Document Title: "${file.name}"\n\nDocument Text:\n${extractedText.substring(0, 20000)}`;
        contentForAI = [{ text: finalPrompt }];
    }
    // TWEET HANDLER
    else if (contentType === 'tweet') {
        const url = formData.get('content') as string;
        originalContent = url;
        
        // Convert x.com to twitter.com for oEmbed compatibility
        let oembedUrl = url.replace('x.com', 'twitter.com');
        const apiUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(oembedUrl)}&omit_script=true`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Could not fetch Tweet info. Is the account public?");
        
        const data = await response.json();
        
        // Twitter returns HTML (blockquote). We strip tags to get raw text.
        const $ = cheerio.load(data.html);
        const tweetText = $('p').text() || $('blockquote').text();
        const authorName = data.author_name;
        
        finalPrompt += `Tweet by ${authorName}:\n"${tweetText}"\n\nURL: ${url}`;
        contentForAI = [{ text: finalPrompt }];
        
        // You can save as 'tweet' or map to 'link' if you don't want to update VaultGrid icons yet
        processedType = 'tweet'; 
    }
    else {
        const content = formData.get('content') as string;
        originalContent = content;
        let title = '';
        let description = '';
        let bodyText = '';

        if (contentType === 'note') {
          bodyText = content;
        } else if (contentType === 'link') {
            const response = await fetch(content);
            if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
            const html = await response.text();
            const $ = cheerio.load(html);
            title = $('title').text() || '';
            description = $('meta[name="description"]').attr('content') || '';
            bodyText = $('body').text().replace(/\s\s+/g, ' ').trim();
        } else if (contentType === 'video') {
            const youtubeVideoId = getYouTubeVideoId(content);
            if (!youtubeVideoId) throw new Error("Invalid YouTube URL.");
            const details = await getYouTubeVideoDetails(youtubeVideoId);
            const transcript = await getYouTubeTranscript(youtubeVideoId);
            title = details.title;
            description = details.description;
            bodyText = transcript.length > 0 
                ? `TRANSCRIPT:\n${transcript}` 
                : `DESCRIPTION:\n${description}`;
        }
        
        finalPrompt += `Title: "${title}". Body Text: "${bodyText.substring(0, 15000)}"`; 
        contentForAI = [{ text: finalPrompt }];
    }

    const result: any = await generateContentWithFallback(
        "gemini-3-flash-preview", 
        { responseMimeType: "application/json", responseSchema: jsonSchema },
        contentForAI
    );
    
    const aiJson = JSON.parse(result.response.text());
    
    const textForEmbedding = `Title: ${aiJson.title}\nSummary: ${aiJson.summary}`;
    const embeddingResult = await embedContentWithFallback(textForEmbedding);
    const embedding = embeddingResult.embedding.values;

    const { data: newItem, error: dbError } = await supabase.from('vault_items').insert({ 
        user_id: user.id, 
        content_type: processedType, 
        original_content: originalContent, 
        storage_path: storagePath, 
        processed_title: aiJson.title, 
        processed_summary: aiJson.summary, 
        processed_tags: aiJson.tags, 
        embedding: embedding 
    }).select().single();
    
    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    return NextResponse.json({ message: 'Success', newItem });

  } catch (error: any) {
    console.error("Process Error:", error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}