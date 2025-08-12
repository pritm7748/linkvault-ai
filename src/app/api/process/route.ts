// src/app/api/process/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { GoogleGenerativeAI, Part, Schema, SchemaType } from '@google/generative-ai'

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

export async function POST(req: NextRequest) {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const contentType = formData.get('contentType') as string;
    const originalContent = formData.get('content') as string;
    
    let contentForAI: (string | Part)[];
    let storagePath: string | null = null;
    let finalPrompt = '';

    // The logic is now much simpler. We expect the title and description to be provided for links/videos.
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;

    if (contentType === 'image') {
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('vault.images').upload(filePath, file);
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
      storagePath = uploadData.path;
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString('base64');
      contentForAI = [{ text: "Analyze this image and provide a title, summary, and tags." }, { inlineData: { mimeType: file.type, data: base64Data } }];
    } else if (contentType === 'note') {
      finalPrompt = `Analyze the following note: "${originalContent}"`;
      contentForAI = [{ text: finalPrompt }];
    } else { // For links and videos
      finalPrompt = `Act as a media analyst. Based on the title "${title}" and description "${description}", provide an insightful summary and relevant tags. For the title of your response, use the actual title provided.`;
      contentForAI = [{ text: finalPrompt }];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", responseSchema: jsonSchema }});
    const result = await model.generateContent(contentForAI);
    const aiJson = JSON.parse(result.response.text());
    
    // If the bookmarklet provided a title, use it instead of the AI's version for consistency.
    const finalTitle = title || aiJson.title;

    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(aiJson.summary);
    const embedding = embeddingResult.embedding.values;

    const { data: newItem, error: dbError } = await supabase.from('vault_items').insert({ user_id: user.id, content_type: contentType, original_content: originalContent, storage_path: storagePath, processed_title: finalTitle, processed_summary: aiJson.summary, processed_tags: aiJson.tags, embedding: embedding }).select().single();
    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    return NextResponse.json({ message: 'Success', newItem });

  } catch (error: unknown) {
    console.error("Error in /api/process:", error);
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}