'use server'

import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function deleteAccount() {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  // 1. Verify Session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized: You must be logged in.' }
  }

  // 2. Check for Service Key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.")
    return { error: 'Server configuration error. Please contact support.' }
  }

  try {
    // 3. Initialize Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 4. Attempt Deletion
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
        console.error("Delete User Failed:", deleteError.message)
        return { error: deleteError.message } // Pass the actual error to the UI
    }

  } catch (error: any) {
    console.error("Unexpected Server Error:", error)
    return { error: 'An unexpected error occurred during deletion.' }
  }

  return { success: true }
}