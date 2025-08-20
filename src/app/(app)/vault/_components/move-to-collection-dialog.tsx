'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { LoaderCircle } from 'lucide-react'

type Collection = { id: number; name: string };

type MoveToCollectionDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  collections: Collection[];
  itemIds: number[]; 
  onItemMoved: (itemId: number, collectionId: number | null) => void;
};

export function MoveToCollectionDialog({ isOpen, onOpenChange, collections, itemIds, onItemMoved }: MoveToCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMoveItem = async () => {
    if (itemIds.length === 0 || selectedCollectionId === null) return;
    setIsSubmitting(true)
    
    try {
      if (selectedCollectionId === 'FAVORITES') {
        // --- NEW: Handle favoriting items ---
        for (const itemId of itemIds) {
          await fetch(`/api/vault/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_favorited: true }),
          });
          // Note: We don't call onItemMoved here as it's not a collection move
        }
      } else {
        // --- Existing logic for moving to a collection ---
        for (const itemId of itemIds) {
          await fetch(`/api/vault/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collection_id: Number(selectedCollectionId) || null }),
          });
          onItemMoved(itemId, Number(selectedCollectionId) || null)
        }
      }
      onOpenChange(false) // Close dialog on success
    } catch (error) {
      console.error("Failed to move item(s)", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Move Item(s) to Collection</DialogTitle>
          <DialogDescription>
            Select a collection to move the selected {itemIds.length > 1 ? `${itemIds.length} items` : 'item'} into.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select onValueChange={setSelectedCollectionId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a collection..." />
            </SelectTrigger>
            <SelectContent>
              {/* --- NEW: Add Favorites as a special option --- */}
              <SelectItem value="FAVORITES">⭐ Favorites</SelectItem>
              <SelectSeparator />
              {collections.map(collection => (
                <SelectItem key={collection.id} value={String(collection.id)}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
          <Button onClick={handleMoveItem} disabled={isSubmitting || !selectedCollectionId}>
            {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Move Item(s)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}