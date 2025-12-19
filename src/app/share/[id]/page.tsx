import { createServer } from '@/lib/supabase/server'
import { VaultGrid } from '@/app/(app)/vault/_components/vault-grid'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { SaveToVaultButton } from './save-button' // Import the new button

type Props = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ q?: string }>
}

export default async function SharedCollectionPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const collectionId = params.id
  const query = searchParams?.q || ''

  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  const { data: collection, error } = await supabase
    .from('collections')
    .select('name, is_public')
    .eq('id', collectionId)
    .single()

  if (error || !collection || !collection.is_public) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-stone-50 text-center p-4">
            <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-stone-400" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-stone-900 mb-2">Collection Not Found</h1>
                <p className="text-stone-500 max-w-md">
                    This collection is either private, does not exist, or the owner has turned off public access.
                </p>
            </div>
            <Link href="/">
                <Button>Go to LinkVault Home</Button>
            </Link>
        </div>
    )
  }

  let dbQuery = supabase
    .from('vault_items')
    .select('id, processed_title, processed_summary, processed_tags, is_favorited, content_type, original_content, storage_path')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })

  if (query) {
    dbQuery = dbQuery.or(`processed_title.ilike.%${query}%,processed_summary.ilike.%${query}%`)
  }

  const { data: items } = await dbQuery

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-xl tracking-tight">LinkVault AI</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider">Public View</span>
        </div>
        
        {/* NEW BUTTON COMPONENT */}
        <SaveToVaultButton collectionId={collectionId} />
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col gap-2 border-b border-stone-200 pb-6">
            <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Shared Collection</p>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-stone-900">{collection.name}</h1>
        </div>

        <VaultGrid 
            initialItems={items || []} 
            collections={[]} 
            readOnly={true} 
            emptyMessage={query ? `No items found matching "${query}"` : "This collection is empty."}
        />
      </main>
    </div>
  )
}