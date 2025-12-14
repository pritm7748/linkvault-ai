import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// We need two models: one for chat, one for vector embeddings
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServer(cookieStore)
    
    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { chatId, message } = body

    if (!chatId || !message) {
      return NextResponse.json({ error: 'Missing chat ID or message' }, { status: 400 })
    }
    const numericChatId = Number(chatId)

    // 2. Save USER message to DB immediately
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({ chat_id: numericChatId, role: 'user', content: message })

    if (userMsgError) throw new Error("Failed to save user message")

    // --- STEP 3: PERFORM VECTOR SEARCH (The "RAG" Magic) ---
    
    // A. Generate embedding for the user's question
    const embeddingResult = await embeddingModel.embedContent(message)
    const embedding = embeddingResult.embedding.values

    // B. Search Supabase for relevant vault items
    const { data: similarItems, error: searchError } = await supabase
      .rpc('match_vault_items', {
        query_embedding: embedding,
        match_threshold: 0.5, // Only return moderately relevant matches
        match_count: 5        // Top 5 pieces of context
      })

    if (searchError) console.error("Vector Search Error:", searchError)

    // C. Format the retrieved context into a string
    let vaultContext = ""
    if (similarItems && similarItems.length > 0) {
        vaultContext = similarItems.map((item: any) => 
            `[Source: ${item.processed_title || 'Untitled Note'}]\nSummary: ${item.processed_summary}\nContent Snippet: ${item.original_content?.substring(0, 300)}...`
        ).join("\n\n")
    }

    // --- STEP 4: PREPARE GEMINI PROMPT ---

    // We inject a "System Instruction" style prompt into the history
    const ragPrompt = `
    You are LinkVault AI, a personalized knowledge assistant.
    
    USER QUESTION: "${message}"

    Here is relevant information retrieved from the user's personal vault:
    --------------------------------------------------
    ${vaultContext || "No directly relevant items found in the vault."}
    --------------------------------------------------

    INSTRUCTIONS:
    1. PRIORITIZE the Vault Context above. If the answer is in the context, base your response heavily on it.
    2. CITATIONS: If you use information from a [Source], reference it (e.g., "According to your note on 'React Hooks'...").
    3. FALLBACK: If the vault context is empty or irrelevant to the question, explicitly say: "I couldn't find anything specific in your vault about this, but here is some general information:" and then provide a standard AI answer.
    `

    // 5. Fetch Chat History (for conversation continuity)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', numericChatId)
      .order('created_at', { ascending: true })
      .limit(20)

    const validHistory = (history || [])
        .filter(msg => msg.content !== message) // Dedupe current message
        .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }))

    // 6. Generate Response
    const chatSession = chatModel.startChat({ history: validHistory })
    
    // Note: We send the *Enriched RAG Prompt* instead of just the raw message
    const result = await chatSession.sendMessage(ragPrompt)
    const aiResponseText = result.response.text()

    // 7. Save AI Response
    const { data: aiMsg, error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        chat_id: numericChatId,
        role: 'assistant',
        content: aiResponseText
      })
      .select()
      .single()

    if (aiMsgError) throw new Error("Failed to save AI response")

    // 8. Update Chat Timestamp
    await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', numericChatId)

    return NextResponse.json(aiMsg)

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}