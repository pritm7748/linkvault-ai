'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, Pencil, Trash2, Check, X, MessageSquare, Pin } from 'lucide-react'
import { renameChat, deleteChat, togglePinChat } from '../actions'

type ChatListItemProps = {
  chat: {
    id: number;
    title: string | null;
    updated_at: string;
    is_pinned: boolean | null;
  }
}

export function ChatListItem({ chat }: ChatListItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newTitle, setNewTitle] = useState(chat.title || '')
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() 
    await renameChat(chat.id, newTitle)
    setIsEditing(false)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if(!confirm("Delete this conversation?")) return;
    
    setIsDeleting(true)
    await deleteChat(chat.id)
    router.refresh()
  }

  const handlePin = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await togglePinChat(chat.id, chat.is_pinned || false)
  }

  if (isDeleting) return null; 

  return (
    <div className="group relative w-full">
        {isEditing ? (
            <div className="flex items-center gap-2 p-3 bg-white border border-stone-300 rounded-lg shadow-sm">
                <Input 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    className="h-9 text-sm font-medium flex-1 min-w-0"
                    autoFocus
                />
                <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-stone-400" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="h-9 w-9 bg-stone-900 text-white" onClick={handleRename}>
                        <Check className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        ) : (
            <Link href={`/chat/${chat.id}`} className="block w-full">
                <Card className={`flex flex-row items-center justify-between p-3 md:p-4 border-stone-200 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer bg-white group ${chat.is_pinned ? 'border-l-4 border-l-stone-900 bg-stone-50/50' : ''}`}>
                    
                    {/* Left: Icon + Text (Responsive sizing) */}
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                        <div className={`p-2 md:p-3 rounded-full border border-stone-100 shrink-0 transition-colors ${chat.is_pinned ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-400 group-hover:text-purple-600 group-hover:bg-purple-50 group-hover:border-purple-100'}`}>
                            {chat.is_pinned ? <Pin className="h-4 w-4 md:h-5 md:w-5" /> : <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <h3 className="font-bold text-base md:text-lg text-stone-900 truncate group-hover:text-purple-700 transition-colors">
                                {chat.title || "Untitled Conversation"}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-stone-400">
                                <Clock className="h-3 w-3" />
                                <span className="truncate">{new Date(chat.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions (Smaller buttons on mobile) */}
                    <div className="flex items-center gap-0 md:gap-1 pl-2 md:pl-4 border-l border-transparent md:border-stone-100 md:group-hover:border-stone-200 shrink-0">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-8 w-8 md:h-9 md:w-9 hover:bg-stone-100 ${chat.is_pinned ? 'text-stone-900' : 'text-stone-400 hover:text-stone-700'}`}
                            onClick={handlePin}
                        >
                            <Pin className={`h-3 w-3 md:h-4 md:w-4 ${chat.is_pinned ? 'fill-current' : ''}`} />
                        </Button>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 md:h-9 md:w-9 text-stone-400 hover:text-stone-700 hover:bg-stone-100" 
                            onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                        >
                            <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 md:h-9 md:w-9 text-stone-400 hover:text-red-600 hover:bg-red-50" 
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                    </div>
                </Card>
            </Link>
        )}
    </div>
  )
}