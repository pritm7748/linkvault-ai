'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
import { 
  LayoutDashboard, Folder, PlusCircle, LogOut, User, Star, X
} from 'lucide-react' 
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { NewCollectionDialog } from './new-collection-dialog'
import { CreateItemDialog } from './create-item-dialog' // --- IMPORT NEW MODAL ---

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
        'group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-stone-100',
        { 'bg-stone-100 text-stone-900 font-medium': pathname === href }
      )}
    >
      {children}
    </Link>
  )
}

export function SideNav({ userEmail, collections, isSheet }: SideNavProps) {
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false)
  const [localCollections, setLocalCollections] = useState(collections);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const router = useRouter();

  // --- CHANGED: Removed individual Add links ---
  const mainNavItems = [
    { href: '/vault', label: 'All Items', icon: LayoutDashboard },
    { href: '/profile', label: 'Profile', icon: User },
  ]
  
  const LinkWrapper = isSheet ? SheetClose : Fragment;

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;

    const originalCollections = localCollections;
    setLocalCollections(localCollections.filter(c => c.id !== collectionToDelete.id));
    
    try {
        await fetch(`/api/collections/delete`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: collectionToDelete.id })
        });
        
        setCollectionToDelete(null);
        router.refresh();
        if (window.location.pathname.includes(`/collections/${collectionToDelete.id}`)) {
            router.push('/vault');
        }
    } catch (error) {
        console.error("Failed to delete collection", error);
        setLocalCollections(originalCollections);
    }
  };

  return (
    <>
      <div className="flex h-full max-h-screen flex-col gap-2 bg-[#FBFBF9] border-r"> {/* Slightly warmer background */}
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <LinkWrapper asChild>
            <Link href="/vault" className="flex items-center gap-2 font-serif text-xl font-bold text-stone-900">
              LinkVault AI
            </Link>
          </LinkWrapper>
        </div>
        
        <div className="flex-1 overflow-y-auto pt-4">
          <div className="px-2 lg:px-4">
            {/* --- NEW UNIFIED ADD BUTTON --- */}
            <CreateItemDialog />

            <nav className="grid items-start text-sm font-medium gap-1">
                {mainNavItems.map((item) => (
                <LinkWrapper asChild key={item.href}>
                    <NavLink href={item.href}>
                    <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </div>
                    </NavLink>
                </LinkWrapper>
                ))}
            </nav>
          </div>

          <hr className="my-4 border-stone-200" />
          
          <div className="px-2 lg:px-4">
              <div className="flex justify-between items-center mb-2 px-2">
                  <h3 className="text-xs font-bold uppercase text-stone-500 tracking-wider">Collections</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-stone-200" onClick={() => setIsNewCollectionOpen(true)}>
                      <PlusCircle className="h-4 w-4 text-stone-500" />
                  </Button>
              </div>
              <nav className="grid items-start text-sm font-medium gap-1">
                  <LinkWrapper asChild>
                    <NavLink href="/vault/favorites">
                      <div className="flex items-center gap-3">
                        <Star className="h-4 w-4" />
                        Favorites
                      </div>
                    </NavLink>
                  </LinkWrapper>

                  {localCollections.map((collection) => (
                    <LinkWrapper asChild key={collection.id}>
                      <NavLink href={`/collections/${collection.id}`}>
                        <div className="flex items-center gap-3">
                          <Folder className="h-4 w-4" />
                          <span className="truncate">{collection.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-200"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCollectionToDelete(collection);
                          }}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </NavLink>
                    </LinkWrapper>
                  ))}
              </nav>
          </div>
        </div>
        <div className="mt-auto p-4 border-t bg-white">
          <div className="flex items-center justify-between">
            <LinkWrapper asChild>
              <Link href="/profile" className="flex-grow hover:bg-stone-100 p-2 rounded-md -m-2 transition-colors">
                <div>
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-semibold truncate text-stone-900">{userEmail}</p>
                </div>
              </Link>
            </LinkWrapper>
            <form action="/api/auth/signout" method="post" className="ml-2">
              <Button type="submit" variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-600">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      <NewCollectionDialog isOpen={isNewCollectionOpen} onOpenChange={setIsNewCollectionOpen} />

      <AlertDialog open={!!collectionToDelete} onOpenChange={() => setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{collectionToDelete?.name}&quot; from your sidebar. 
              The items inside will remain in "All Items".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCollection}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}