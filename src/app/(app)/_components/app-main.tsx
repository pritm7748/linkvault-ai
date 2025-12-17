'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChatPage = pathname.startsWith('/chat')

  return (
    <main
      className={cn(
        "flex flex-1 flex-col w-full max-w-[100vw] overflow-x-hidden", // FIX: Prevent horizontal scroll globally
        // IF CHAT: 
        // 1. h-[calc(100dvh-3.5rem)]: Use 'dvh' to respect mobile address bars.
        // 2. fixed: Keeps it stuck in place so the header never scrolls away.
        isChatPage 
          ? "h-[calc(100dvh-3.5rem)] p-0 overflow-hidden bg-white fixed inset-x-0 bottom-0 top-14" 
          : "p-4 md:p-8 gap-4 bg-muted/40 overflow-y-auto h-[calc(100dvh-3.5rem)]" // Ensure non-chat pages also respect mobile height
      )}
    >
      {children}
    </main>
  )
}