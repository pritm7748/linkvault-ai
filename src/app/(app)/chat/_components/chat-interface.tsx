'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendHorizontal, Bot, User, LoaderCircle } from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea (reused from your search bar)
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
    setInput('') // Clear input immediately
    
    // 1. Optimistic Update: Show user message instantly
    const tempId = Date.now()
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // 2. Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: userMessage }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      
      // 3. Update with AI Response
      setMessages(prev => [...prev, { id: data.id, role: 'assistant', content: data.content }])
    } catch (error) {
      console.error(error)
      // Optional: Show error toast here
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
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      
      {/* --- MESSAGES AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <Bot className="h-12 w-12 text-stone-400" />
                <p className="text-stone-500">Start a conversation with your vault.</p>
            </div>
        ) : (
            messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                            <Bot className="h-4 w-4 text-stone-600" />
                        </div>
                    )}
                    
                    <div className={cn(
                        "max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                        msg.role === 'user' 
                            ? "bg-stone-900 text-white rounded-br-none" 
                            : "bg-white border border-stone-200 text-stone-800 rounded-bl-none"
                    )}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-stone-500" />
                        </div>
                    )}
                </div>
            ))
        )}
        
        {isLoading && (
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
                    <LoaderCircle className="h-4 w-4 text-stone-400 animate-spin" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-none px-5 py-3 flex items-center">
                    <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                    </span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- INPUT AREA --- */}
      <div className="p-4 bg-transparent">
        <div className="relative flex items-end gap-2 bg-white border border-stone-200 rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-stone-900/10 transition-all">
            <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your notes..."
                className="min-h-[48px] max-h-[150px] w-full resize-none border-0 shadow-none focus-visible:ring-0 py-3 px-3 text-base bg-transparent"
                rows={1}
            />
            <Button 
                onClick={() => handleSubmit()} 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="mb-1 shrink-0 bg-stone-900 hover:bg-stone-800 rounded-lg h-10 w-10"
            >
                <SendHorizontal className="h-5 w-5 text-white" />
            </Button>
        </div>
      </div>
    </div>
  )
}