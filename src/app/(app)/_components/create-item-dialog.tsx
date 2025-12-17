'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Link as LinkIcon, FileText, Image as ImageIcon, Video, LoaderCircle, FileUp } from 'lucide-react'

export function CreateItemDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("link")
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null)
  
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    formData.append('contentType', activeTab)

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.')
      }
      
      setIsOpen(false)
      router.refresh() 

    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({type: 'error', text: error.message})
      } else {
        setMessage({type: 'error', text: 'An unexpected error occurred.'})
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
        setMessage(null)
        setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start gap-2 bg-stone-900 hover:bg-stone-800 text-white shadow-sm mb-4 cursor-pointer">
            <Plus className="h-4 w-4" /> New Item
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] w-[95vw] bg-white text-stone-900 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add to Vault</DialogTitle>
        </DialogHeader>
        
        {/* FIX: Changed grid-cols-4 to grid-cols-5 to fit the new Document tab */}
        <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-stone-100 p-1">
            <TabsTrigger value="link" className="data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer" title="Link"><LinkIcon className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="note" className="data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer" title="Note"><FileText className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer" title="Image"><ImageIcon className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer" title="Video"><Video className="h-4 w-4" /></TabsTrigger>
            {/* NEW TAB */}
            <TabsTrigger value="document" className="data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer" title="Document"><FileUp className="h-4 w-4" /></TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            
            <TabsContent value="link" className="space-y-4 mt-0">
                <div className="space-y-2">
                    <Label>Website URL</Label>
                    <Input name="content" type="url" placeholder="https://example.com" required={activeTab === 'link'} className="bg-stone-50" />
                    <p className="text-xs text-stone-500">We will summarize the content for you.</p>
                </div>
            </TabsContent>

            <TabsContent value="note" className="space-y-4 mt-0">
                <div className="space-y-2">
                    <Label>Your Note</Label>
                    <Textarea 
                        name="content" 
                        placeholder="Type your thought..." 
                        className="min-h-[200px] max-h-[350px] w-full bg-stone-50 resize-none break-words whitespace-pre-wrap overflow-y-auto" 
                        required={activeTab === 'note'} 
                    />
                </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4 mt-0">
                <div className="space-y-2">
                    <Label>Upload Image</Label>
                    <Input name="file" type="file" accept="image/*" className="cursor-pointer bg-stone-50" required={activeTab === 'image'} />
                </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-4 mt-0">
                <div className="space-y-2">
                    <Label>YouTube URL</Label>
                    <Input name="content" type="url" placeholder="https://youtube.com/watch?v=..." required={activeTab === 'video'} className="bg-stone-50" />
                    <p className="text-xs text-stone-500">We will fetch the transcript and summarize it.</p>
                </div>
            </TabsContent>

            {/* NEW CONTENT FOR DOCUMENT */}
            <TabsContent value="document" className="space-y-4 mt-0">
                <div className="space-y-2">
                    <Label>Upload Document</Label>
                    <Input 
                        name="file" 
                        type="file" 
                        accept=".pdf,.docx,.txt,.md" 
                        className="cursor-pointer bg-stone-50" 
                        required={activeTab === 'document'} 
                    />
                    <p className="text-xs text-stone-500">Supported: PDF, Word, Text, Markdown.</p>
                </div>
            </TabsContent>

            {message && (
                <div className={`text-sm p-3 rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full bg-stone-900 hover:bg-stone-800 cursor-pointer">
                {isLoading ? <LoaderCircle className="animate-spin mr-2 h-4 w-4" /> : "Save to Vault"}
            </Button>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}