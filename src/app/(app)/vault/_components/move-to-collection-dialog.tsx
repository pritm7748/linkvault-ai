'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoaderCircle } from 'lucide-react'

type Collection = { id: number; name: string };

type MoveToCollectionDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  collections: Collection[];
  itemId: number | null;
  onItemMoved: (itemId: number, collectionId: number | null) => void;
};

export function MoveToCollectionDialog({ isOpen, onOpenChange, collections, itemId, onItemMoved }: MoveToCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMoveItem = async () => {
    if (!itemId || selectedCollectionId === null) return;
    setIsSubmitting(true)
    try {
      await fetch(`/api/vault/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection_id: Number(selectedCollectionId) || null }),
      })
      onItemMoved(itemId, Number(selectedCollectionId) || null)
      onOpenChange(false) // Close dialog on success
    } catch (error) {
      console.error("Failed to move item", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Move Item to Collection</DialogTitle>
          <DialogDescription>Select a collection to move this item into.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select onValueChange={setSelectedCollectionId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a collection..." />
            </SelectTrigger>
            <SelectContent>
              {/* --- REMOVED "None" option --- */}
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
            {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Move Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}