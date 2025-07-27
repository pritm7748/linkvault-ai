import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { notFound } from 'next/navigation'

// THE FIX: We are removing all custom type definitions for the props and
// defining the props object directly in the function signature. This is the
// most robust method and allows Next.js to infer the types correctly.
export default async function CollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createServer()
  const collectionId = params.id

  // THE FIX: We prefix the unused 'error' variables with an underscore
  // to tell TypeScript that we are intentionally not using them.
  const [
    { data: collection, error: collectionError },
    { data: items, error: _itemsError },
    { data: allCollections, error: _allCollectionsError }
  ] = await Promise.all([
    supabase.from('collections').select('name').eq('id', collectionId).single(),
    supabase.from('vault_items').select('id, processed_title, processed_summary, processed_tags').eq('collection_id', collectionId).order('created_at', { ascending: false }),
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
