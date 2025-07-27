'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
// THE FIX: Removed 'User' as it was unused.
import { LayoutDashboard, StickyNote, Link2, Image, LogOut } from 'lucide-react' 
import { Button } from '@/components/ui/button'

export function SideNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/vault', label: 'My Vault', icon: LayoutDashboard },
    { href: '/add/note', label: 'Add Note', icon: StickyNote },
    { href: '/add/link', label: 'Add Link', icon: Link2 },
    { href: '/add/image', label: 'Add Image', icon: Image },
  ]

  return (
    <div className="hidden border-r bg-white md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/vault" className="flex items-center gap-2 font-semibold">
            <span className="">LinkVault AI</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100',
                  {
                    'bg-slate-100 text-slate-900': pathname.startsWith(item.href),
                  }
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
            <div className="flex items-center justify-between">
                <Link href="/profile" className="flex-grow">
                    <p className="text-xs text-slate-500 truncate">Profile</p>
                    <p className="text-sm font-semibold truncate">{userEmail}</p>
                </Link>
                <form action="/api/auth/signout" method="post">
                    <Button type="submit" variant="ghost" size="icon">
                        <LogOut className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    </Button>
                </form>
            </div>
        </div>
      </div>
    </div>
  )
}
