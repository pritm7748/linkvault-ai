'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, Pencil, Trash2, Check, X, MessageSquare } from 'lucide-react'
import { renameChat, deleteChat } from '../actions'

type ChatListItemProps = {
  chat: {
    id: number;
    title: string | null;
    updated_at: string;
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

  if (isDeleting) return null; 

  return (
    <div className="group relative w-full">
        {isEditing ? (
            // Editing State (Horizontal Bar)
            <div className="flex items-center gap-4 p-3 bg-white border border-stone-300 rounded-lg shadow-sm">
                <Input 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    className="h-10 text-base font-medium flex-1"
                    autoFocus
                />
                <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-10 w-10 text-stone-400 hover:text-stone-600" onClick={() => setIsEditing(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                    <Button size="icon" className="h-10 w-10 bg-stone-900 text-white hover:bg-stone-700" onClick={handleRename}>
                        <Check className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        ) : (
            <Link href={`/chat/${chat.id}`} className="block w-full">
                <Card className="flex flex-row items-center justify-between p-4 border-stone-200 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer bg-white group">
                    
                    {/* Left: Icon + Text */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="bg-stone-50 p-3 rounded-full border border-stone-100 text-stone-400 group-hover:text-purple-600 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <h3 className="font-bold text-lg text-stone-900 truncate group-hover:text-purple-700 transition-colors">
                                {chat.title || "Untitled Conversation"}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-stone-400">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(chat.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions (Visible on Hover) */}
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pl-4 border-l border-transparent md:border-stone-100 md:group-hover:border-stone-200">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-stone-400 hover:text-stone-700 hover:bg-stone-100" 
                            onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                            title="Rename"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-stone-400 hover:text-red-600 hover:bg-red-50" 
                            onClick={handleDelete}
                            title="Delete"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            </Link>
        )}
    </div>
  )
}