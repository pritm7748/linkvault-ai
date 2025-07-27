import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai'
import * as cheerio from 'cheerio'

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
    "entities": {
        "type": SchemaType.OBJECT,
        "properties": {
            "dates": { "type": SchemaType.ARRAY, "items": { "type": SchemaType.STRING } },
            "people": { "type": SchemaType.ARRAY, "items": { "type": SchemaType.STRING } },
            "organizations": { "type": SchemaType.ARRAY, "items": { "type": SchemaType.STRING } }
        }
    }
  },
  required: ["title", "summary", "tags", "entities"]
};

export async function POST(req: NextRequest) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const contentType = formData.get('contentType') as string
    let originalContent: string | null = null;
    let textToAnalyze: string = "";
    let contentForAI: string | (string | { inlineData: { mimeType: string; data: string; } })[];

    if (contentType === 'image') {
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString('base64');
      contentForAI = [
        "Analyze this image. Extract any text, describe the content, and identify key information. Provide a title, a concise summary, relevant tags, and any named entities (dates, people, organizations).",
        { inlineData: { mimeType: file.type, data: base64Data } }
      ];
      originalContent = `Image Upload: ${file.name}`;
    } else {
        if (contentType === 'link') {
            const url = formData.get('content') as string;
            originalContent = url;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
                const html = await response.text();
                const $ = cheerio.load(html);
                $('script, style, nav, footer, header, aside').remove();
                let bodyText = $('article, main, body').text();
                bodyText = bodyText.replace(/\s\s+/g, ' ').trim();
                textToAnalyze = bodyText.substring(0, 8000);
            } catch (scrapeError: unknown) {
                console.error("Scraping error:", scrapeError);
                textToAnalyze = `The provided URL could not be scraped. Please analyze the URL itself: ${originalContent}`;
            }
        } else { // 'note'
            const note = formData.get('content') as string;
            originalContent = note;
            textToAnalyze = note;
        }
        contentForAI = `Analyze the following content: "${textToAnalyze}". Provide a title, a concise summary, relevant tags, and any named entities (dates, people, organizations).`;
    }

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json", responseSchema: jsonSchema }
    });
    
    const result = await model.generateContent(contentForAI);
    const response = result.response;
    const aiResponseText = response.text();
    const aiJson = JSON.parse(aiResponseText);
    
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(aiJson.summary);
    const embedding = embeddingResult.embedding.values;

    const { data: newItem, error: dbError } = await supabase
      .from('vault_items')
      .insert({
        user_id: user.id,
        content_type: contentType,
        original_content: originalContent,
        processed_title: aiJson.title,
        processed_summary: aiJson.summary,
        processed_tags: aiJson.tags,
        processed_entities: aiJson.entities,
        embedding: embedding,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return NextResponse.json({ message: 'Success', newItem });
  // THE FIX: Explicitly type the error object
  } catch (error: unknown) {
    console.error("Error in /api/process:", error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
