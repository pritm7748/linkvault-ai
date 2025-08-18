import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers' // --- ADD THIS IMPORT ---

// @ts-expect-error - The params object is correctly passed by Next.js
export async function GET(req: NextRequest, { params }) {
  const cookieStore = cookies() // --- ADD THIS LINE ---
  const supabase = createServer(cookieStore) // --- PASS cookieStore HERE & REMOVE AWAIT ---
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

// @ts-expect-error - The params object is correctly passed by Next.js
export async function PUT(req: NextRequest, { params }) {
  const cookieStore = cookies() // --- ADD THIS LINE ---
  const supabase = createServer(cookieStore) // --- PASS cookieStore HERE & REMOVE AWAIT ---
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const body = await req.json()
  
  const updateData: { [key: string]: string | string[] | number | null } = {}

  if ('title' in body) updateData.processed_title = body.title;
  if ('summary' in body) updateData.processed_summary = body.summary;
  if ('tags' in body) updateData.processed_tags = body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
  if ('collection_id' in body) updateData.collection_id = body.collection_id === 0 ? null : body.collection_id;

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

// @ts-expect-error - The params object is correctly passed by Next.js
export async function PATCH(req: NextRequest, { params }) {
  const cookieStore = cookies() // --- ADD THIS LINE ---
  const supabase = createServer(cookieStore) // --- PASS cookieStore HERE & REMOVE AWAIT ---
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const itemId = parseInt(params.id, 10)
  if (isNaN(itemId)) {
    return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 })
  }

  try {
    const { is_favorited } = await req.json()

    if (typeof is_favorited !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_favorited value provided' }, { status: 400 })
    }

    const { data: updatedItem, error } = await supabase
      .from('vault_items')
      .update({ is_favorited: is_favorited })
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select('id, is_favorited')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(updatedItem)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}