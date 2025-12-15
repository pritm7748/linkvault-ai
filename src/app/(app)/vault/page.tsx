import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { cookies } from 'next/headers'

export default async function VaultPage(props: {
  searchParams?: Promise<{ q?: string }>
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';

  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  // 1. Base Query
  let dbQuery = supabase
    .from('vault_items')
    .select('id, processed_title, processed_summary, processed_tags, is_favorited, content_type')
    .order('created_at', { ascending: false })

  // 2. SEARCH LOGIC: Title OR Summary
  if (query) {
    // This syntax says: "title contains query OR summary contains query"
    dbQuery = dbQuery.or(`processed_title.ilike.%${query}%,processed_summary.ilike.%${query}%`)
  }

  // 3. Fetch Collections (for the dropdowns)
  const [itemsResult, collectionsResult] = await Promise.all([
    dbQuery,
    supabase.from('collections').select('id, name').order('name')
  ]);

  const items = itemsResult.data || []
  const allCollections = collectionsResult.data || []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Overview</p>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            {query ? `Results for "${query}"` : "My Vault"}
        </h1>
      </div>
      
      <VaultGrid initialItems={items} collections={allCollections} />
    </div>
  )
}