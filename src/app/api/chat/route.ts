import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServer(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { chatId, message } = body

    if (!chatId || !message) {
      return NextResponse.json({ error: 'Missing chat ID or message' }, { status: 400 })
    }

    // FIX: Ensure chatId is treated as a number for the DB
    const numericChatId = Number(chatId)

    // 1. Save USER message
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        chat_id: numericChatId,
        role: 'user',
        content: message
      })

    if (userMsgError) {
        console.error("DB Error (User Msg):", userMsgError)
        throw new Error("Failed to save message to database")
    }

    // 2. Fetch History
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', numericChatId)
      .order('created_at', { ascending: true })
      .limit(30) // Increased context slightly

    if (historyError) console.error("History Fetch Error:", historyError)

    // 3. Format History for Gemini
    // IMPORTANT: Gemini expects the history to NOT include the message we are about to send.
    // Since we just saved the user message to DB in step 1, it might be in 'history' if we aren't careful.
    // We will filter it out if it appears as the very last item, or rely on the fact that startChat sends the NEW message separately.
    
    const validHistory = (history || [])
        .filter(msg => msg.content !== message) // Simple dedupe to be safe
        .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }))

    const chatSession = model.startChat({
      history: validHistory,
    })

    // 4. Generate Response
    const result = await chatSession.sendMessage(message)
    const aiResponseText = result.response.text()

    // 5. Save AI message
    const { data: aiMsg, error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        chat_id: numericChatId,
        role: 'assistant',
        content: aiResponseText
      })
      .select()
      .single()

    if (aiMsgError) {
        console.error("DB Error (AI Msg):", aiMsgError)
        throw new Error("Failed to save AI response")
    }

    // 6. Update Chat Timestamp
    await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', numericChatId)

    return NextResponse.json(aiMsg)

  } catch (error: any) {
    console.error('Chat API Fatal Error:', error)
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error' 
    }, { status: 500 })
  }
}