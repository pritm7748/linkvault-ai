'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // --- ADDED ---
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
// --- ADDED Star ICON ---
import { MoreHorizontal, Trash2, Edit, FolderInput, Star } from 'lucide-react'
import { ItemDetailsDialog } from './item-details-dialog'
import { MoveToCollectionDialog } from './move-to-collection-dialog'

// --- UPDATED VaultItem TYPE ---
type VaultItem = { 
  id: number; 
  processed_title: string | null; 
  processed_summary: string | null; 
  processed_tags: string[] | null; 
  is_favorited: boolean; // Add the new field
};
type Collection = { id: number; name: string };

export function VaultGrid({ initialItems, collections }: { initialItems: VaultItem[], collections: Collection[] }) {
  const [items, setItems] = useState(initialItems)
  const [isDeleting, setIsDeleting] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  const [itemToMove, setItemToMove] = useState<number | null>(null)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)

  const router = useRouter(); // --- ADDED ---

  const handleOpenDetails = (id: number) => { setSelectedItemId(id); setIsDetailsOpen(true); }
  const handleCloseDetails = () => { setIsDetailsOpen(false); setSelectedItemId(null); }
  
  const handleItemUpdate = (updatedItem: VaultItem) => { 
    setItems(items.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item)); 
    handleCloseDetails(); 
  }

  const handleOpenMoveDialog = (id: number) => { setItemToMove(id); setIsMoveDialogOpen(true); }
  
  const handleItemMoved = (itemId: number, _collectionId: number | null) => {
    if (window.location.pathname.includes('/collections/')) {
        setItems(items.filter(item => item.id !== itemId))
    }
  }

  const handleDelete = async () => {
    if (itemToDelete === null) return;
    setIsDeleting(true)
    try {
      await fetch('/api/vault', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: itemToDelete }), })
      setItems(items.filter((item) => item.id !== itemToDelete))
    } catch (error) { console.error(error) } finally { setIsDeleting(false); setItemToDelete(null); }
  }

  // --- NEW: Function to toggle an item's favorite status ---
  const handleToggleFavorite = async (e: React.MouseEvent, itemToToggle: VaultItem) => {
    e.stopPropagation(); 
    
    const originalItems = items;
    const newItems = items.map(item => 
      item.id === itemToToggle.id ? { ...item, is_favorited: !item.is_favorited } : item
    );
    setItems(newItems);

    try {
      const response = await fetch(`/api/vault/${itemToToggle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorited: !itemToToggle.is_favorited }),
      });
      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }
      // Add this line to use the router and refresh server data
      router.refresh(); 
    } catch (error) {
      console.error(error);
      setItems(originalItems); 
    }
  };

  return (
    <>
      {items && items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="bg-white border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 relative">
              
              {/* --- NEW: Star Button --- */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-12 h-8 w-8 rounded-full z-10"
                onClick={(e) => handleToggleFavorite(e, item)}
              >
                <Star className={`h-5 w-5 transition-colors ${item.is_favorited ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 hover:text-slate-500'}`} />
              </Button>

              <div className="flex-grow cursor-pointer" onClick={() => handleOpenDetails(item.id)}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-lg font-semibold text-card-foreground break-words pr-10">
                    {item.processed_title || "Untitled"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-4">{item.processed_summary || "No summary."}</p>
                </CardContent>
              </div>
              <CardFooter className="flex justify-between items-center">
                   <div className="flex flex-wrap gap-1">
                     {item.processed_tags?.slice(0, 3).map((tag: string) => (<span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">{tag}</span>))}
                 </div>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => handleOpenDetails(item.id)} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" />View / Edit</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleOpenMoveDialog(item.id)} className="cursor-pointer"><FolderInput className="mr-2 h-4 w-4" />Move to...</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setItemToDelete(item.id)} className="text-red-500 cursor-pointer"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : ( <div className="text-center py-16 border-2 border-dashed rounded-lg bg-background"><h3 className="font-serif text-xl font-semibold">This space is empty.</h3><p className="text-muted-foreground mt-2">Add some items to get started.</p></div> )}
            
      <ItemDetailsDialog itemId={selectedItemId} isOpen={isDetailsOpen} onClose={handleCloseDetails} onUpdate={handleItemUpdate} />
      <MoveToCollectionDialog isOpen={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen} collections={collections} itemId={itemToMove} onItemMoved={handleItemMoved} />
      <AlertDialog open={itemToDelete !== null} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone and will permanently delete this item.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? 'Deleting...' : 'Delete'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  )
}