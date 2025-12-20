import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { MessageSquarePlus, SearchX } from 'lucide-react'
import { redirect } from 'next/navigation'
import { ChatListItem } from './_components/chat-list-item'

export default async function ChatDashboard(props: {
  searchParams?: Promise<{ q?: string }>
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || ''
  
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  // 1. Base Query
  let dbQuery = supabase
    .from('chats')
    .select('*')
    .order('is_pinned', { ascending: false }) // Pinned first
    .order('updated_at', { ascending: false }) // Then newest

  // 2. SEARCH LOGIC: Simple Title Match
  if (query) {
    dbQuery = dbQuery.ilike('title', `%${query}%`)
  }

  const { data: chats } = await dbQuery

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
    <div className="flex flex-col gap-8 w-full p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900">Chat History</h1>
            <p className="text-stone-500 mt-2 text-lg">Chat with your vault, pick up where you left off or start a new inquiry.</p>
        </div>
        <form action={createNewChat}>
            <Button size="lg" className="bg-stone-900 hover:bg-stone-800 text-white shadow-lg cursor-pointer h-12 px-6 text-base">
                <MessageSquarePlus className="mr-2 h-5 w-5" /> New Chat
            </Button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        {chats && chats.length > 0 ? (
            chats.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} />
            ))
        ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-32 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    {query ? <SearchX className="h-10 w-10 text-stone-300" /> : <MessageSquarePlus className="h-10 w-10 text-stone-300" />}
                </div>
                <h3 className="text-xl font-semibold text-stone-900">
                    {query ? `No chats found for "${query}"` : "No conversations yet"}
                </h3>
                {!query && <p className="text-stone-500 mt-2">Start a new chat to explore your vault using AI.</p>}
            </div>
        )}
      </div>
    </div>
  )
}