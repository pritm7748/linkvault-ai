'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { MoreHorizontal, Trash2, Edit, FolderInput, Star, LogOut, Video, Link2, FileText, Image as ImageIcon, X as XIcon, File, Twitter, Instagram } from 'lucide-react'
import { ItemDetailsDialog } from './item-details-dialog'
import { MoveToCollectionDialog } from './move-to-collection-dialog'

type VaultItem = { 
  id: number; 
  processed_title: string | null; 
  processed_summary: string | null; 
  processed_tags: string[] | null; 
  is_favorited: boolean;
  content_type: string; 
  original_content?: string | null;
  storage_path?: string | null;
};
type Collection = { id: number; name: string };

export function VaultGrid({ 
    initialItems, 
    collections,
    emptyMessage,
    readOnly = false 
}: { 
    initialItems: VaultItem[], 
    collections: Collection[],
    emptyMessage?: string,
    readOnly?: boolean
}) {
  const [items, setItems] = useState(initialItems)
  
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

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

  const getTypeStyles = (type: string) => {
    switch (type) {
        case 'video': return { color: 'border-t-red-500', icon: <Video className="h-3 w-3 text-red-500" /> };
        case 'link': return { color: 'border-t-blue-500', icon: <Link2 className="h-3 w-3 text-blue-500" /> };
        case 'image': return { color: 'border-t-purple-500', icon: <ImageIcon className="h-3 w-3 text-purple-500" /> };
        case 'document': return { color: 'border-t-emerald-500', icon: <File className="h-3 w-3 text-emerald-500" /> };
        case 'tweet': return { color: 'border-t-sky-500', icon: <Twitter className="h-3 w-3 text-sky-500" /> };
        // FIX: Added Instagram style
        case 'instagram': return { color: 'border-t-pink-500', icon: <Instagram className="h-3 w-3 text-pink-500" /> };
        default: return { color: 'border-t-amber-500', icon: <FileText className="h-3 w-3 text-amber-500" /> };
    }
  }

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
    if (readOnly) return;
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
      router.refresh();
    } catch (error) { 
      console.error(error) 
    } finally { 
      setIsDeleting(false); 
      setItemToDelete(null); 
      setSelectedItems([]);
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, itemToToggle: VaultItem) => {
    if (readOnly) return;
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
        router.refresh();
    } catch (error) {
        console.error(error);
        setItems(originalItems);
    }
  }

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
        router.refresh();
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
      {!readOnly && selectedItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-[calc(50%+110px)] lg:left-[calc(50%+140px)] z-50 bg-white text-stone-900 border border-stone-200 rounded-full shadow-2xl p-2 px-6 flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <p className="text-sm font-semibold">{selectedItems.length} selected</p>
          <div className="h-4 w-px bg-stone-200" />
          <Button variant="ghost" size="sm" onClick={() => handleOpenMoveDialog(null)} className="h-8 text-stone-600 hover:text-stone-900 hover:bg-stone-100">Move</Button>
          {isInCollectionView ? (
            <Button variant="ghost" size="sm" onClick={handleBulkRemoveFromCollection} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50">Remove</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setItemToDelete(1)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50">Delete</Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelectedItems([])} className="h-8 w-8 p-0 rounded-full hover:bg-stone-100 cursor-pointer"><XIcon className="h-4 w-4 text-stone-400 hover:text-stone-900" /></Button>
        </div>
      )}

      {items && items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            const typeStyle = getTypeStyles(item.content_type); 

            return (
              <Card 
                key={item.id} 
                className={`bg-white border-stone-200 shadow-sm flex flex-col transition-all relative group 
                    ${isSelected ? 'ring-2 ring-stone-900 border-transparent shadow-md' : 'hover:shadow-md hover:border-stone-300'}
                    border-t-4 ${typeStyle.color}
                `}
              >
                {!readOnly && (
                    <div className="absolute top-2 left-2 z-10" onClick={(e) => handleSelectItem(e, item.id)}>
                        <Input type="checkbox" className={`h-5 w-5 cursor-pointer rounded border-stone-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`} checked={isSelected} readOnly />
                    </div>
                )}
                
                {!readOnly && (
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full z-10 cursor-pointer" onClick={(e) => handleToggleFavorite(e, item)}>
                        <Star className={`h-5 w-5 transition-colors ${item.is_favorited ? 'text-amber-400 fill-amber-400' : 'text-stone-300 hover:text-stone-500'}`} />
                    </Button>
                )}

                <div className="flex-grow cursor-pointer p-1" onClick={() => handleOpenDetails(item.id)}>
                  <CardHeader className="pb-2 pr-10">
                    <div className="flex items-center gap-2 mb-2">
                        {typeStyle.icon}
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{item.content_type}</span>
                    </div>
                    <CardTitle className="font-serif text-lg font-bold text-stone-900 break-words leading-tight">
                      {item.processed_title || "Untitled Item"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-stone-500 line-clamp-4 leading-relaxed">{item.processed_summary || "No summary available."}</p>
                  </CardContent>
                </div>
                
                <CardFooter className="flex justify-between items-center pt-0 pb-2">
                     <div className="flex flex-wrap gap-1">
                       {item.processed_tags?.slice(0, 2).map((tag: string) => (<span key={tag} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full border border-stone-200">{tag}</span>))}
                   </div>
                   
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-700 cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="start" className="w-48">
                       <DropdownMenuItem onClick={() => handleOpenDetails(item.id)} className="cursor-pointer font-medium text-stone-700">
                            <Edit className="mr-2 h-4 w-4" /> {readOnly ? "View Details" : "View / Edit"}
                        </DropdownMenuItem>
                       {!readOnly && (
                           <>
                            <DropdownMenuItem onClick={() => handleOpenMoveDialog(item.id)} className="cursor-pointer font-medium text-stone-700">
                                    <FolderInput className="mr-2 h-4 w-4" /> Move to...
                            </DropdownMenuItem>

                            {isInCollectionView ? (
                                <DropdownMenuItem onClick={() => handleRemoveFromCollection(item.id)} className="text-amber-700 cursor-pointer focus:bg-amber-50 focus:text-amber-800">
                                    <LogOut className="mr-2 h-4 w-4" /> Remove from Collection
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => setItemToDelete(item.id)} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            )}
                           </>
                       )}
                     </DropdownMenuContent>
                   </DropdownMenu>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : ( 
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-stone-200 rounded-lg bg-stone-50/50">
            <div className="bg-stone-100 p-4 rounded-full mb-4">
                <FolderInput className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-stone-900">
                {emptyMessage || "Your vault is empty"}
            </h3>
            {!emptyMessage && !readOnly && (
                <p className="text-stone-500 mt-2 max-w-sm">Use the "New Item" button to start capturing your links, notes, and ideas.</p>
            )}
        </div> 
      )}
            
      <ItemDetailsDialog itemId={selectedItemId} isOpen={isDetailsOpen} onClose={handleCloseDetails} onUpdate={handleItemUpdate} readOnly={readOnly} />
      {!readOnly && (
        <>
            <MoveToCollectionDialog isOpen={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen} collections={collections} itemIds={selectedItems.length > 0 ? selectedItems : (itemToMove ? [itemToMove] : [])} onItemMoved={handleItemMoved} />
            <AlertDialog open={itemToDelete !== null || (selectedItems.length > 0 && isDeleting)} onOpenChange={() => {setItemToDelete(null); setIsDeleting(false)}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone and will permanently delete the selected item(s).</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">{isDeleting ? 'Deleting...' : 'Delete'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </>
      )}
    </>
  )
}