'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendHorizontal, Bot, LoaderCircle, AlertCircle, ArrowLeft } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Scroll to bottom
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

  return (
    // FIX: Main Container uses fixed height calculation to fit inside the dashboard
    // 'h-[calc(100vh-140px)]' accounts for the app sidebar/header padding
    // This creates a rigid "Window" that doesn't scroll with the browser
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] w-full max-w-4xl mx-auto bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      
      {/* --- 1. HEADER (Fixed) --- */}
      {/* Takes up fixed height, never moves. */}
      <div className="h-14 border-b border-stone-100 flex items-center px-4 bg-stone-50/50 shrink-0">
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/chat')}
            className="text-stone-500 hover:text-stone-900 gap-2 -ml-2"
        >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back</span>
        </Button>
      </div>

      {/* --- 2. MESSAGES (Scrollable) --- */}
      {/* flex-1 makes it take all remaining space. overflow-y-auto puts the scrollbar HERE. */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-white">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
                    <Bot className="h-6 w-6 text-stone-400" />
                </div>
                <p className="text-stone-500 text-sm font-medium">Ask questions about your vault.</p>
            </div>
        ) : (
            messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3 w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="h-4 w-4 text-stone-500" />
                        </div>
                    )}
                    
                    <div className={cn(
                        "max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap", 
                        msg.role === 'user' 
                            ? "bg-stone-900 text-white rounded-br-none" 
                            : "bg-white border border-stone-200 text-stone-800 rounded-bl-none"
                    )}>
                        {msg.content}
                    </div>
                </div>
            ))
        )}
        
        {isLoading && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center mt-1">
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

      {/* --- 3. INPUT (Fixed) --- */}
      {/* Sits at the bottom of the flex column. No overlap possible. */}
      <div className="p-4 border-t border-stone-100 bg-white shrink-0">
        <div className="relative flex items-end gap-2 bg-[#FBFBF9] border border-stone-200 rounded-2xl p-2 shadow-inner">
            <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                className="min-h-[44px] max-h-[150px] w-full resize-none border-0 shadow-none focus-visible:ring-0 py-2.5 px-2 text-base bg-transparent text-stone-900 placeholder:text-stone-400"
                rows={1}
            />
            <Button 
                onClick={() => handleSubmit()} 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="mb-0.5 shrink-0 bg-stone-900 hover:bg-stone-800 rounded-xl h-10 w-10 transition-transform active:scale-95 cursor-pointer"
            >
                <SendHorizontal className="h-5 w-5 text-white" />
            </Button>
        </div>
        <p className="text-center text-[10px] text-stone-400 mt-2">AI can make mistakes. Check important info.</p>
      </div>
    </div>
  )
}