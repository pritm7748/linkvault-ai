import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from './_components/vault-grid'
import { cookies } from 'next/headers'

export default async function VaultPage() {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  // Fetch both items and collections
  const [
    { data: items },
    { data: collections }
  ] = await Promise.all([
    supabase
      .from('vault_items')
      .select('id, processed_title, processed_summary, processed_tags, is_favorited')
      // --- THE FIX: Sort by favorites first, then by creation date ---
      .order('is_favorited', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('collections')
      .select('id, name')
      .order('name')
  ]);

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">My Vault</h1>
      {/* Pass both items and collections to the grid component */}
      <VaultGrid initialItems={items || []} collections={collections || []} />
    </div>
  )
}