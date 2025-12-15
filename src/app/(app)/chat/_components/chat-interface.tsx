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
      textareaRef.current.style.height = '24px'; 
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
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
    <div className="w-full min-h-screen bg-white">
      
      {/* Back button - Fixed position */}
      <div className="fixed top-4 left-4 md:left-[316px] z-50">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/chat')}
            className="text-stone-500 hover:text-stone-900 hover:bg-stone-100"
        >
            <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* --- MESSAGES --- */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-20 pb-32">
        {messages.length === 0 ? (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                    <Bot className="h-8 w-8 text-stone-400" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-stone-800 mb-2">Ask me anything</h2>
                    <p className="text-stone-500 text-sm">I'll search through your vault to find answers.</p>
                </div>
            </div>
        ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                  <div key={msg.id} className="w-full">
                      {msg.role === 'assistant' && (
                          <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                                  <Bot className="h-4 w-4 text-stone-600" />
                              </div>
                              <div className="flex-1 pt-1">
                                  <div className="text-stone-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                                      {msg.content}
                                  </div>
                              </div>
                          </div>
                      )}
                      
                      {msg.role === 'user' && (
                          <div className="flex gap-4 justify-end">
                              <div className="flex-1 pt-1 flex justify-end">
                                  <div className="text-stone-800 text-[15px] leading-relaxed whitespace-pre-wrap max-w-[80%]">
                                      {msg.content}
                                  </div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center shrink-0 text-white text-xs font-medium">
                                  You
                              </div>
                          </div>
                      )}
                  </div>
              ))}
              
              {isLoading && (
                  <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                          <LoaderCircle className="h-4 w-4 text-stone-400 animate-spin" />
                      </div>
                      <div className="flex-1 pt-1">
                          <span className="flex gap-1">
                              <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                              <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                              <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></span>
                          </span>
                      </div>
                  </div>
              )}
              
              {error && (
                  <div className="flex justify-center">
                      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                          <AlertCircle className="h-4 w-4" />
                          {error}
                      </div>
                  </div>
              )}
            </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* --- INPUT (Fixed at bottom) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-4">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="relative flex items-end gap-2 bg-white border border-stone-300 rounded-2xl px-3 py-1.5 shadow-sm hover:shadow-md transition-shadow">
              <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  className="min-h-[24px] max-h-[120px] w-full resize-none border-0 shadow-none focus-visible:ring-0 py-1.5 px-1 text-[15px] bg-transparent text-stone-900 placeholder:text-stone-400"
                  rows={1}
              />
              <Button 
                  onClick={() => handleSubmit()} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 rounded-full h-8 w-8 transition-all active:scale-95"
              >
                  <SendHorizontal className="h-4 w-4 text-white" />
              </Button>
          </div>
          <p className="text-center text-[11px] text-stone-400 mt-2">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  )
}