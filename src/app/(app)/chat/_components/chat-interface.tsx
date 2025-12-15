'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendHorizontal, Bot, LoaderCircle, AlertCircle, X, ArrowLeft } from 'lucide-react'
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
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

  return (
    // MAIN CONTAINER: Fixed height relative to viewport. No outer scroll.
    // 'h-[calc(100vh-6rem)]' assumes typical header/padding. Adjust '6rem' if needed.
    <div className="flex flex-col w-full max-w-4xl mx-auto bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden relative h-[calc(100vh-100px)]">
      
      {/* --- HEADER (Back Button Top Right) --- */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-end z-20 pointer-events-none">
        <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => router.push('/chat')}
            className="pointer-events-auto shadow-sm bg-white hover:bg-stone-100 text-stone-600 gap-2 rounded-full border border-stone-200"
        >
            <span className="text-xs font-semibold">Close Chat</span>
            <X className="h-4 w-4" />
        </Button>
      </div>

      {/* --- SCROLLABLE MESSAGES AREA --- */}
      {/* flex-1 allows it to fill the remaining space. overflow-y-auto contains the scroll here. */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth pt-16">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center">
                    <Bot className="h-8 w-8 text-stone-400" />
                </div>
                <p className="text-stone-500 font-medium">How can I help you with your vault?</p>
            </div>
        ) : (
            messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4 w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="h-4 w-4 text-stone-600" />
                        </div>
                    )}
                    
                    <div className={cn(
                        "max-w-[85%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap", 
                        msg.role === 'user' 
                            ? "bg-stone-900 text-white rounded-br-none" 
                            : "bg-[#F4F4F2] text-stone-800 rounded-bl-none" // Slightly darker beige for AI bubble
                    )}>
                        {msg.content}
                    </div>
                </div>
            ))
        )}
        
        {isLoading && (
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mt-1">
                    <LoaderCircle className="h-4 w-4 text-stone-400 animate-spin" />
                </div>
                <div className="bg-[#F4F4F2] rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center">
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
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* --- FIXED FOOTER (Input) --- */}
      <div className="flex-none p-4 bg-white border-t border-stone-100 z-10">
        <div className="relative flex items-end gap-2 bg-stone-50 border border-stone-200 rounded-3xl p-1.5 pl-4 focus-within:ring-2 focus-within:ring-stone-200 transition-all">
            <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask follow up..."
                className="min-h-[50px] max-h-[150px] w-full resize-none border-0 shadow-none focus-visible:ring-0 py-3 px-0 text-base bg-transparent text-stone-900 placeholder:text-stone-400"
                rows={1}
            />
            <Button 
                onClick={() => handleSubmit()} 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="mb-1 shrink-0 bg-stone-900 hover:bg-stone-700 rounded-full h-10 w-10 transition-transform active:scale-95 cursor-pointer"
            >
                <SendHorizontal className="h-5 w-5 text-white" />
            </Button>
        </div>
        <p className="text-center text-[10px] text-stone-400 mt-2">Gemini can make mistakes. Check important info.</p>
      </div>
    </div>
  )
}