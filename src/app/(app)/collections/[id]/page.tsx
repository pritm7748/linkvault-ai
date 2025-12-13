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
    
    // --- FIX: Added 'content_type' to the select list below ---
    supabase.from('vault_items')
      .select('id, processed_title, processed_summary, processed_tags, is_favorited, content_type') 
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false }),
      
    supabase.from('collections').select('id, name').order('name')
  ]);

  if (collectionError || !collection) {
    console.error("Collection Load Error:", collectionError);
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Collection</p>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">{collection.name}</h1>
      </div>
      
      {/* Now 'items' includes content_type, so VaultGrid will accept it */}
      <VaultGrid initialItems={items || []} collections={allCollections || []} />
    </div>
  )
}