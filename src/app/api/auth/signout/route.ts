import { type NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers' // --- ADD THIS IMPORT ---

export async function POST(req: NextRequest) {
  const cookieStore = cookies() // --- ADD THIS LINE ---
  const supabase = createServer(cookieStore) // --- PASS cookieStore HERE & REMOVE AWAIT ---

  // This function invalidates the user's session and removes the auth cookie.
  await supabase.auth.signOut()

  // Redirect the user back to the login page after they have been signed out.
  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}