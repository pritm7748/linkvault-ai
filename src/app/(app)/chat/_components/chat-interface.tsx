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
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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
    // FIX: Changed max-w-3xl to max-w-6xl for wider desktop view
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto relative bg-white md:border-x border-stone-100">
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-32">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 mt-10">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                    <Bot className="h-8 w-8 text-stone-400" />
                </div>
                <p className="text-stone-500 font-medium">Start a conversation with your vault.</p>
            </div>
        ) : (
            messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4 max-w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'assistant' && (
                        <div className="w-9 h-9 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="h-5 w-5 text-stone-500" />
                        </div>
                    )}
                    
                    <div className={cn(
                        // FIX: Increased max-w-[85%] to max-w-[90%] for better space usage
                        "max-w-[90%] md:max-w-[80%] rounded-2xl px-6 py-4 text-base leading-relaxed shadow-sm break-all whitespace-pre-wrap", 
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
            <div className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center mt-1">
                    <LoaderCircle className="h-5 w-5 text-stone-400 animate-spin" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-none px-6 py-5 shadow-sm flex items-center">
                    <span className="flex gap-1.5">
                        <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></span>
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

      {/* --- INPUT AREA --- */}
      <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-white via-white to-transparent">
        <div className="relative flex items-end gap-2 bg-[#FBFBF9] border border-stone-200 rounded-3xl p-1.5 pl-4 shadow-xl shadow-stone-200/50 ring-1 ring-black/5 max-w-4xl mx-auto">
            <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                className="min-h-[48px] max-h-[150px] w-full resize-none border-0 shadow-none focus-visible:ring-0 py-3 px-0 text-base bg-transparent text-stone-900 placeholder:text-stone-400"
                rows={1}
            />
            <Button 
                onClick={() => handleSubmit()} 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="mb-1 shrink-0 bg-stone-900 hover:bg-stone-800 rounded-full h-10 w-10 transition-transform active:scale-95"
            >
                <SendHorizontal className="h-5 w-5 text-white" />
            </Button>
        </div>
      </div>
    </div>
  )
}