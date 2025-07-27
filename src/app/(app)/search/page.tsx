'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoaderCircle } from 'lucide-react'

type SearchResult = {
  id: number;
  processed_title: string | null;
  processed_summary: string | null;
  processed_tags: string[] | null;
  similarity: number;
};

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (query) {
      const fetchResults = async () => {
        setIsLoading(true)
        setError(null)
        try {
          const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, type }),
          })
          if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || 'Failed to fetch search results')
          }
          const data = await response.json()
          setResults(data)
        // THE FIX: Explicitly type the error object as 'unknown'
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError('An unexpected error occurred.')
          }
        } finally {
          setIsLoading(false)
        }
      }
      fetchResults()
    } else {
      setResults([])
    }
  }, [query, type])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return <p className="text-red-600 text-center py-12">{error}</p>
  }

  return (
    <div className="py-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">
          Search Results for: <span className="text-blue-600">&quot;{query}&quot;</span>
        </h1>
        {type !== 'all' && (
          <Badge variant="secondary" className="capitalize text-base">
            {type}
          </Badge>
        )}
      </div>
      {results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <Card key={item.id} className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="truncate text-slate-800">{item.processed_title || "Untitled"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-3">{item.processed_summary || "No summary available."}</p>
                 <div className="flex flex-wrap gap-2 mt-4">
                    {item.processed_tags?.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-full">{tag}</span>
                    ))}
                </div>
                <p className="text-xs text-blue-500 mt-4 font-mono">Relevance: {(item.similarity * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-slate-500">No results found for your query.</p>
          <p className="text-sm text-slate-400 mt-2">Try searching for something else or adjusting your filters.</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchResults />
        </Suspense>
    )
}
