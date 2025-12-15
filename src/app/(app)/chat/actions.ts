'use server'

import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function renameChat(chatId: number, newTitle: string) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  const { error } = await supabase.from('chats').update({ title: newTitle }).eq('id', chatId)
  if (error) return { error: error.message }
  revalidatePath('/chat')
  return { success: true }
}

export async function deleteChat(chatId: number) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  const { error } = await supabase.from('chats').delete().eq('id', chatId)
  if (error) return { error: error.message }
  revalidatePath('/chat')
  return { success: true }
}

// --- NEW PIN ACTION ---
export async function togglePinChat(chatId: number, currentStatus: boolean) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  const { error } = await supabase
    .from('chats')
    .update({ is_pinned: !currentStatus }) // Flip the boolean
    .eq('id', chatId)

  if (error) return { error: error.message }
  revalidatePath('/chat')
  return { success: true }
}