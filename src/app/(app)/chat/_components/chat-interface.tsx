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

  return (
    // MAIN CONTAINER: Full screen height, negative margins to undo parent padding
    <div className="flex flex-col -m-4 md:-m-8 h-[calc(100vh-3.5rem)] bg-white relative overflow-hidden">
      
      {/* --- HEADER: Proper Top Bar (Not Floating) --- */}
      {/* This keeps the button "inside" the layout structure */}
      <div className="flex-none px-4 py-3 border-b border-stone-50 bg-white/80 backdrop-blur-md z-10">
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/chat')}
            className="text-stone-500 hover:text-stone-900 gap-2 pl-0 hover:bg-transparent"
        >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Chats</span>
        </Button>
      </div>

      {/* --- MESSAGES AREA --- */}
      <div className="flex-1 overflow-y-auto w-full scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 py-6 min-h-full flex flex-col justify-end">
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
                                    <Bot className="h-4 w-4 text-stone-600" />
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
            
            <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* --- FOOTER: Input Area --- */}
      {/* Reduced padding to 'p-2' to minimize bottom space */}
      <div className="flex-none bg-white p-2 border-t border-transparent z-10">
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
            <p className="text-center text-[10px] text-stone-400 mt-2 font-medium">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  )
}