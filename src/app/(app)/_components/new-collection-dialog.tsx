    'use client'

    import { useState, useRef } from 'react'
    import { createCollection } from './actions'
    import { Button } from '@/components/ui/button'
    import { Input } from '@/components/ui/input'
    import { Label } from '@/components/ui/label'
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
    import { LoaderCircle } from 'lucide-react'

    type NewCollectionDialogProps = {
      isOpen: boolean;
      onOpenChange: (isOpen: boolean) => void;
    };

    export function NewCollectionDialog({ isOpen, onOpenChange }: NewCollectionDialogProps) {
      const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
      const [isSubmitting, setIsSubmitting] = useState(false)
      const formRef = useRef<HTMLFormElement>(null)

      const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        setMessage(null)

        const result = await createCollection(formData)

        if (result?.error) {
          setMessage({ type: 'error', text: result.error.message })
        } else if (result?.success) {
          setMessage({ type: 'success', text: result.success.message })
          formRef.current?.reset() 
          
          setTimeout(() => onOpenChange(false), 1000)
        }
        setIsSubmitting(false)
      }

      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>
                Give your new collection a name to start organizing your items.
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} ref={formRef}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" name="name" className="col-span-3" required />
                </div>
              </div>
              {message && (
                <p className={`text-center text-sm p-2 rounded-md ${
                  message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>{message.text}</p>
              )}
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Create Collection'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )
    }
    