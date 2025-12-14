'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
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
    <div className="group relative h-full">
        {isEditing ? (
            <Card className="h-full border-stone-300 shadow-md">
                <CardContent className="p-4 flex flex-col gap-3 justify-center h-full">
                    <Input 
                        value={newTitle} 
                        onChange={(e) => setNewTitle(e.target.value)} 
                        className="h-9 text-sm font-medium"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 text-stone-400 hover:text-stone-600" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="h-8 bg-stone-900 text-white hover:bg-stone-700" onClick={handleRename}>
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <Link href={`/chat/${chat.id}`} className="block h-full">
                <Card className="h-full border-stone-200 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer bg-white flex flex-col justify-between group">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-stone-400 group-hover:text-purple-600 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-stone-900 line-clamp-2 leading-tight group-hover:text-purple-700 transition-colors">
                                    {chat.title || "Untitled Conversation"}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                    
                    <CardFooter className="px-5 py-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between rounded-b-xl">
                        <div className="flex items-center gap-2 text-xs font-medium text-stone-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{new Date(chat.updated_at).toLocaleDateString()}</span>
                        </div>

                        {/* Direct Actions - Visible on Hover */}
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-stone-400 hover:text-stone-700 hover:bg-white" 
                                onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                                title="Rename"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50" 
                                onClick={handleDelete}
                                title="Delete"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </Link>
        )}
    </div>
  )
}