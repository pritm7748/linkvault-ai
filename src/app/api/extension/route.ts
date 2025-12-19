import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SchemaType, Schema } from '@google/generative-ai'
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

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized. Please log in to LinkVault.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, content, title, sourceUrl, pageText } = body

    let contentForAI: any[] = [];
    let processedType = type;
    
    let finalPrompt = `
      Analyze the following content. Perform these actions:
      1. Create a concise, descriptive title.
      2. Generate a list of 5-10 relevant tags.
      3. Write a detailed, paragraph-long summary. You MUST incorporate key insights, specific names, or technical terms mentioned in the text to optimize for searchability.
      
      Here is the content:
    `;

    if (type === 'link') {
        const videoId = getYouTubeVideoId(content);
        if (videoId) {
            processedType = 'video';
            const details = await getYouTubeVideoDetails(videoId);
            const transcript = await getYouTubeTranscript(videoId);
            
            const bodyText = transcript.length > 0 
                ? `TRANSCRIPT:\n${transcript}` 
                : `DESCRIPTION:\n${details.description}`;
                
            finalPrompt += `\n\nYouTube Video: "${details.title}"\nContent: "${bodyText.substring(0, 15000)}"`;
        } else {
            const textToAnalyze = pageText || `Link URL: ${content} - Title: ${title}`;
            finalPrompt += `\n\nTitle: "${title}"\nURL: "${content}"\nPage Content: "${textToAnalyze.substring(0, 10000)}"`;
        }
        contentForAI = [{ text: finalPrompt }];
    } 
    else if (type === 'note') {
        finalPrompt += `\n\nUser Note from ${sourceUrl}:\n"${content}"`;
        contentForAI = [{ text: finalPrompt }];
    }
    else if (type === 'image') {
        try {
            const imageResp = await fetch(content);
            const imageBuffer = await imageResp.arrayBuffer();
            const base64Data = Buffer.from(imageBuffer).toString('base64');
            const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';
            finalPrompt += `\n\n(An image from ${sourceUrl})`;
            contentForAI = [{ text: finalPrompt }, { inlineData: { mimeType: mimeType, data: base64Data } }];
        } catch (e) {
            contentForAI = [{ text: finalPrompt + `\n\nImage URL: ${content} (Could not fetch image data)` }];
        }
    }

    // --- FIX: USE FALLBACK UTILITY ---
    const result: any = await generateContentWithFallback(
        "gemini-3-flash-preview", 
        { responseMimeType: "application/json", responseSchema: jsonSchema },
        contentForAI
    );
    const aiJson = JSON.parse(result.response.text());

    // --- FIX: USE EMBEDDING UTILITY ---
    const textForEmbedding = `Title: ${aiJson.title}\nSummary: ${aiJson.summary}`;
    const embeddingResult = await embedContentWithFallback(textForEmbedding);
    const embedding = embeddingResult.embedding.values;

    const insertData = {
      user_id: user.id,
      content_type: processedType,
      original_content: content,
      original_url: sourceUrl || content,
      processed_title: aiJson.title,
      processed_summary: aiJson.summary,
      processed_tags: aiJson.tags,
      embedding: embedding,
      is_favorited: false
    };

    const { data: newItem, error: dbError } = await supabase.from('vault_items').insert(insertData).select().single()
    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    return NextResponse.json({ success: true, item: newItem })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Processing failed' }, { status: 500 })
  }
}