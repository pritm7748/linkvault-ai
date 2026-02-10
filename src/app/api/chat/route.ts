import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// We need two models: one for chat, one for vector embeddings
const chatModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

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
    // FIX: Force 768 dimensions to match database schema
    const embeddingResult = await embeddingModel.embedContent({
        content: { 
          role: 'user', 
          parts: [{ text: message }] 
        },
        outputDimensionality: 768
    } as any);
    
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
You are LinkVault AI, a highly intelligent and organized personal knowledge assistant. Your goal is to synthesize the user's saved notes, links, and content into clear, actionable answers.

USER CURRENT QUERY: "${message}"

=== RETRIEVED VAULT CONTEXT ===
${vaultContext || "NO RELEVANT VAULT ITEMS FOUND."}
===============================

### RESPONSE GUIDELINES:

1. **Synthesize, Don't Just Quote:** - Instead of saying "Note 1 says X, Note 2 says Y," combine the information into a coherent answer. 
   - If sources conflict, point out the discrepancy.

2. **Strict Citation Style:** - Every time you state a fact from the vault, strictly reference the source title/link immediately after. 
   - Format: "React hooks allow state management [Source: 'React Docs'](link_if_available)."

3. **Handling Gaps (The Fallback):**
   - **Scenario A (Context Found):** Answer using *only* the vault info. Do not add outside knowledge unless it is necessary to explain a concept found in the notes.
   - **Scenario B (No Context):** If the "Retrieved Vault Context" is empty or irrelevant, you **MUST** start your reply with: *"I couldn't find anything in your LinkVault about that, but generally speaking..."* and then provide a helpful AI response.

4. **Formatting:**
   - Use **Markdown** (headers, bolding, bullet points) to make the response easy to scan.
   - If the user asks for a list, summary, or code, format it accordingly.

5. **Tone:** Helpful, concise, and objective. You are an assistant, not a chatbot friend.
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
    // Note: Creating a chat session with history, but sending the RAG prompt as the new message
    const chatSession = chatModel.startChat({ history: validHistory })
    
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