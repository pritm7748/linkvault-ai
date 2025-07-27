import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'

// This function handles the DELETE request to remove an item.
export async function DELETE(req: NextRequest) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the item ID from the request body.
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
  }

  // Perform the delete operation in the database.
  // We also match on user_id to ensure a user can only delete their own items.
  const { error } = await supabase
    .from('vault_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ message: 'Item deleted successfully' })
}
