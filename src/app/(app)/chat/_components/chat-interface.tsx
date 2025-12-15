'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
    SendHorizontal, Bot, LoaderCircle, AlertCircle, ArrowLeft, 
    MoreVertical, Pencil, Trash2 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { renameChat, deleteChat } from '../actions' // Import Server Actions

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

type ChatInterfaceProps = {
  chatId: string;
  initialMessages: Message[];
  initialTitle: string; // Added Title Prop
};

export function ChatInterface({ chatId, initialMessages, initialTitle }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // --- Header State ---
  const [title, setTitle] = useState(initialTitle)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [newTitleInput, setNewTitleInput] = useState(initialTitle)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px'; 
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    
    const tempId = Date.now()
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: userMessage }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to get response')
      
      setMessages(prev => [...prev, { id: data.id, role: 'assistant', content: data.content }])
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // --- ACTIONS ---
  const handleRename = async () => {
    if (!newTitleInput.trim()) return;
    setTitle(newTitleInput);
    setIsRenameOpen(false);
    await renameChat(Number(chatId), newTitleInput);
    router.refresh();
  }

  const handleDelete = async () => {
    if (!confirm("Delete this conversation?")) return;
    await deleteChat(Number(chatId));
    router.push('/chat'); // Go back to dashboard
  }

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      
      {/* --- GEMINI-STYLE HEADER --- */}
      <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-stone-100 bg-white/90 backdrop-blur-sm z-20">
        
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 overflow-hidden">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/chat')}
                className="rounded-full hover:bg-stone-100 text-stone-600 h-9 w-9 shrink-0"
                title="Back to Chats"
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold text-stone-900 truncate max-w-[200px] md:max-w-md text-sm md:text-base">
                {title}
            </h2>
        </div>

        {/* Right: Menu */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-stone-600 hover:bg-stone-100">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setNewTitleInput(title); setIsRenameOpen(true); }}>
                    <Pencil className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- MESSAGES AREA --- */}
      <div className="flex-1 overflow-y-auto w-full scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 min-h-full flex flex-col justify-end">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center space-y-6 opacity-50 py-20">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center">
                        <Bot className="h-8 w-8 text-stone-400" />
                    </div>
                    <p className="text-stone-500 font-medium text-lg">How can I help you with your vault?</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-4 w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-1">
                                    <Bot className="h-4 w-4 text-stone-500" />
                                </div>
                            )}
                            
                            <div className={cn(
                                "max-w-[85%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap", 
                                msg.role === 'user' 
                                    ? "bg-stone-100 text-stone-900 rounded-br-sm" 
                                    : "bg-transparent text-stone-800 pl-0 pt-0"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {isLoading && (
                <div className="flex gap-4 mt-8">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center mt-1">
                        <LoaderCircle className="h-4 w-4 text-stone-400 animate-spin" />
                    </div>
                    <div className="py-2">
                        <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                        </span>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="flex justify-center my-4">
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                </div>
            )}
            
            <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="w-full bg-white px-3 pb-3 pt-0 z-10">
        <div className="max-w-3xl mx-auto w-full">
            <div className="relative flex items-end gap-2 bg-stone-50 border border-transparent focus-within:border-stone-200 focus-within:bg-white rounded-[24px] p-2 pl-4 transition-all">
                <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    className="min-h-[44px] max-h-[150px] w-full resize-none border-0 shadow-none focus-visible:ring-0 py-2.5 px-0 text-base bg-transparent text-stone-900 placeholder:text-stone-500"
                    rows={1}
                />
                <Button 
                    onClick={() => handleSubmit()} 
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="mb-0.5 shrink-0 bg-stone-900 hover:bg-stone-700 rounded-full h-9 w-9 transition-transform active:scale-95 cursor-pointer"
                >
                    <SendHorizontal className="h-4 w-4 text-white" />
                </Button>
            </div>
            <p className="text-center text-[10px] text-stone-400 mt-2 font-medium">Gemini can make mistakes. Check important info.</p>
        </div>
      </div>

      {/* --- RENAME DIALOG --- */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename Chat</DialogTitle>
            </DialogHeader>
            <div className="py-2">
                <Input 
                    value={newTitleInput}
                    onChange={(e) => setNewTitleInput(e.target.value)}
                    placeholder="Enter new title"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                <Button onClick={handleRename}>Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}