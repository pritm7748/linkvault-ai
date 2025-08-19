'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { LoaderCircle, Wand2, Link as LinkIcon, StickyNote, Image as ImageIcon, Video as VideoIcon } from 'lucide-react'

type Source = {
  id: number;
  processed_title: string;
  content_type: string;
};

type QandADialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  query: string;
  answer: string | null;
  sources: Source[];
  isLoading: boolean;
  // --- ADD THIS NEW PROP ---
  onSourceClick: (itemId: number) => void; 
};

const getIconForType = (type: string) => {
  switch (type) {
    case 'note': return <StickyNote className="h-4 w-4 text-slate-500" />;
    case 'link': return <LinkIcon className="h-4 w-4 text-slate-500" />;
    case 'image': return <ImageIcon className="h-4 w-4 text-slate-500" />;
    case 'video': return <VideoIcon className="h-4 w-4 text-slate-500" />;
    default: return null;
  }
}

export function QandADialog({ isOpen, onOpenChange, query, answer, isLoading, sources, onSourceClick }: QandADialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-2xl max-h-[80vh] flex flex-col">
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

        <div className="space-y-4 overflow-y-auto pr-2">
          <div className="prose prose-sm max-w-none text-slate-800">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            {answer && <p>{answer}</p>}
          </div>

          {!isLoading && sources && sources.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold text-sm text-slate-600">Sources</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sources.map(source => (
                  // --- ADDED onClick HANDLER ---
                  <div 
                    key={source.id} 
                    className="flex items-center gap-2 p-2 bg-slate-100 rounded-md border text-sm cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => onSourceClick(source.id)}
                  >
                    {getIconForType(source.content_type)}
                    <span className="truncate text-slate-700">{source.processed_title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}