import { type NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServer()

  // This function invalidates the user's session and removes the auth cookie.
  await supabase.auth.signOut()

  // Redirect the user back to the login page after they have been signed out.
  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}
