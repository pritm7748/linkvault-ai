'use server'

import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function saveSharedItemsToVault(collectionId: string) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'not_authenticated' }
  }

  // 2. Fetch the items from the shared collection
  // (We select specific fields to copy, ignoring ID/User/Date)
  const { data: sourceItems, error: fetchError } = await supabase
    .from('vault_items')
    .select('content_type, original_content, original_url, processed_title, processed_summary, processed_tags, embedding, storage_path')
    .eq('collection_id', collectionId)

  if (fetchError || !sourceItems || sourceItems.length === 0) {
    return { success: false, error: 'no_items_found' }
  }

  // 3. Prepare items for insertion
  const newItems = sourceItems.map(item => ({
    ...item,
    user_id: user.id,
    collection_id: null, // As requested: Add to vault, but not to a collection
    is_favorited: false,
    created_at: new Date().toISOString()
  }))

  // 4. Bulk Insert
  const { error: insertError } = await supabase
    .from('vault_items')
    .insert(newItems)

  if (insertError) {
    console.error("Copy Error:", insertError)
    return { success: false, error: 'insert_failed' }
  }

  return { success: true, count: newItems.length }
}