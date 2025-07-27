'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all')

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const params = new URLSearchParams()
    params.set('q', query)
    if (typeFilter !== 'all') {
      params.set('type', typeFilter)
    }

    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="w-full flex items-center gap-2">
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          name="query"
          placeholder="Ask your vault anything..."
          className="w-full appearance-none bg-background pl-8 shadow-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="note">Notes</SelectItem>
          <SelectItem value="link">Links</SelectItem>
          <SelectItem value="image">Images</SelectItem>
        </SelectContent>
      </Select>
    </form>
  )
}
