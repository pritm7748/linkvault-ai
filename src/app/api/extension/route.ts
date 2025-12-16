import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'

// 1. Setup Gemini
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

// --- HELPER: Retry Logic for Overloaded Models ---
async function generateWithRetry(model: any, content: any, retries = 3, initialDelay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(content);
    } catch (error: any) {
      // If it's the last attempt, or if it's NOT a 503/429 error, throw it.
      const isOverloaded = error.message?.includes('503') || error.message?.includes('429') || error.message?.includes('overloaded');
      
      if (i === retries - 1 || !isOverloaded) {
        throw error;
      }

      // Wait (Exponential Backoff: 2s, 4s, 8s...)
      const waitTime = initialDelay * Math.pow(2, i);
      console.log(`Gemini overloaded. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  // 1. Check Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized. Please log in to LinkVault.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, content, title, sourceUrl, pageText } = body

    let contentForAI: any[] = [];
    
    // --- 2. PREPARE CONTENT FOR GEMINI ---
    let finalPrompt = `
      Analyze the following content. Perform these actions:
      1. Create a concise, descriptive title.
      2. Generate a list of 5-10 relevant tags.
      3. Write a detailed, paragraph-long summary. Naturally incorporate keywords for searchability.
      
      Here is the content:
    `;

    if (type === 'link') {
        const textToAnalyze = pageText || `Link URL: ${content} - Title: ${title}`;
        finalPrompt += `\n\nTitle: "${title}"\nURL: "${content}"\nPage Content: "${textToAnalyze.substring(0, 10000)}"`;
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
            contentForAI = [
                { text: finalPrompt },
                { inlineData: { mimeType: mimeType, data: base64Data } }
            ];
        } catch (e) {
            console.error("Failed to fetch image for analysis", e);
            contentForAI = [{ text: finalPrompt + `\n\nImage URL: ${content} (Could not fetch image data)` }];
        }
    }

    // --- 3. CALL GEMINI (With Retry) ---
    // If 2.5-flash keeps failing, switch string to "gemini-1.5-flash"
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash", 
        generationConfig: { responseMimeType: "application/json", responseSchema: jsonSchema }
    });
    
    // FIX: Using the retry helper here
    const result: any = await generateWithRetry(model, contentForAI);
    const aiJson = JSON.parse(result.response.text());

    // --- 4. CALL GEMINI (Embeddings) ---
    const textForEmbedding = `Title: ${aiJson.title}\nSummary: ${aiJson.summary}`;
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(textForEmbedding);
    const embedding = embeddingResult.embedding.values;

    // --- 5. SAVE TO DATABASE ---
    const insertData = {
      user_id: user.id,
      content_type: type,
      original_content: content,
      original_url: sourceUrl || content,
      processed_title: aiJson.title,
      processed_summary: aiJson.summary,
      processed_tags: aiJson.tags,
      embedding: embedding,
      is_favorited: false
    };

    const { data: newItem, error: dbError } = await supabase
      .from('vault_items')
      .insert(insertData)
      .select()
      .single()

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    return NextResponse.json({ success: true, item: newItem })

  } catch (error: any) {
    console.error("Extension Error:", error);
    return NextResponse.json({ error: error.message || 'Processing failed' }, { status: 500 })
  }
}