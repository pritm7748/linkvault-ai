'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Share2, Copy, Check, Globe, Lock } from 'lucide-react'
import { toggleCollectionVisibility } from '../actions'

export function ShareCollectionDialog({ collectionId, initialIsPublic }: { collectionId: number, initialIsPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Assuming your app is hosted at the origin
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/${collectionId}` : ''

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true)
    try {
      await toggleCollectionVisibility(collectionId, checked)
      setIsPublic(checked)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Collection</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this collection. They cannot edit or delete items.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <div className="flex items-center space-x-2">
                <Switch id="public-mode" checked={isPublic} onCheckedChange={handleToggle} disabled={isLoading} />
                <Label htmlFor="public-mode" className="font-medium flex items-center gap-2">
                    {isPublic ? <Globe className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4 text-stone-400" />}
                    {isPublic ? "Public Access is On" : "Private Collection"}
                </Label>
            </div>
          </div>
        </div>

        {isPublic && (
            <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">Link</Label>
                <Input id="link" defaultValue={shareUrl} readOnly className="bg-stone-50" />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
            </div>
        )}
      </DialogContent>
    </Dialog>
  )
}