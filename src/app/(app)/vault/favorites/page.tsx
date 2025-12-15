import { createServer } from '@/lib/supabase/server';
import { VaultGrid } from '../_components/vault-grid';
import { cookies } from 'next/headers';

export default async function FavoritesPage(props: {
  searchParams?: Promise<{ q?: string }>
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';

  const cookieStore = cookies();
  const supabase = await createServer(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Please sign in.</div>;

  const { data: collections } = await supabase
    .from('collections')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name');
    
  let dbQuery = supabase
    .from('vault_items')
    .select('id, content_type, processed_title, processed_summary, processed_tags, is_favorited')
    .eq('user_id', user.id)
    .eq('is_favorited', true) 
    .order('created_at', { ascending: false });

  if (query) {
    dbQuery = dbQuery.or(`processed_title.ilike.%${query}%,processed_summary.ilike.%${query}%`)
  }

  const { data: favoriteItems } = await dbQuery;
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Overview</p>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            {query ? `Search Favorites: "${query}"` : "Favorites"}
        </h1>
      </div>
      
      <VaultGrid 
        initialItems={favoriteItems || []} 
        collections={collections || []} 
        // FIX: Custom Empty Message logic
        emptyMessage={
            query 
                ? `No favorites found matching "${query}"` 
                : "You haven't favorited any items yet."
        }
      />
    </div>
  );
}