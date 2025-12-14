'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Clock, ChevronRight, MoreVertical, Pencil, Trash2, Check, X } from 'lucide-react'
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
    e.stopPropagation() // Prevent navigating to the chat
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

  if (isDeleting) return null; // Optimistic hide

  return (
    <div className="group relative">
        {isEditing ? (
            <div className="flex items-center gap-2 p-2 bg-white border border-stone-300 rounded-lg shadow-sm">
                <Input 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    className="h-8 text-sm"
                    autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleRename}>
                    <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-stone-400" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        ) : (
            <Link href={`/chat/${chat.id}`}>
                <Card className="hover:border-stone-400 transition-colors cursor-pointer group">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-stone-100 p-2 rounded-full text-stone-500 group-hover:bg-stone-200 transition-colors">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-stone-900 line-clamp-1">{chat.title || "Untitled Conversation"}</h3>
                                <p className="text-xs text-stone-400">
                                    {new Date(chat.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        
                        {/* Action Menu (Visible on Hover or Mobile) */}
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-300 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                                        <Pencil className="mr-2 h-4 w-4" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-stone-500" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        )}
    </div>
  )
}