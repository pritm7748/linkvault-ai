'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input' 
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
  const pathname = usePathname() // --- ADDED: To check current page ---
  
  const [query, setQuery] = useState(searchParams.get('q') || '')

  // --- State for Q&A Dialog ---
  const [isQnOpen, setIsQnOpen] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [sources, setSources] = useState<Source[]>([])
  
  // --- State for the main ItemDetailsDialog ---
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Sync local state with URL params when they change
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  // --- LOGIC 1: Hide Search on specific chat pages (/chat/123) ---
  // If path starts with /chat/ and has an ID after it
  if (pathname.match(/^\/chat\/\d+/)) {
    return <div className="w-full flex-1" /> // Return empty spacer to maintain layout
  }

  // Determine context
  const isChatDashboard = pathname === '/chat'

  const executeSearch = () => {
    // Allow clearing search by searching empty string
    if (!query.trim()) {
        if (isChatDashboard) router.replace('/chat');
        else router.push('/vault');
        return;
    }

    if (isChatDashboard) {
        // On Chat Dashboard: Update URL to filter the list
        router.replace(`/chat?q=${encodeURIComponent(query)}`);
    } else {
        // On Vault/Other: Redirect to Vault with search query
        router.push(`/vault?q=${encodeURIComponent(query)}`);
    }
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
        
        <div className="relative flex-1 min-w-0"> 
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="query"
            // --- LOGIC 2: Dynamic Placeholder ---
            placeholder={isChatDashboard ? "Search conversation titles..." : "Search..."}
            className="w-full bg-background pl-9 shadow-none h-10 text-base md:text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <Button 
            variant="outline" 
            onClick={executeSearch} 
            disabled={!query}
            className="shrink-0 px-3 md:px-4"
        >
            <Search className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Search</span>
        </Button>

        {/* --- LOGIC 3: Hide "Ask AI" on Chat Dashboard --- */}
        {!isChatDashboard && (
            <Button 
                onClick={handleAskAI} 
                disabled={!query || isLoadingAnswer} 
                className="bg-purple-600 hover:bg-purple-700 shrink-0 px-3 md:px-4"
            >
            <Wand2 className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Ask AI</span>
            <span className="md:hidden">Ask</span>
            </Button>
        )}
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