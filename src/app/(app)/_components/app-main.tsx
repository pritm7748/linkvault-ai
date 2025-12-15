'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Check if we are ANYWHERE in the chat section (dashboard or specific chat)
  const isChatPage = pathname.startsWith('/chat')

  return (
    <main
      className={cn(
        "flex flex-1 flex-col h-full", 
        // IF CHAT: No padding, No gap, let the child handle scroll (overflow-hidden)
        isChatPage 
          ? "p-0 gap-0 overflow-hidden bg-white" 
          : "p-4 md:p-8 gap-4 bg-muted/40 overflow-y-auto"
      )}
    >
      {children}
    </main>
  )
}