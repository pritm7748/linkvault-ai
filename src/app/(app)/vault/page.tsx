import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function VaultPage(props: {
  searchParams?: Promise<{ q?: string }>
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';

  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  // 1. Get User (Strict Check)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Base Query (Restricted to Current User)
  let dbQuery = supabase
    .from('vault_items')
    .select('id, processed_title, processed_summary, processed_tags, is_favorited, content_type')
    .eq('user_id', user.id) // <--- CRITICAL FIX
    .order('created_at', { ascending: false })

  // 3. SEARCH LOGIC
  if (query) {
    dbQuery = dbQuery.or(`processed_title.ilike.%${query}%,processed_summary.ilike.%${query}%`)
  }

  // 4. Fetch Collections (Restricted to Current User)
  const [itemsResult, collectionsResult] = await Promise.all([
    dbQuery,
    supabase
        .from('collections')
        .select('id, name')
        .eq('user_id', user.id) // <--- CRITICAL FIX
        .order('name')
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