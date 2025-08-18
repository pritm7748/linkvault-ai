import { NextResponse, type NextRequest } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers' // --- ADD THIS IMPORT ---

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if next is provided as a query parameter, use it as the redirect path
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies() // --- ADD THIS LINE ---
    const supabase = createServer(cookieStore) // --- PASS cookieStore HERE & REMOVE AWAIT ---
    // Exchange the auth code for a session, which will be stored in a cookie.
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's an error or no code, redirect to the login page.
  return NextResponse.redirect(`${origin}/login`)
}