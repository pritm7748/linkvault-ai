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
    console.error("Server Config Error: Missing SUPABASE_SERVICE_ROLE_KEY")
    return { error: 'Server configuration error. Admin key missing.' }
  }

  try {
    // 3. Initialize Admin Client (Bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 4. EXPLICITLY DELETE DATA FIRST (Aggressive Cleanup)
    // We do this manually to ensure data is gone even if Auth deletion fails
    const { error: itemsError } = await supabaseAdmin
        .from('vault_items')
        .delete()
        .eq('user_id', user.id)
    
    if (itemsError) {
        console.error("Manual Data Cleanup Failed (Items):", itemsError)
        return { error: `Failed to delete items: ${itemsError.message}` }
    }

    const { error: collectionsError } = await supabaseAdmin
        .from('collections')
        .delete()
        .eq('user_id', user.id)

    if (collectionsError) {
        console.error("Manual Data Cleanup Failed (Collections):", collectionsError)
        return { error: `Failed to delete collections: ${collectionsError.message}` }
    }

    // 5. NOW Delete the User
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
        console.error("Delete User Failed:", deleteError.message)
        return { error: `Auth Deletion Failed: ${deleteError.message}` }
    }

  } catch (error: any) {
    console.error("Unexpected Server Error:", error)
    return { error: `Server Error: ${error.message || 'Unknown'}` }
  }

  return { success: true }
}