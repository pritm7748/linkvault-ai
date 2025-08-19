'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button' // --- ADDED ---
import { Search, Wand2 } from 'lucide-react' // --- ADDED Wand2 ---
import { QandADialog } from './q-and-a-dialog' // --- ADDED ---

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all')

  // --- NEW STATE for Q&A Dialog ---
  const [isQnOpen, setIsQnOpen] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!query) return; // Don't search if query is empty
    
    const params = new URLSearchParams()
    params.set('q', query)
    if (typeFilter !== 'all') {
      params.set('type', typeFilter)
    }

    router.push(`/search?${params.toString()}`)
  }

  // --- NEW FUNCTION to handle AI Q&A ---
  const handleAskAI = async () => {
    if (!query) return; // Don't ask if query is empty
    
    setIsQnOpen(true)
    setIsLoadingAnswer(true)
    setAnswer(null)

    try {
      const response = await fetch('/api/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'The AI failed to respond.');
      }
      setAnswer(result.answer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setAnswer(`Sorry, an error occurred: ${errorMessage}`);
    } finally {
      setIsLoadingAnswer(false);
    }
  };


  return (
    <>
      <div className="w-full flex items-center gap-2">
        <form onSubmit={handleSearch} className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="query"
            placeholder="Search your vault or ask a question..."
            className="w-full appearance-none bg-background pl-8 shadow-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[120px] shrink-0">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="link">Links</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem> {/* Added video filter */}
          </SelectContent>
        </Select>

        {/* --- NEW BUTTON for AI Q&A --- */}
        <Button onClick={handleAskAI} disabled={!query || isLoadingAnswer} className="bg-purple-600 hover:bg-purple-700">
          <Wand2 className="mr-2 h-4 w-4" />
          Ask
        </Button>
      </div>

      {/* --- NEW DIALOG to display the answer --- */}
      <QandADialog 
        isOpen={isQnOpen}
        onOpenChange={setIsQnOpen}
        query={query}
        answer={answer}
        isLoading={isLoadingAnswer}
      />
    </>
  )
}