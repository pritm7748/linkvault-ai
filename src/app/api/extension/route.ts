import { createServer } from '@/lib/supabase/server' // Change to relative path if needed
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SchemaType, Schema } from '@google/generative-ai'
import { getYouTubeVideoId, getYouTubeVideoDetails, getYouTubeTranscript } from '@/lib/youtube'
import { generateContentWithFallback, embedContentWithFallback } from '@/lib/gemini'

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
  
  // CORS Headers for Extension (Important if running locally)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized. Please log in to LinkVault.' }, { status: 401, headers })
  }

  try {
    const body = await req.json()
    const { type, content, title, sourceUrl, pageText } = body

    let contentParts: any[] = [];
    let processedType = type;
    
    let finalPrompt = `
      Analyze the following content. Perform these actions:
      1. Create a concise, descriptive title.
      2. Generate a list of 5-10 relevant tags.
      3. Write a detailed, paragraph-long summary. You MUST incorporate key insights, specific names, or technical terms mentioned in the text to optimize for searchability.
    `;

    // 1. YouTube Handling
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
            contentParts = [{ text: finalPrompt }];
        } else {
            // 2. Web Page Handling (Deep DOM Extraction)
            const textToAnalyze = pageText || `Link URL: ${content} - Title: ${title}`;
            finalPrompt += `\n\nTitle: "${title}"\nURL: "${content}"\nPage Content: "${textToAnalyze.substring(0, 15000)}"`;
            contentParts = [{ text: finalPrompt }];
        }
    } 
    // 3. Highlight / Note Handling
    else if (type === 'note') {
        finalPrompt += `\n\nUser Note from ${sourceUrl}:\n"${content}"`;
        contentParts = [{ text: finalPrompt }];
    }
    // 4. Image Handling (Gemini Vision)
    else if (type === 'image') {
        try {
            const imageResp = await fetch(content);
            const imageBuffer = await imageResp.arrayBuffer();
            const base64Data = Buffer.from(imageBuffer).toString('base64');
            const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';
            
            finalPrompt += `\n\nAnalyze this image saved from ${sourceUrl}. Describe it in detail for a knowledge vault.`;
            contentParts = [
              { text: finalPrompt }, 
              { inlineData: { mimeType: mimeType, data: base64Data } }
            ];
        } catch (e) {
            contentParts = [{ text: finalPrompt + `\n\nImage URL: ${content} (Could not fetch image data for vision analysis)` }];
        }
    }

    // --- AI GENERATION ---
    const result: any = await generateContentWithFallback(
        "gemini-3-flash",  // Using the updated model name
        { responseMimeType: "application/json", responseSchema: jsonSchema },
        contentParts
    );
    const aiJson = JSON.parse(result.response.text());

    // --- VECTORIZATION ---
    // (This relies on the embedContentWithFallback utility we fixed earlier to output 768 dimensions!)
    const textForEmbedding = `Title: ${aiJson.title}\nSummary: ${aiJson.summary}`;
    const embeddingResult = await embedContentWithFallback(textForEmbedding);
    
    // Extract the embedding array from the response
    const embedding = embeddingResult.embedding;

    // --- STORAGE ---
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

    return NextResponse.json({ success: true, item: newItem }, { headers })

  } catch (error: any) {
    console.error("Extension API Error:", error);
    return NextResponse.json({ error: error.message || 'Processing failed' }, { status: 500, headers })
  }
}