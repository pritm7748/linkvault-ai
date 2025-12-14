import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquarePlus, Clock, ChevronRight } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function ChatDashboard() {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  // Fetch existing chats
  const { data: chats } = await supabase
    .from('chats')
    .select('*')
    .order('updated_at', { ascending: false })

  // Server Action to create a new chat
  async function createNewChat() {
    'use server'
    const cookieStore = cookies()
    const supabase = createServer(cookieStore)
    
    // --- FIX: Correctly destructure the user object ---
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
                <Link href={`/chat/${chat.id}`} key={chat.id}>
                    <Card className="hover:border-stone-400 transition-colors cursor-pointer group">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-stone-100 p-2 rounded-full text-stone-500 group-hover:bg-stone-200 transition-colors">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-stone-900">{chat.title || "Untitled Conversation"}</h3>
                                    <p className="text-xs text-stone-400">
                                        {new Date(chat.updated_at).toLocaleDateString()} at {new Date(chat.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-stone-500" />
                        </CardContent>
                    </Card>
                </Link>
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