'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { LoaderCircle, ExternalLink, Edit, Save, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

type VaultItemFull = {
  id: number;
  created_at: string;
  content_type: string;
  original_content: string | null;
  processed_title: string | null;
  processed_summary: string | null;
  processed_tags: string[] | null;
  storage_path: string | null;
  is_favorited: boolean;
};

type ItemDetailsDialogProps = {
  itemId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedItem: VaultItemFull) => void;
  readOnly?: boolean;
};

export function ItemDetailsDialog({ itemId, isOpen, onClose, onUpdate, readOnly = false }: ItemDetailsDialogProps) {
  const [item, setItem] = useState<VaultItemFull | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (itemId && isOpen) {
      const fetchItemDetails = async () => {
        setIsLoading(true)
        setError(null)
        setImageUrl(null)

        try {
          const response = await fetch(`/api/vault/${itemId}`)
          if (!response.ok) throw new Error('Failed to fetch item details.')
          const data: VaultItemFull = await response.json()
          
          setItem(data)
          setTitle(data.processed_title || '')
          setSummary(data.processed_summary || '')
          setTags((data.processed_tags || []).join(', '))

          if (data.content_type === 'image') {
            if (data.storage_path) {
                const { data: signedData } = await supabase.storage
                    .from('vault.images')
                    .createSignedUrl(data.storage_path, 3600)
                setImageUrl(signedData?.signedUrl || null)
            } else if (data.original_content) {
                setImageUrl(data.original_content)
            }
          }

        } catch (err: unknown) {
          if (err instanceof Error) setError(err.message)
          else setError('An unexpected error occurred.')
        } finally {
          setIsLoading(false)
        }
      }
      fetchItemDetails()
    } else {
      setItem(null)
      setIsEditing(false)
    }
  }, [itemId, isOpen])

  const handleSaveChanges = async () => {
    if (!item || readOnly) return;
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/vault/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary, tags }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to save changes.')
      }
      const updatedItem = await response.json()
      onUpdate(updatedItem)
      setIsEditing(false)
    } catch (err: unknown) {
        if (err instanceof Error) setError(err.message)
        else setError('An unexpected error occurred.')
    } finally {
        setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!item) return;
    if (item.storage_path) {
        try {
            const { data, error } = await supabase.storage
                .from('vault.images')
                .createSignedUrl(item.storage_path, 60)
            if (error) throw error
            window.open(data.signedUrl, '_blank');
        } catch (error) {
            console.error('Error downloading file:', error)
            setError('Could not create download link.')
        }
        return;
    }
    if (item.original_content) {
        window.open(item.original_content, '_blank');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        
        <DialogHeader className="p-6 pb-2 flex-none border-b border-transparent">
          <DialogTitle className={isEditing ? 'sr-only' : 'text-2xl font-serif pr-8'}>
            {item?.processed_title || 'Loading Item...'}
          </DialogTitle>
          {isEditing && (
            <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="text-2xl font-serif h-auto p-0 border-0 shadow-none focus-visible:ring-0 mb-1" 
            />
          )}
          <DialogDescription>
             {item ? new Date(item.created_at).toLocaleString() : 'Please wait'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
            {isLoading && <div className="flex justify-center p-12"><LoaderCircle className="animate-spin" /></div>}
            {error && <p className="text-red-600 p-4">{error}</p>}
            
            {item && !isLoading && (
              <div className="space-y-6">
                
                {item.content_type === 'image' && imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex justify-center">
                        <img src={imageUrl} alt="Saved" className="max-w-full max-h-[500px] object-contain" />
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="font-semibold text-base">Summary</Label>
                    {isEditing ? (
                    <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="min-h-[150px] bg-slate-50" />
                    ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{item.processed_summary}</p>
                    )}
                </div>
                
                <div className="space-y-2">
                    <Label className="font-semibold text-base">Tags</Label>
                    {isEditing ? (
                    <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., ai, tech, news" className="bg-slate-50" />
                    ) : (
                    <div className="flex flex-wrap gap-2">
                        {item.processed_tags?.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-full">{tag}</span>
                        ))}
                    </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="font-semibold text-base">
                        {item.content_type === 'note' ? 'Full Note' : 'Original Source'}
                    </Label>
                    
                    <div className={cn(
                        "text-sm text-slate-500 rounded-md bg-slate-50 p-3 border border-slate-100",
                        item.content_type === 'note' ? "whitespace-pre-wrap" : "break-all"
                    )}>
                        {item.original_content}
                    </div>
                    
                    {/* FIX: Link for Tweet, Video, Link, and Instagram */}
                    {(item.content_type === 'link' || item.content_type === 'video' || item.content_type === 'tweet' || item.content_type === 'instagram') && (
                    <a href={item.original_content || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1 mt-1">
                        {item.content_type === 'tweet' ? "Visit Tweet" : item.content_type === 'instagram' ? "Visit Post" : "Visit Link"} <ExternalLink className="h-3 w-3" />
                    </a>
                    )}

                    {(item.content_type === 'image' || item.content_type === 'document') && (
                    <Button variant="outline" size="sm" onClick={handleDownload} className="mt-2">
                        <Download className="mr-2 h-4 w-4" />
                        {item.content_type === 'image' ? "Download Image" : "Download Document"}
                    </Button>
                    )}
                </div>
              </div>
            )}
        </div>

        {item && !isLoading && !readOnly && (
            <DialogFooter className="p-4 border-t bg-white flex-none">
            {isEditing ? (
                <Button onClick={handleSaveChanges} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            ) : (
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            )}
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}