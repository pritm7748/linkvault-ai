'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation' // --- ADDED useRouter ---
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
// --- ADDED X icon and AlertDialog ---
import { 
  LayoutDashboard, StickyNote, Link2, Image, Folder, PlusCircle, LogOut, User, Video, Star, X
} from 'lucide-react' 
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
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
        'group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary', // --- ADDED group and justify-between ---
        { 'bg-muted text-primary': pathname === href }
      )}
    >
      {children}
    </Link>
  )
}

export function SideNav({ userEmail, collections, isSheet }: SideNavProps) {
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false)
  // --- NEW: State to manage collections list and deletion dialog ---
  const [localCollections, setLocalCollections] = useState(collections);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const router = useRouter();

  const mainNavItems = [
    { href: '/vault', label: 'All Items', icon: LayoutDashboard },
    { href: '/add/note', label: 'Add Note', icon: StickyNote },
    { href: '/add/link', label: 'Add Link', icon: Link2 },
    { href: '/add/image', label: 'Add Image', icon: Image },
    { href: '/add/video', label: 'Add Video', icon: Video }, 
    { href: '/profile', label: 'Profile', icon: User },
  ]
  
  const LinkWrapper = isSheet ? SheetClose : Fragment;

  // --- NEW: Handler for deleting a collection ---
  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;

    // Optimistic UI update
    setLocalCollections(localCollections.filter(c => c.id !== collectionToDelete.id));
    
    try {
        await fetch(`/api/collections/${collectionToDelete.id}`, { method: 'DELETE' });
        setCollectionToDelete(null);
        // Refresh the page layout to ensure data consistency
        router.refresh();
        // If user is on the deleted collection page, redirect them to the main vault
        if (window.location.pathname.includes(`/collections/${collectionToDelete.id}`)) {
            router.push('/vault');
        }
    } catch (error) {
        console.error("Failed to delete collection", error);
        // Revert on error
        setLocalCollections(collections);
    }
  };

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
                  <div className="flex items-center gap-3"> {/* Wrapper for icon and label */}
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
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
                        {/* --- NEW: Delete button that shows on hover --- */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* --- NEW: Confirmation Dialog for Deleting Collections --- */}
      <AlertDialog open={!!collectionToDelete} onOpenChange={() => setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the &quot;{collectionToDelete?.name}&quot; collection. 
              Items within this collection will NOT be deleted from your vault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCollection}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}