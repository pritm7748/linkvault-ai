'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Search, Wand2 } from 'lucide-react'
import { QandADialog } from './q-and-a-dialog'
// --- ADDED: Import the main details dialog ---
import { ItemDetailsDialog } from '../vault/_components/item-details-dialog'

type Source = {
  id: number;
  processed_title: string;
  content_type: string;
};

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all')

  const [isQnOpen, setIsQnOpen] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [sources, setSources] = useState<Source[]>([])
  
  // --- ADDED: State for the main ItemDetailsDialog ---
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!query) return;
    
    const params = new URLSearchParams()
    params.set('q', query)
    if (typeFilter !== 'all') {
      params.set('type', typeFilter)
    }

    router.push(`/search?${params.toString()}`)
  }

  const handleAskAI = async () => {
    if (!query) return;
    
    setIsQnOpen(true)
    setIsLoadingAnswer(true)
    setAnswer(null)
    setSources([])

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
      setSources(result.sources || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setAnswer(`Sorry, an error occurred: ${errorMessage}`);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  // --- ADDED: Handler for clicking a source item ---
  const handleSourceClick = (itemId: number) => {
    // Close the Q&A dialog
    setIsQnOpen(false);
    // Open the main details dialog with the selected item
    setSelectedItemId(itemId);
    setIsDetailsOpen(true);
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
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleAskAI} disabled={!query || isLoadingAnswer} className="bg-purple-600 hover:bg-purple-700">
          <Wand2 className="mr-2 h-4 w-4" />
          Ask
        </Button>
      </div>

      <QandADialog 
        isOpen={isQnOpen}
        onOpenChange={setIsQnOpen}
        query={query}
        answer={answer}
        isLoading={isLoadingAnswer}
        sources={sources}
        // --- ADDED: Pass the handler to the dialog ---
        onSourceClick={handleSourceClick}
      />
      
      {/* --- ADDED: The main ItemDetailsDialog to be controlled by this component --- */}
      <ItemDetailsDialog 
        itemId={selectedItemId}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdate={() => router.refresh()} // Refresh data on update
      />
    </>
  )
}