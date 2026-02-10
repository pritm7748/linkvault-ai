// src/app/api/ai-query/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- UPDATED: Add all fields needed to display a source card ---
type MatchedItem = {
  id: number;
  processed_title: string;
  processed_summary: string;
  content_type: string;
  is_favorited: boolean;
  // Add any other fields your RPC function returns that you want to display
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServer(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await req.json()
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(query);
    const queryEmbedding = embeddingResult.embedding.values;

    const { data: items, error: rpcError } = await supabase.rpc('match_vault_items', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // Using the lower threshold we set
      match_count: 5,
      p_user_id: user.id
    })

    if (rpcError) {
      throw new Error(`Database RPC error: ${rpcError.message}`)
    }
    
    const typedItems = items as MatchedItem[];

    if (!typedItems || typedItems.length === 0) {
        // --- UPDATED: Return an empty sources array ---
        return NextResponse.json({ 
          answer: "I couldn't find any relevant information in your vault to answer that question.",
          sources: [] 
        })
    }

    const context = typedItems.map(item => `Title: ${item.processed_title}\nSummary: ${item.processed_summary}`).join('\n\n---\n\n');
    
    const prompt = `
      You are a helpful AI assistant for a service called LinkVault. A user has asked a question about the content they've saved in their vault.
      
      Based ONLY on the following document summaries provided as context, provide a concise and direct answer to the user's question.
      Do not use any outside knowledge. If the answer cannot be found in the provided context, state that clearly.

      CONTEXT:
      ---
      ${context}
      ---
      
      USER'S QUESTION:
      ${query}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const answer = response.text();

    // --- UPDATED: Return the answer AND the source items ---
    return NextResponse.json({ answer, sources: typedItems });

  } catch (error: unknown) {
    console.error("Error in /api/ai-query:", error)
    if (error instanceof Error && error.message.includes('429')) {
        return NextResponse.json({ 
            answer: "The AI is currently busy due to high demand on the free plan. Please try again in a minute.",
            sources: []
        });
    }
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}