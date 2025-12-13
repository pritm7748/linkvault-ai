'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input' // Reverted to Input for stability
import { Button } from '@/components/ui/button'
import { Search, Wand2 } from 'lucide-react'
import { QandADialog } from './q-and-a-dialog'
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

  // --- State for Q&A Dialog ---
  const [isQnOpen, setIsQnOpen] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [sources, setSources] = useState<Source[]>([])
  
  // --- State for the main ItemDetailsDialog ---
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const executeSearch = () => {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      executeSearch();
    }
  };

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

  const handleSourceClick = (itemId: number) => {
    setIsQnOpen(false);
    setSelectedItemId(itemId);
    setIsDetailsOpen(true);
  };

  return (
    <>
      <div className="w-full flex items-center gap-2">
        
        {/* INPUT: flex-1 ensures it eats up all the space saved by the smaller buttons */}
        <div className="relative flex-1 min-w-0"> 
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="query"
            placeholder="Search..."
            className="w-full bg-background pl-9 shadow-none h-10 text-base md:text-sm" // text-base prevents iOS zoom
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* SEARCH BUTTON: Icon only on Mobile, Text on Desktop */}
        <Button 
            variant="outline" 
            onClick={executeSearch} 
            disabled={!query}
            className="shrink-0 px-3 md:px-4"
        >
            {/* The margin right (mr-2) only applies on desktop when text is visible */}
            <Search className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Search</span>
        </Button>

        {/* ASK BUTTON: Keep concise */}
        <Button 
            onClick={handleAskAI} 
            disabled={!query || isLoadingAnswer} 
            className="bg-purple-600 hover:bg-purple-700 shrink-0 px-3 md:px-4"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Ask AI</span>
          <span className="md:hidden">Ask</span>
        </Button>
      </div>

      <QandADialog 
        isOpen={isQnOpen}
        onOpenChange={setIsQnOpen}
        query={query}
        answer={answer}
        isLoading={isLoadingAnswer}
        sources={sources}
        onSourceClick={handleSourceClick}
      />
      
      <ItemDetailsDialog 
        itemId={selectedItemId}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdate={() => router.refresh()}
      />
    </>
  )
}