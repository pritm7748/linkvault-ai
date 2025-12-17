'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChatPage = pathname.startsWith('/chat')

  return (
    <main
      className={cn(
        "flex flex-1 flex-col w-full",
        // IF CHAT: 
        // Mobile: 'fixed' locks it to the screen (solves scroll issues).
        // Desktop (md): 'static' returns it to normal flow, 'h-[calc...]' fits it to the main area.
        isChatPage 
          ? "fixed inset-x-0 top-14 bottom-0 md:static md:top-auto md:bottom-auto md:inset-auto md:h-[calc(100vh-3.5rem)] p-0 overflow-hidden bg-white z-0" 
          : "p-4 md:p-8 gap-4 bg-muted/40 overflow-y-auto h-[calc(100dvh-3.5rem)] md:h-auto"
      )}
    >
      {children}
    </main>
  )
}