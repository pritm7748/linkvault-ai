'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea' // Changed from Input to Textarea
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // --- State for Q&A Dialog ---
  const [isQnOpen, setIsQnOpen] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [sources, setSources] = useState<Source[]>([])
  
  // --- State for the main ItemDetailsDialog ---
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // --- Auto-Resize Logic ---
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to calculate scrollHeight correctly
      textareaRef.current.style.height = '40px'; 
      // Set new height based on content, capped at ~120px (approx 5 lines)
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [query]);

  const executeSearch = () => {
    if (!query.trim()) return; // Prevent empty searches
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // --- Handle Enter Key ---
  // Enter = Submit, Shift+Enter = New Line
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line
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
      <div className="w-full flex items-end gap-2">
        <div className="relative flex-grow">
          {/* Icon stays fixed at the top-left */}
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          
          <Textarea
            ref={textareaRef}
            name="query"
            placeholder="Search your vault or ask a question..."
            // Classes Breakdown:
            // min-h-[40px]: Matches button height
            // text-base: 16px font size on mobile (prevents iOS zoom)
            // md:text-sm: Smaller font on desktop
            // resize-none: Hides the manual resize handle
            className="w-full min-h-[40px] max-h-[120px] resize-none overflow-y-auto bg-background pl-9 pr-4 py-[9px] shadow-none rounded-md border-input focus-visible:ring-1 focus-visible:ring-ring text-base md:text-sm leading-tight transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>

        <Button 
            variant="outline" 
            onClick={executeSearch} 
            disabled={!query}
            className="h-10 mb-0 shrink-0"
        >
            <Search className="mr-2 h-4 w-4" />
            Search
        </Button>
        <Button 
            onClick={handleAskAI} 
            disabled={!query || isLoadingAnswer} 
            className="bg-purple-600 hover:bg-purple-700 h-10 mb-0 shrink-0"
        >
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