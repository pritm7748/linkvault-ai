import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { SchemaType, Schema } from '@google/generative-ai'
import * as cheerio from 'cheerio';
import { getYouTubeVideoId, getYouTubeVideoDetails, getYouTubeTranscript } from '@/lib/youtube'
import { generateContentWithFallback, embedContentWithFallback } from '@/lib/gemini'
import * as mammoth from 'mammoth';

if (typeof global.DOMMatrix === 'undefined') {
  // @ts-ignore
  global.DOMMatrix = class {
    constructor() { return this; }
    toString() { return '[object DOMMatrix]'; }
  };
}

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
    let processedType = contentType;
    
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
        processedType = 'tweet';
        
        // 1. Fetch Basic Info via oEmbed
        let oembedUrl = url.replace('x.com', 'twitter.com');
        const apiUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(oembedUrl)}&omit_script=true`;
        
        let tweetText = "";
        let authorName = "Twitter User";

        try {
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                const $ = cheerio.load(data.html);
                tweetText = $('p').text() || $('blockquote').text();
                authorName = data.author_name;
            }
        } catch (e) { console.warn("oEmbed failed"); }
        
        finalPrompt += `Tweet by ${authorName}:\n"${tweetText}"\n\nURL: ${url}`;
        contentForAI = [{ text: finalPrompt }];

        // 2. Fetch Media via Open Graph
        try {
            const metaResponse = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FacebookBot/1.0)' }
            });
            
            if (metaResponse.ok) {
                const html = await metaResponse.text();
                const $meta = cheerio.load(html);
                const ogImage = $meta('meta[property="og:image"]').attr('content');
                
                if (ogImage) {
                    const imageResp = await fetch(ogImage);
                    const imageBuffer = await imageResp.arrayBuffer();
                    const base64Data = Buffer.from(imageBuffer).toString('base64');
                    contentForAI.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
                    finalPrompt += `\n\n[NOTE: An image from the tweet is attached.]`;
                }
            }
        } catch (e) { console.warn("Tweet media scraping failed:", e); }
    }
    // --- NEW INSTAGRAM HANDLER ---
    else if (contentType === 'instagram') {
        const url = formData.get('content') as string;
        originalContent = url;
        processedType = 'instagram'; // We will add a pink icon for this in VaultGrid

        try {
            // Spoof as Facebook External Hit to get Open Graph tags
            const metaResponse = await fetch(url, {
                headers: { 
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });

            if (!metaResponse.ok) throw new Error("Could not fetch Instagram metadata.");

            const html = await metaResponse.text();
            const $ = cheerio.load(html);

            const title = $('meta[property="og:title"]').attr('content') || "Instagram Post";
            const description = $('meta[property="og:description"]').attr('content') || "";
            const image = $('meta[property="og:image"]').attr('content');

            finalPrompt += `Instagram Post: "${title}"\nCaption: "${description}"\nURL: ${url}`;
            contentForAI = [{ text: finalPrompt }];

            // If we found an image/thumbnail, feed it to Gemini Vision
            if (image) {
                const imageResp = await fetch(image);
                const imageBuffer = await imageResp.arrayBuffer();
                const base64Data = Buffer.from(imageBuffer).toString('base64');
                contentForAI.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
                finalPrompt += `\n\n[NOTE: Attached is the post cover/image. Analyze it.]`;
            }

        } catch (e: any) {
            console.warn("Instagram scraping failed:", e);
            // Fallback: Just ask AI to summarize based on URL (it might hallucinate or refuse, but safer than crashing)
            finalPrompt += `Instagram URL: ${url}\n(Could not scrape metadata. Please generate a placeholder summary based on the link structure.)`;
            contentForAI = [{ text: finalPrompt }];
        }
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
        "gemini-2.0-flash", 
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