'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { LoaderCircle } from 'lucide-react'

type AddFormProps = {
  contentType: 'note' | 'link' | 'image' | 'video';
};

export function AddForm({ contentType }: AddFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    formData.append('contentType', contentType)

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.')
      }
      
      router.push('/vault')
      router.refresh(); 

    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({type: 'error', text: error.message})
      } else {
        setMessage({type: 'error', text: 'An unexpected error occurred.'})
      }
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm max-w-2xl">
      <CardContent className="pt-6">
        <form key={contentType} onSubmit={handleSubmit} className="grid gap-4">
          {contentType === 'note' && (
            <Textarea name="content" placeholder="Type your note here..." className="bg-slate-100 border-slate-300 min-h-[150px]" required />
          )}
          {contentType === 'link' && (
            <Input name="content" type="url" placeholder="https://example.com" className="bg-slate-100 border-slate-300" required />
          )}
          {contentType === 'video' && (
            <Input name="content" type="url" placeholder="https://www.youtube.com/watch?v=..." className="bg-slate-100 border-slate-300" required />
          )}
          {contentType === 'image' && (
            <Input name="file" type="file" className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300" accept="image/*" required />
          )}
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : `Save ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`}
            </Button>
          </div>

          {message && (
            <p className={`text-center text-sm p-2 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>{message.text}</p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}