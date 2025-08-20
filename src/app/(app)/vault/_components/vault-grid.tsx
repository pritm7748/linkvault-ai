'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { MoreHorizontal, Trash2, Edit, FolderInput, Star, LogOut } from 'lucide-react'
import { ItemDetailsDialog } from './item-details-dialog'
import { MoveToCollectionDialog } from './move-to-collection-dialog'

type VaultItem = { 
  id: number; 
  processed_title: string | null; 
  processed_summary: string | null; 
  processed_tags: string[] | null; 
  is_favorited: boolean;
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

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const router = useRouter();
  const pathname = usePathname();
  const isInCollectionView = pathname.includes('/collections/');

  const handleOpenDetails = (id: number) => { 
    if (selectedItems.length > 0) return;
    setSelectedItemId(id); 
    setIsDetailsOpen(true); 
  }
  const handleCloseDetails = () => { setIsDetailsOpen(false); setSelectedItemId(null); }
  
  const handleItemUpdate = (updatedItem: VaultItem) => { 
    setItems(items.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item)); 
    handleCloseDetails(); 
  }

  const handleOpenMoveDialog = (id: number | null) => { 
    const itemsToMove = selectedItems.length > 0 ? selectedItems[0] : id;
    setItemToMove(itemsToMove); 
    setIsMoveDialogOpen(true); 
  }
  
  const handleItemMoved = (itemId: number, collectionId: number | null) => {
    if (isInCollectionView) {
      if (selectedItems.length > 0) {
        setItems(items.filter(item => !selectedItems.includes(item.id)));
      } else {
        setItems(items.filter(item => item.id !== itemId));
      }
    }
    setSelectedItems([]);
  }

  const handleDelete = async () => {
    const idsToDelete = selectedItems.length > 0 ? selectedItems : (itemToDelete ? [itemToDelete] : []);
    if (idsToDelete.length === 0) return;

    setIsDeleting(true)
    try {
      for (const id of idsToDelete) {
        await fetch('/api/vault', { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ id }), 
        });
      }
      setItems(items.filter((item) => !idsToDelete.includes(item.id)));
    } catch (error) { 
      console.error(error) 
    } finally { 
      setIsDeleting(false); 
      setItemToDelete(null); 
      setSelectedItems([]);
    }
  }

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
      if (!response.ok) throw new Error('Failed to update favorite status');
      router.refresh(); 
    } catch (error) {
      console.error(error);
      setItems(originalItems); 
    }
  };
  
  const handleRemoveFromCollection = async (itemId: number) => {
    const originalItems = items;
    setItems(items.filter(item => item.id !== itemId));
    try {
        const response = await fetch(`/api/vault/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collection_id: null }),
        });
        if (!response.ok) throw new Error('Failed to remove item from collection');
    } catch (error) {
        console.error(error);
        setItems(originalItems);
    }
  }

  // --- NEW: Bulk remove handler ---
  const handleBulkRemoveFromCollection = async () => {
    const originalItems = items;
    setItems(items.filter(item => !selectedItems.includes(item.id)));
    try {
        for (const itemId of selectedItems) {
            await fetch(`/api/vault/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collection_id: null }),
            });
        }
    } catch (error) {
        console.error("Failed to bulk remove items", error);
        setItems(originalItems);
    } finally {
        setSelectedItems([]);
    }
  };

  const handleSelectItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  return (
    <>
      {selectedItems.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white rounded-lg shadow-2xl p-2 flex items-center gap-4">
          <p className="text-sm font-medium">{selectedItems.length} item(s) selected</p>
          <Button variant="secondary" size="sm" onClick={() => handleOpenMoveDialog(null)}>Move</Button>

          {/* --- THE FIX: Conditional "Remove" or "Delete" button --- */}
          {isInCollectionView ? (
            <Button variant="destructive" size="sm" onClick={handleBulkRemoveFromCollection}>Remove</Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={() => setItemToDelete(1)}>Delete</Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => setSelectedItems([])}>Clear</Button>
        </div>
      )}

      {items && items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <Card 
                key={item.id} 
                className={`bg-white border-slate-200 shadow-sm flex flex-col transition-all relative group ${isSelected ? 'shadow-lg border-blue-500' : 'hover:shadow-lg hover:-translate-y-1'}`}
              >
                <div 
                  className="absolute top-2 left-2 z-10"
                  onClick={(e) => handleSelectItem(e, item.id)}
                >
                  <Input 
                    type="checkbox" 
                    className={`h-5 w-5 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    checked={isSelected}
                    readOnly
                  />
                </div>
                
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

                       {isInCollectionView ? (
                          <DropdownMenuItem onClick={() => handleRemoveFromCollection(item.id)} className="text-orange-600 cursor-pointer focus:bg-orange-50 focus:text-orange-700">
                              <LogOut className="mr-2 h-4 w-4" />Remove from Collection
                          </DropdownMenuItem>
                       ) : (
                          <DropdownMenuItem onClick={() => setItemToDelete(item.id)} className="text-red-500 cursor-pointer focus:bg-red-50 focus:text-red-700">
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                       )}
                     </DropdownMenuContent>
                   </DropdownMenu>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : ( <div className="text-center py-16 border-2 border-dashed rounded-lg bg-background"><h3 className="font-serif text-xl font-semibold">This space is empty.</h3><p className="text-muted-foreground mt-2">Add some items to get started.</p></div> )}
            
      <ItemDetailsDialog itemId={selectedItemId} isOpen={isDetailsOpen} onClose={handleCloseDetails} onUpdate={handleItemUpdate} />
      <MoveToCollectionDialog 
        isOpen={isMoveDialogOpen} 
        onOpenChange={setIsMoveDialogOpen} 
        collections={collections} 
        itemIds={selectedItems.length > 0 ? selectedItems : (itemToMove ? [itemToMove] : [])}
        onItemMoved={handleItemMoved} 
      />
      <AlertDialog open={itemToDelete !== null || (selectedItems.length > 0 && isDeleting)} onOpenChange={() => {setItemToDelete(null); setIsDeleting(false)}}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone and will permanently delete the selected item(s).</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}