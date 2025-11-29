// src/app/api/process/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai'
import { YoutubeTranscript } from 'youtube-transcript';
import * as cheerio from 'cheerio';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// FIX 2: Use 'as const' or explicit casting to fix Enum widening
const jsonSchema: Schema = {
  type: SchemaType.OBJECT as const, 
  properties: {
    title: { type: SchemaType.STRING as const },
    summary: { type: SchemaType.STRING as const },
    tags: {
      type: SchemaType.ARRAY as const,
      items: { type: SchemaType.STRING as const }
    },
    action_items: {
      type: SchemaType.ARRAY as const,
      items: { type: SchemaType.STRING as const }
    }
  },
  required: ["title", "summary", "tags", "action_items"]
};

function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function POST(req: NextRequest) {
  // FIX 1: Do NOT await cookies(). Pass the Promise directly.
  const cookieStore = cookies(); 
  const supabase = createServer(cookieStore);
  
  // Note: We need to await getUser() because supabase is async now
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const contentType = formData.get('contentType') as string;
    let originalContent: string | null = null;
    let contentForAI: any[] = [];
    let storagePath: string | null = null;

    if (contentType === 'image') {
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('vault.images').upload(filePath, file);
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
      
      storagePath = uploadData.path;
      originalContent = file.name;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString('base64');
      contentForAI = [
        { text: "Analyze this image. Create a title, summary, tags, and list any text found as action items." }, 
        { inlineData: { mimeType: file.type, data: base64Data } }
      ];
    } else {
        const content = formData.get('content') as string;
        originalContent = content;

        if (contentType === 'note') {
           contentForAI = [{ text: `Analyze this user note: "${content}"` }];
        } 
        else if (contentType === 'link') {
            const response = await fetch(content);
            if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
            const html = await response.text();
            const $ = cheerio.load(html);
            $('script').remove(); $('style').remove();
            const bodyText = $('body').text().replace(/\s\s+/g, ' ').trim().substring(0, 20000);
            
            contentForAI = [{ text: `Analyze this webpage. URL: ${content}\n\nContent: ${bodyText}` }];
        } 
        else if (contentType === 'video') {
            const youtubeVideoId = getYouTubeVideoId(content);
            if (!youtubeVideoId) throw new Error("Invalid URL. Only YouTube supported.");
            
            let transcriptText = "";
            try {
                const transcriptItems = await YoutubeTranscript.fetchTranscript(youtubeVideoId);
                transcriptText = transcriptItems.map(item => item.text).join(' ');
            } catch (e) {
                console.log("Transcript not available, using metadata only.");
                transcriptText = "Transcript unavailable.";
            }
            
            contentForAI = [{ text: `Analyze this YouTube video. URL: ${content}\nTranscript: "${transcriptText.substring(0, 30000)}"` }];
        }
    }

    // Using Gemini 2.0/2.5 Pro logic
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: { 
            responseMimeType: "application/json", 
            responseSchema: jsonSchema 
        }
    });

    const result = await model.generateContent(contentForAI);
    const aiJson = JSON.parse(result.response.text());
    
    const textForEmbedding = `Title: ${aiJson.title}\nSummary: ${aiJson.summary}\nTags: ${aiJson.tags.join(', ')}`;
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(textForEmbedding);
    const embedding = embeddingResult.embedding.values;

    const { data: newItem, error: dbError } = await supabase.from('vault_items').insert({ 
        user_id: user.id, 
        content_type: contentType, 
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
    console.error("Process Error", error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}