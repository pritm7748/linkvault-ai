// src/app/api/ai-query/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type MatchedItem = {
  id: number;
  processed_title: string;
  processed_summary: string;
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

    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(query);
    const queryEmbedding = embeddingResult.embedding.values;

    const { data: items, error: rpcError } = await supabase.rpc('match_vault_items', {
      query_embedding: queryEmbedding,
      match_threshold: 0.75,
      match_count: 5,
      p_user_id: user.id
    })

    if (rpcError) {
      throw new Error(`Database RPC error: ${rpcError.message}`)
    }
    
    const typedItems = items as MatchedItem[];

    if (!typedItems || typedItems.length === 0) {
        return NextResponse.json({ answer: "I couldn't find any relevant information in your vault to answer that question." })
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

    // --- THE FIX: Switched from 'gemini-1.5-pro-latest' to the more efficient 'gemini-1.5-flash' ---
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const answer = response.text();

    return NextResponse.json({ answer });

  } catch (error: unknown) {
    console.error("Error in /api/ai-query:", error)
    // Check for specific quota failure error from Google
    if (error instanceof Error && error.message.includes('429')) {
        return NextResponse.json({ 
            answer: "The AI is currently busy due to high demand on the free plan. Please try again in a minute." 
        });
    }
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}