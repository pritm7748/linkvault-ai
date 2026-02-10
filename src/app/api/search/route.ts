import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServer(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await req.json()
    const query = json.query
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    
    // FIX: Force 768 dimensions to match database schema
    const embeddingResult = await embeddingModel.embedContent({
      content: { 
        role: 'user', 
        parts: [{ text: query }] 
      },
      outputDimensionality: 768
    } as any);
    
    const queryEmbedding = embeddingResult.embedding.values;

    const { data: items, error } = await supabase.rpc('match_vault_items', {
      query_embedding: queryEmbedding,
      query_text: query, // --- Pass the raw query text for tag matching ---
      match_threshold: 0.5,
      match_count: 20,
      p_user_id: user.id
    })

    if (error) {
      console.error('Database RPC error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json(items)

  } catch (error: unknown) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}