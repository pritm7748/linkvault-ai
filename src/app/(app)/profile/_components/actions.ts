'use server'

import { createServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// This server action handles updating the user's password.
export async function updatePassword(formData: FormData) {
  const supabase = await createServer()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // --- Validation ---
  if (!password || !confirmPassword) {
    return { error: { message: 'Both password fields are required.' } }
  }

  if (password !== confirmPassword) {
    return { error: { message: 'Passwords do not match.' } }
  }

  if (password.length < 6) {
    return { error: { message: 'Password must be at least 6 characters long.' } }
  }

  // Use Supabase's built-in function to update the user's password.
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('Password update error:', error)
    return { error: { message: `Failed to update password: ${error.message}` } }
  }

  // Revalidate the profile page to ensure UI consistency if needed.
  revalidatePath('/profile')
  return { success: { message: 'Password updated successfully!' } }
}
