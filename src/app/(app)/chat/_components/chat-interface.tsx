'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendHorizontal, Bot, User, LoaderCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

type ChatInterfaceProps = {
  chatId: string;
  initialMessages: Message[];
};

export function ChatInterface({ chatId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null) // State to show errors
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px'; 
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null) // Clear previous errors
    
    // 1. Optimistic Update
    const tempId = Date.now()
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: userMessage }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to get response')
      }

      const data = await response.json()
      
      // 2. Add AI Response
      setMessages(prev => [...prev, { id: data.id, role: 'assistant', content: data.content }])
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Something went wrong. Please try again.")
      // Remove the user message if it failed? Or keep it with error?
      // For now, we keep it but show an error banner.
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

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto relative">
      
      {/* --- MESSAGES AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32"> {/* Added pb-32 for input clearance */}
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 mt-10">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                    <Bot className="h-8 w-8 text-stone-400" />
                </div>
                <p className="text-stone-500 font-medium">Start a conversation with your vault.</p>
            </div>
        ) : (
            messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3 max-w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                            <Bot className="h-4 w-4 text-stone-600" />
                        </div>
                    )}
                    
                    <div className={cn(
                        "max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm break-words", // Added break-words
                        msg.role === 'user' 
                            ? "bg-stone-900 text-white rounded-br-none" 
                            : "bg-white border border-stone-200 text-stone-800 rounded-bl-none"
                    )}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                </div>
            ))
        )}
        
        {isLoading && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center mt-1 shadow-sm">
                    <LoaderCircle className="h-4 w-4 text-stone-400 animate-spin" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center">
                    <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                    </span>
                </div>
            </div>
        )}
        
        {/* Error Message */}
        {error && (
            <div className="flex justify-center">
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* --- INPUT AREA (Fixed at Bottom) --- */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#FBFBF9] via-[#FBFBF9] to-transparent">
        <div className="relative flex items-end gap-2 bg-white border border-stone-200 rounded-2xl p-2 shadow-lg shadow-stone-200/50 ring-1 ring-black/5 transition-all focus-within:ring-2 focus-within:ring-stone-900/20 focus-within:border-stone-400">
            <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                className="min-h-[48px] max-h-[150px] w-full resize-none border-0 shadow-none focus-visible:ring-0 py-3 px-3 text-base bg-transparent text-stone-900 placeholder:text-stone-400"
                rows={1}
            />
            <Button 
                onClick={() => handleSubmit()} 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="mb-1 shrink-0 bg-stone-900 hover:bg-stone-800 rounded-xl h-10 w-10 transition-transform active:scale-95"
            >
                <SendHorizontal className="h-5 w-5 text-white" />
            </Button>
        </div>
        <p className="text-center text-[10px] text-stone-400 mt-2">AI can make mistakes. Check important info.</p>
      </div>
    </div>
  )
}