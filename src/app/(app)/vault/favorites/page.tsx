import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '../_components/vault-grid'
import { cookies } from 'next/headers'

export default async function FavoritesPage(props: {
  searchParams?: Promise<{ q?: string }>
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';

  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  // 1. Build Query for Favorites Only
  let dbQuery = supabase
    .from('vault_items')
    .select('*')
    .eq('is_favorited', true) // Only favorites
    .order('created_at', { ascending: false })

  // 2. Search Logic (Same as Vault, but scoped to Favorites)
  if (query) {
    dbQuery = dbQuery.or(`processed_title.ilike.%${query}%,processed_summary.ilike.%${query}%`)
  }

  const [itemsResult, collectionsResult] = await Promise.all([
    dbQuery,
    supabase.from('collections').select('id, name').order('name')
  ])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Collection</p>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            {query ? `Results for "${query}" in Favorites` : "Favorites"}
        </h1>
      </div>
      
      <VaultGrid 
        initialItems={itemsResult.data || []} 
        collections={collectionsResult.data || []}
        // FIX: Custom Message
        emptyStateMessage={query ? `No favorites found matching "${query}"` : "You haven't favorited any items yet."}
      />
    </div>
  )
}