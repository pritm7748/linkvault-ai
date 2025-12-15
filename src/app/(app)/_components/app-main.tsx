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
        // IF CHAT PAGE: No padding, No gap, Hidden overflow (Chat handles scrolling)
        isChatPage ? "overflow-hidden bg-white" : 
        // IF OTHER PAGE: Keep original padding, gap, and scrolling
        "gap-4 p-4 md:gap-8 md:p-8 bg-muted/40 overflow-y-auto"
      )}
    >
      {children}
    </main>
  )
}