import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // This response object is used to update cookies.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client that can work in the server-side context of middleware.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // A cookie is set, so we update the request and response.
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // A cookie is removed, so we update the request and response.
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Get the current user session.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If the user is not logged in and is trying to access any page other than '/login',
  // redirect them to the login page.
  if (!session && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If the user is logged in and tries to visit the login page,
  // redirect them to the main dashboard.
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If no redirect conditions are met, allow the request to proceed.
  return response
}

// Configure the middleware to run on all paths except for specific internal Next.js routes and API paths.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|auth|favicon.ico).*)',
  ],
}
