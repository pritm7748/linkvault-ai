import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)

  // 1. Check Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized. Please log in to LinkVault.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, content, title, sourceUrl } = body

    // 2. Prepare Data based on Type
    // We map the incoming extension data to your Supabase schema
    let insertData: any = {
      user_id: user.id,
      content_type: type,
      processed_title: title || 'New Capture',
      // For now, we put the content in summary or title so you can see it. 
      // You can add a 'raw_url' or 'raw_text' column to your DB later for better storage.
      original_url: sourceUrl
    }

    if (type === 'link') {
        insertData.original_url = content; // The URL itself
        insertData.processed_summary = "Link saved from Chrome Extension";
    } else if (type === 'image') {
        insertData.original_url = content; // The Image Source URL
        insertData.processed_summary = "Image saved from Chrome Extension";
    } else if (type === 'note') {
        // For notes, we put the text in the summary for now
        insertData.processed_summary = content; 
        insertData.processed_title = "Note: " + title;
    }

    // 3. Insert into Supabase
    const { data, error } = await supabase
      .from('vault_items')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Insert Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 4. Success
    return NextResponse.json({ success: true, item: data })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}