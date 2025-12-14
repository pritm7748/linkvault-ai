import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { MessageSquarePlus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { ChatListItem } from './_components/chat-list-item'

export default async function ChatDashboard() {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  const { data: chats } = await supabase
    .from('chats')
    .select('*')
    .order('updated_at', { ascending: false })

  async function createNewChat() {
    'use server'
    const cookieStore = cookies()
    const supabase = createServer(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: newChat, error } = await supabase
        .from('chats')
        .insert({ user_id: user.id, title: 'New Conversation' })
        .select()
        .single()
    
    if (!error && newChat) {
        redirect(`/chat/${newChat.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">Chat with Vault</h1>
            <p className="text-stone-500 mt-1">Ask questions and get answers from your saved content.</p>
        </div>
        <form action={createNewChat}>
            <Button size="lg" className="bg-stone-900 hover:bg-stone-800 text-white shadow-md cursor-pointer">
                <MessageSquarePlus className="mr-2 h-5 w-5" /> New Chat
            </Button>
        </form>
      </div>

      <div className="grid gap-4">
        {chats && chats.length > 0 ? (
            chats.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} />
            ))
        ) : (
            <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-lg">
                <MessageSquarePlus className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-900">No conversations yet</h3>
                <p className="text-stone-500 mt-2">Start a new chat to explore your vault using AI.</p>
            </div>
        )}
      </div>
    </div>
  )
}