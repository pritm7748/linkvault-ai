import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// THE DEFINITIVE FIX: Destructure params directly in the function signature with the correct type.
export async function DELETE(
  request: NextRequest, 
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
    // First, un-link all items from this collection.
    const { error: updateError } = await supabase
      .from('vault_items')
      .update({ collection_id: null })
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error un-linking items:', updateError)
      throw new Error('Could not update items in collection.')
    }

    // Now, safely delete the collection itself.
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