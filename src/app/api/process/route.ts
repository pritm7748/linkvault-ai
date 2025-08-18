// src/app/api/process/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { GoogleGenerativeAI, Part, Schema, SchemaType } from '@google/generative-ai'
import * as cheerio from 'cheerio';
import { cookies } from 'next/headers'; // --- ADD THIS IMPORT ---

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function getYouTubeVideoDetails(videoId: string): Promise<{ title: string; description: string }> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) throw new Error('Missing YOUTUBE_API_KEY.');
  
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`YouTube API failed: ${response.status}`);
    const data = await response.json();
    const snippet = data.items[0]?.snippet;
    if (!snippet) return { title: 'Video Not Found', description: 'This video may be private or deleted.' };
    return { title: snippet.title, description: snippet.description };
  } catch (error) {
    console.error('YouTube API call failed:', error);
    return { title: 'API Error', description: 'Could not fetch details from YouTube API.' };
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies(); // --- ADD THIS LINE ---
  const supabase = createServer(cookieStore); // --- PASS cookieStore HERE & REMOVE AWAIT ---
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const contentType = formData.get('contentType') as string;
    let originalContent: string | null = null;
    let contentForAI: (string | Part)[];
    let storagePath: string | null = null;
    let finalPrompt = '';

    if (contentType === 'image') {
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('vault.images').upload(filePath, file);
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
      storagePath = uploadData.path;
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString('base64');
      contentForAI = [{ text: "Analyze this image..." }, { inlineData: { mimeType: file.type, data: base64Data } }];
      originalContent = file.name;
    } else {
        const content = formData.get('content') as string;
        originalContent = content;
        let title = '';
        let description = '';

        if (contentType === 'note') {
          finalPrompt = `Analyze the following note: "${content}"`;
        } else if (contentType === 'link') {
            const response = await fetch(content);
            if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
            const html = await response.text();
            const $ = cheerio.load(html);
            title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'Title not found';
            description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
            const bodyText = $('body').text().replace(/\s\s+/g, ' ').trim();
            finalPrompt = `Analyze the following content from a webpage titled "${title}". The meta description is "${description}". The body text is: "${bodyText.substring(0, 5000)}"`;
        } else if (contentType === 'video') {
            const youtubeVideoId = getYouTubeVideoId(content);
            if (!youtubeVideoId) {
                throw new Error("Invalid URL. Only YouTube video links are supported at this time.");
            }
            const details = await getYouTubeVideoDetails(youtubeVideoId);
            title = details.title;
            description = details.description;
            finalPrompt = `Act as a media analyst. Based on the video's official title "${title}" and its description "${description}", provide an insightful summary. For the title of your response, use the actual video title provided.`;
        }
        
        contentForAI = [{ text: finalPrompt }];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", responseSchema: jsonSchema }});
    const result = await model.generateContent(contentForAI);
    const aiJson = JSON.parse(result.response.text());
    
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(aiJson.summary);
    const embedding = embeddingResult.embedding.values;

    const { data: newItem, error: dbError } = await supabase.from('vault_items').insert({ user_id: user.id, content_type: contentType, original_content: originalContent, storage_path: storagePath, processed_title: aiJson.title, processed_summary: aiJson.summary, processed_tags: aiJson.tags, embedding: embedding }).select().single();
    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    return NextResponse.json({ message: 'Success', newItem });

  } catch (error: unknown) {
    console.error("Error in /api/process:", error);
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}