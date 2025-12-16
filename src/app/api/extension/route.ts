import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'
import { getYouTubeVideoId, getYouTubeVideoDetails, getYouTubeTranscript } from '@/lib/youtube' // IMPORT SHARED UTILS

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

async function generateWithRetry(model: any, content: any, retries = 3, initialDelay = 2000) {
  for (let i = 0; i < retries; i++) {
    try { return await model.generateContent(content); } 
    catch (error: any) {
      const isOverloaded = error.message?.includes('503') || error.message?.includes('429');
      if (i === retries - 1 || !isOverloaded) throw error;
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
    }
  }
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await req.json()
    const { type, content, title, sourceUrl, pageText } = body

    let contentForAI: any[] = [];
    let processedType = type; // Allow us to upgrade 'link' to 'video'
    
    let finalPrompt = `
      Analyze the following content. Perform these actions:
      1. Create a concise, descriptive title.
      2. Generate a list of 5-10 relevant tags.
      3. Write a detailed, paragraph-long summary. You MUST incorporate key insights, specific names, or technical terms mentioned in the text to optimize for searchability.
      
      Here is the content:
    `;

    if (type === 'link') {
        // --- NEW: DETECT YOUTUBE ---
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
            // Standard Link
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

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: { responseMimeType: "application/json", responseSchema: jsonSchema }
    });
    
    const result: any = await generateWithRetry(model, contentForAI);
    const aiJson = JSON.parse(result.response.text());

    const textForEmbedding = `Title: ${aiJson.title}\nSummary: ${aiJson.summary}`;
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(textForEmbedding);
    const embedding = embeddingResult.embedding.values;

    const insertData = {
      user_id: user.id,
      content_type: processedType, // Uses 'video' if detected
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