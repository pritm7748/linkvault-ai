'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChatPage = pathname.startsWith('/chat')

  return (
    <main
      className={cn(
        "flex flex-1 flex-col",
        // FIX: Use 100dvh for mobile browsers to prevent header scrolling
        isChatPage 
          ? "h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-3.5rem)] p-0 overflow-hidden bg-white" 
          : "p-4 md:p-8 gap-4 bg-muted/40 overflow-y-auto h-full"
      )}
    >
      {children}
    </main>
  )
}