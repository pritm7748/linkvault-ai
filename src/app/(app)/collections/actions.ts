'use server'

import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function toggleCollectionVisibility(collectionId: number, isPublic: boolean) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('collections')
    .update({ is_public: isPublic })
    .eq('id', collectionId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to update collection visibility')
  
  revalidatePath(`/collections/${collectionId}`)
  return { success: true }
}