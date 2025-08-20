// src/app/api/collections/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const collectionId = parseInt(params.id, 10)
  if (isNaN(collectionId)) {
    return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
  }

  try {
    // First, we need to un-link all items from this collection.
    // This sets collection_id to null for all items in the collection.
    const { error: updateError } = await supabase
      .from('vault_items')
      .update({ collection_id: null })
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error un-linking items:', updateError)
      throw new Error('Could not update items in collection.')
    }

    // Now, we can safely delete the collection itself.
    const { error: deleteError } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id)
      
    if (deleteError) {
      console.error('Error deleting collection:', deleteError)
      throw new Error('Could not delete collection.')
    }

    return NextResponse.json({ message: 'Collection deleted successfully' })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}