'use server'

import { createServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'


export async function updatePassword(formData: FormData) {
  const supabase = await createServer()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  
  if (!password || !confirmPassword) {
    return { error: { message: 'Both password fields are required.' } }
  }

  if (password !== confirmPassword) {
    return { error: { message: 'Passwords do not match.' } }
  }

  if (password.length < 6) {
    return { error: { message: 'Password must be at least 6 characters long.' } }
  }

  
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('Password update error:', error)
    return { error: { message: `Failed to update password: ${error.message}` } }
  }

  
  revalidatePath('/profile')
  return { success: { message: 'Password updated successfully!' } }
}
