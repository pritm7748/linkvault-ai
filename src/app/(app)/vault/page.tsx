import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from './_components/vault-grid'
import { cookies } from 'next/headers' // --- ADD THIS IMPORT ---

export default async function VaultPage() {
  const cookieStore = cookies() // --- ADD THIS LINE ---
  const supabase = createServer(cookieStore) // --- PASS cookieStore HERE ---
  
  // Fetch both items and collections
  const [
    { data: items },
    { data: collections }
  ] = await Promise.all([
    // --- ADDED is_favorited to the select query ---
    supabase.from('vault_items').select('id, processed_title, processed_summary, processed_tags, is_favorited').order('created_at', { ascending: false }),
    supabase.from('collections').select('id, name').order('name')
  ]);

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">My Vault</h1>
      {/* Pass both items and collections to the grid component */}
      <VaultGrid initialItems={items || []} collections={collections || []} />
    </div>
  )
}