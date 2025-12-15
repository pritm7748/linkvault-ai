import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'

type Props = {
  params: Promise<{ id: string }>,
  searchParams?: Promise<{ q?: string }>
}

export default async function CollectionPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const collectionId = params.id;
  const query = searchParams?.q || '';

  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  // 1. Fetch Collection Info
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('name')
    .eq('id', collectionId)
    .single()

  if (collectionError || !collection) {
    notFound();
  }

  // 2. Build Query
  let dbQuery = supabase
    .from('vault_items')
    .select('id, processed_title, processed_summary, processed_tags, is_favorited, content_type')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })

  // 3. Search Logic (Scoped to this collection)
  if (query) {
    dbQuery = dbQuery.or(`processed_title.ilike.%${query}%,processed_summary.ilike.%${query}%`)
  }

  const [itemsResult, allCollectionsResult] = await Promise.all([
    dbQuery,
    supabase.from('collections').select('id, name').order('name')
  ]);

  const items = itemsResult.data || []
  const allCollections = allCollectionsResult.data || []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Collection</p>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            {query ? `Search: "${query}"` : collection.name}
        </h1>
      </div>
      
      <VaultGrid 
        initialItems={items} 
        collections={allCollections} 
        // FIX: Custom Empty Message logic
        emptyMessage={
            query 
                ? `No items found in "${collection.name}" matching "${query}"` 
                : "This collection is empty."
        }
      />
    </div>
  )
}