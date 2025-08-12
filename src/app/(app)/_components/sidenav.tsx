'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
// Import the 'Video' icon
import { LayoutDashboard, StickyNote, Link2, Image, Folder, PlusCircle, LogOut, User, Video } from 'lucide-react' 
import { NewCollectionDialog } from './new-collection-dialog'

type Collection = { id: number; name: string };

type SideNavProps = {
  userEmail: string;
  collections: Collection[];
  isSheet: boolean;
};


const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => {
  const pathname = usePathname()
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        { 'bg-muted text-primary': pathname === href }
      )}
    >
      {children}
    </Link>
  )
}

export function SideNav({ userEmail, collections, isSheet }: SideNavProps) {
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false)

  const mainNavItems = [
    { href: '/vault', label: 'All Items', icon: LayoutDashboard },
    { href: '/add/note', label: 'Add Note', icon: StickyNote },
    { href: '/add/link', label: 'Add Link', icon: Link2 },
    { href: '/add/image', label: 'Add Image', icon: Image },
    // Add the new "Add Video" link
    { href: '/add/video', label: 'Add Video', icon: Video }, 
    { href: '/profile', label: 'Profile', icon: User },
  ]
  
  
  const LinkWrapper = isSheet ? SheetClose : Fragment;

  return (
    <>
      <div className="flex h-full max-h-screen flex-col gap-2 bg-background">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <LinkWrapper asChild>
            <Link href="/vault" className="flex items-center gap-2 font-serif text-lg font-bold">
              LinkVault AI
            </Link>
          </LinkWrapper>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {mainNavItems.map((item) => (
              
              <LinkWrapper asChild key={item.href}>
                <NavLink href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </LinkWrapper>
            ))}
          </nav>
          <hr className="my-4" />
          <div className="px-2 lg:px-4">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">Collections</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsNewCollectionOpen(true)}>
                      <PlusCircle className="h-4 w-4" />
                  </Button>
              </div>
              <nav className="grid items-start text-sm font-medium">
                  {collections.map((collection) => (
                    <LinkWrapper asChild key={collection.id}>
                      <NavLink href={`/collections/${collection.id}`}>
                          <Folder className="h-4 w-4" />
                          {collection.name}
                      </NavLink>
                    </LinkWrapper>
                  ))}
              </nav>
          </div>
        </div>
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center justify-between">
            <LinkWrapper asChild>
              <Link href="/profile" className="flex-grow hover:bg-slate-50 p-2 rounded-md -m-2">
                <div>
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-semibold truncate">{userEmail}</p>
                </div>
              </Link>
            </LinkWrapper>
            <form action="/api/auth/signout" method="post" className="ml-2">
              <Button type="submit" variant="ghost" size="icon">
                <LogOut className="h-5 w-5 text-muted-foreground hover:text-primary" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      <NewCollectionDialog isOpen={isNewCollectionOpen} onOpenChange={setIsNewCollectionOpen} />
    </>
  )
}
