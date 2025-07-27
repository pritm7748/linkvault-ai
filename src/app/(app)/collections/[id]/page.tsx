import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { notFound } from 'next/navigation'

// THE FIX: Instead of creating a custom type, we directly define the shape
// of the props that Next.js provides to a dynamic page component.
export default async function CollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createServer()
  const collectionId = params.id

  // Fetch the collection's details, its items, AND the full list of all collections.
  const [
    { data: collection, error: collectionError },
    // THE FIX: Prefix unused variables with an underscore to resolve warnings.
    { data: items, error: _itemsError },
    { data: allCollections, error: _allCollectionsError }
  ] = await Promise.all([
    supabase.from('collections').select('name').eq('id', collectionId).single(),
    supabase.from('vault_items').select('id, processed_title, processed_summary, processed_tags').eq('collection_id', collectionId).order('created_at', { ascending: false }),
    supabase.from('collections').select('id, name').order('name')
  ]);

  // If the collection doesn't exist, show a 404 page.
  if (collectionError) {
    notFound();
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Collection</p>
        <h1 className="text-3xl font-bold">{collection.name}</h1>
      </div>
      {/* Pass both the items for this collection AND the full list of collections to the grid. */}
      <VaultGrid initialItems={items || []} collections={allCollections || []} />
    </div>
  )
}
