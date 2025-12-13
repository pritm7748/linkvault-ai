import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from './_components/vault-grid'
import { cookies } from 'next/headers'

export default async function VaultPage() {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  const [
    { data: items },
    { data: collections }
  ] = await Promise.all([
    supabase
      .from('vault_items')
      // --- ADDED 'content_type' to this list ---
      .select('id, processed_title, processed_summary, processed_tags, is_favorited, content_type, created_at')
      .order('is_favorited', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('collections')
      .select('id, name')
      .order('name')
  ]);

  return (
    <div className="flex flex-col gap-4"> 
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">My Vault</h1>
      </div>
      
      <VaultGrid initialItems={items || []} collections={collections || []} />
    </div>
  )
}