'use server'

import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  // 1. Verify Session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  try {
    // 2. Initialize Admin Client (Required to delete users)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 3. Delete the User (This cascades to the database if you set up "On Delete Cascade" in SQL)
    // If not, we might need to manually delete vault_items first, but usually Auth deletion handles it.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
        console.error("Delete User Error:", deleteError)
        return { error: deleteError.message }
    }

  } catch (error) {
    console.error("Server Error:", error)
    return { error: 'Failed to delete account' }
  }

  // 4. Sign out and Redirect
  return { success: true }
}