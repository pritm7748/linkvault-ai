import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'

// --- GET Handler: Fetches full details for a single vault item ---
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  if (!id) {
    return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json({ error: 'Item not found or database error' }, { status: 404 })
  }

  return NextResponse.json(item)
}


// --- PUT Handler: Updates a single vault item ---
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  // THE FIX: Explicitly type the request body
  const body = await req.json() as { [key: string]: unknown };

  const updateData: { [key: string]: unknown } = {}

  if (typeof body.title === 'string') updateData.processed_title = body.title;
  if (typeof body.summary === 'string') updateData.processed_summary = body.summary;
  if (typeof body.tags === 'string') updateData.processed_tags = body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
  if (typeof body.collection_id === 'number') updateData.collection_id = body.collection_id === 0 ? null : body.collection_id;

  if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: updatedItem, error } = await supabase
    .from('vault_items')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json(updatedItem)
}
