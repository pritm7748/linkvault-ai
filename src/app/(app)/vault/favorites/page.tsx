// src/app/(app)/vault/favorites/page.tsx

import { createServer } from '@/lib/supabase/server';
import { VaultGrid } from '../_components/vault-grid';
import { cookies } from 'next/headers'; // Import cookies

export default async function FavoritesPage() {
  const cookieStore = cookies(); // Required for server-side Supabase client
  const supabase = await createServer(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div>Please sign in to view your favorites.</div>;
  }

  // Fetch all collections to pass to the MoveToCollectionDialog within VaultGrid
  const { data: collections } = await supabase
    .from('collections')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name');
    
  const { data: favoriteItems, error } = await supabase
    .from('vault_items')
    .select('id, content_type, processed_title, processed_summary, processed_tags, is_favorited')
    .eq('user_id', user.id)
    // This is the key filter for this page
    .eq('is_favorited', true) 
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorite items:', error);
    return <div>Error loading your favorites.</div>;
  }
  
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Favorites</h1>
      {favoriteItems && favoriteItems.length > 0 ? (
        <VaultGrid initialItems={favoriteItems} collections={collections || []} />
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-background">
            <h3 className="font-serif text-xl font-semibold">You haven&apos;t favorited any items yet.</h3>
            <p className="text-muted-foreground mt-2">Click the star on an item to add it here.</p>
        </div>
      )}
    </div>
  );
}