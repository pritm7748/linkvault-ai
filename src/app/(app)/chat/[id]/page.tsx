import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ChatInterface } from '../_components/chat-interface'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ChatPage(props: Props) {
  const params = await props.params;
  const { id } = params;
  
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  // 1. Fetch Chat Details (Verify ownership)
  const { data: chat, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !chat) {
    notFound()
  }

  // 2. Fetch Messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', id)
    .order('created_at', { ascending: true })

  // 3. Render Client Interface
  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col">
       {/* Passing the chat ID and history to the client component */}
       <ChatInterface chatId={id} initialMessages={messages || []} />
    </div>
  )
}