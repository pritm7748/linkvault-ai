import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { SchemaType, Schema } from '@google/generative-ai'
import * as cheerio from 'cheerio';
import { getYouTubeVideoId, getYouTubeVideoDetails, getYouTubeTranscript } from '@/lib/youtube'
import { generateContentWithFallback, embedContentWithFallback } from '@/lib/gemini' // NEW IMPORT

const jsonSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
  },
  required: ["title", "summary", "tags"]
} as Schema;

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
    } else {
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

    // --- FIX: USE NEW FALLBACK UTILITY ---
    const result: any = await generateContentWithFallback(
        "gemini-2.5-flash", // Primary model
        { responseMimeType: "application/json", responseSchema: jsonSchema },
        contentForAI
    );
    
    const aiJson = JSON.parse(result.response.text());
    
    // --- FIX: USE NEW EMBEDDING UTILITY ---
    const textForEmbedding = `Title: ${aiJson.title}\nSummary: ${aiJson.summary}`;
    const embeddingResult = await embedContentWithFallback(textForEmbedding);
    const embedding = embeddingResult.embedding.values;

    const { data: newItem, error: dbError } = await supabase.from('vault_items').insert({ user_id: user.id, content_type: contentType, original_content: originalContent, storage_path: storagePath, processed_title: aiJson.title, processed_summary: aiJson.summary, processed_tags: aiJson.tags, embedding: embedding }).select().single();
    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    return NextResponse.json({ message: 'Success', newItem });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}