import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers' // --- ADD THIS IMPORT ---

// @ts-expect-error - Server Component Props are handled by Next.js
export default async function CollectionPage({ params }) {
  const cookieStore = cookies() // --- ADD THIS LINE ---
  const supabase = createServer(cookieStore) // --- PASS cookieStore HERE ---
  const collectionId = params.id

  const [
    { data: collection, error: collectionError },
    { data: items },
    { data: allCollections }
  ] = await Promise.all([
    supabase.from('collections').select('name').eq('id', collectionId).single(),
    // --- ADDED is_favorited to the select query ---
    supabase.from('vault_items').select('id, processed_title, processed_summary, processed_tags, is_favorited').eq('collection_id', collectionId).order('created_at', { ascending: false }),
    supabase.from('collections').select('id, name').order('name')
  ]);

  if (collectionError) {
    notFound();
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Collection</p>
        <h1 className="text-3xl font-bold">{collection.name}</h1>
      </div>
      <VaultGrid initialItems={items || []} collections={allCollections || []} />
    </div>
  )
}