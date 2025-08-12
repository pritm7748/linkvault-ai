import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, type } = await req.json()
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(query);
    const queryEmbedding = embeddingResult.embedding.values;

    const { data: items, error } = await supabase.rpc('match_vault_items', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 20,
    })

    if (error) {
      console.error('Database RPC error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    const filteredItems = type && type !== 'all'
      ? items.filter((item: { content_type: string }) => item.content_type === type)
      : items;

    return NextResponse.json(filteredItems)

  // THE FIX: Explicitly type the error object
  } catch (error: unknown) {
    console.error("Error in /api/search:", error)
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
