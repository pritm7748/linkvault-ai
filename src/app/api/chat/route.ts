import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServer(cookieStore)
    
    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId, message } = await req.json()
    if (!chatId || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // 2. Save USER message to DB
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'user',
        content: message
      })

    if (userMsgError) throw new Error("Failed to save user message")

    // 3. Fetch History for Context (Last 10 messages)
    // We send this history to Gemini so it "remembers" the conversation
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(20) // Limit context window to save tokens

    // Transform Supabase history to Gemini format
    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    // 4. Generate AI Response
    const chatSession = model.startChat({
      history: chatHistory, 
      generationConfig: {
        maxOutputTokens: 1000,
      },
    })

    // (Optional: In the future, you can inject Vault Context here for RAG)
    const result = await chatSession.sendMessage(message)
    const aiResponseText = result.response.text()

    // 5. Save AI message to DB
    const { data: aiMsg, error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'assistant',
        content: aiResponseText
      })
      .select()
      .single()

    if (aiMsgError) throw new Error("Failed to save AI message")

    // 6. Update the 'updated_at' timestamp on the Chat itself (to sort by recent)
    await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId)

    return NextResponse.json(aiMsg)

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}