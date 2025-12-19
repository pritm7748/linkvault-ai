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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceKey || !supabaseUrl) {
    return { error: 'Server configuration error. Admin key missing.' }
  }

  try {
    // 3. Initialize Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log(`[Delete Account] Attempting to delete user: ${user.id}`)

    // 4. Aggressive Data Cleanup
    const { count: itemsCount, error: itemsError } = await supabaseAdmin
        .from('vault_items')
        .delete({ count: 'exact' }) // Count how many we delete
        .eq('user_id', user.id)
    
    if (itemsError) {
        console.error("[Delete Account] Items Delete Error:", itemsError)
        return { error: `Failed to delete items: ${itemsError.message}` }
    }
    console.log(`[Delete Account] Deleted ${itemsCount} vault items.`)

    const { count: collectionsCount, error: collectionsError } = await supabaseAdmin
        .from('collections')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)

    if (collectionsError) {
        console.error("[Delete Account] Collections Delete Error:", collectionsError)
        return { error: `Failed to delete collections: ${collectionsError.message}` }
    }
    console.log(`[Delete Account] Deleted ${collectionsCount} collections.`)

    // 5. Delete User
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
        console.error("[Delete Account] Auth Delete Error:", deleteError)
        return { error: `Auth Deletion Failed: ${deleteError.message}` }
    }
    
    console.log("[Delete Account] User deleted successfully.")

  } catch (error: any) {
    console.error("[Delete Account] Unexpected Error:", error)
    return { error: `Server Error: ${error.message || 'Unknown'}` }
  }

  return { success: true }
}