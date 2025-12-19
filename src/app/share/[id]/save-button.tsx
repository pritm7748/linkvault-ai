'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoaderCircle, Check, CopyPlus, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { saveSharedItemsToVault } from './actions'
import Link from 'next/link'

export function SaveToVaultButton({ collectionId }: { collectionId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'auth_error'>('idle')
  const router = useRouter()

  const handleSave = async () => {
    setStatus('loading')
    
    const result = await saveSharedItemsToVault(collectionId)
    
    if (result.success) {
      setStatus('success')
      // Reset after 3 seconds
      setTimeout(() => setStatus('idle'), 3000)
    } else if (result.error === 'not_authenticated') {
      setStatus('auth_error')
    } else {
      alert("Failed to save items. Please try again.")
      setStatus('idle')
    }
  }

  if (status === 'auth_error') {
    return (
        <Link href="/login">
            <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" /> Log in to Save
            </Button>
        </Link>
    )
  }

  return (
    <Button 
        onClick={handleSave} 
        disabled={status === 'loading' || status === 'success'} 
        variant={status === 'success' ? "secondary" : "outline"} 
        size="sm"
        className="gap-2 transition-all"
    >
        {status === 'loading' && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {status === 'success' && <Check className="h-4 w-4 text-green-600" />}
        {status === 'idle' && <CopyPlus className="h-4 w-4" />}
        
        {status === 'success' ? "Added to Vault" : "Add to your Vault"}
    </Button>
  )
}