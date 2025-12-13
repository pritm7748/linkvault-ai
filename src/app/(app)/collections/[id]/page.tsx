import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'

// Define the correct type for Next.js 15 dynamic routes
type Props = {
  params: Promise<{ id: string }>
}

export default async function CollectionPage(props: Props) {
  // 1. Await the params before accessing properties
  const params = await props.params;
  const collectionId = params.id;

  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  const [
    { data: collection, error: collectionError },
    { data: items },
    { data: allCollections }
  ] = await Promise.all([
    supabase.from('collections').select('name').eq('id', collectionId).single(),
    supabase.from('vault_items').select('id, processed_title, processed_summary, processed_tags, is_favorited').eq('collection_id', collectionId).order('created_at', { ascending: false }),
    supabase.from('collections').select('id, name').order('name')
  ]);

  if (collectionError || !collection) {
    console.error("Collection Load Error:", collectionError);
    notFound();
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <p className="text-sm text-stone-500 font-medium uppercase tracking-wide">Collection</p>
        <h1 className="text-3xl font-bold text-stone-900 mt-1">{collection.name}</h1>
      </div>
      <VaultGrid initialItems={items || []} collections={allCollections || []} />
    </div>
  )
}