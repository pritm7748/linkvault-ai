// src/app/(app)/_components/q-and-a-dialog.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { LoaderCircle, Wand2 } from 'lucide-react'

type QandADialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  query: string;
  answer: string | null;
  isLoading: boolean;
};

export function QandADialog({ isOpen, onOpenChange, query, answer, isLoading }: QandADialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            <span className="font-serif">AI Answer</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-left">
            <p className="font-semibold text-slate-800">Your question:</p>
            <p className="italic text-slate-600">&quot;{query}&quot;</p>
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none text-slate-800 max-h-[50vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          {answer && <p>{answer}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}