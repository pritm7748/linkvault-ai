import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

export default async function CollectionPage(props: {
  params: Promise<{ id: string }>,
  searchParams?: Promise<{ q?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';
  const { id } = params;

  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  // 1. Fetch Collection Details (Title)
  const { data: collection, error } = await supabase
    .from('collections')
    .select('name')
    .eq('id', id)
    .single()

  if (error || !collection) {
    notFound()
  }

  // 2. Fetch Items in this Collection
  let dbQuery = supabase
    .from('vault_items')
    .select('*')
    .eq('collection_id', id) // Only this collection
    .order('created_at', { ascending: false })

  // 3. Search Logic (Scoped to Collection)
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
            {query ? `Results for "${query}" in ${collection.name}` : collection.name}
        </h1>
      </div>
      
      <VaultGrid 
        initialItems={itemsResult.data || []} 
        collections={collectionsResult.data || []}
        // FIX: Custom Message
        emptyStateMessage={query ? `No items found matching "${query}"` : "This collection is empty."}
      />
    </div>
  )
}