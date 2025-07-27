import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { notFound } from 'next/navigation'
import type { JSX } from 'react' // Import JSX type for explicit return typing

// THE FIX: We explicitly type the entire component signature.
// This tells TypeScript that this is an async function that takes specific props
// and returns a Promise that resolves to a JSX Element. This removes all ambiguity.
export default async function CollectionPage({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  const supabase = await createServer()
  const collectionId = params.id

  const [
    { data: collection, error: collectionError },
    { data: items },
    { data: allCollections }
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
