'use server'

import { createServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function renameChat(chatId: number, newTitle: string) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  const { error } = await supabase
    .from('chats')
    .update({ title: newTitle })
    .eq('id', chatId)

  if (error) return { error: error.message }
  revalidatePath('/chat')
  return { success: true }
}

export async function deleteChat(chatId: number) {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)

  if (error) return { error: error.message }
  revalidatePath('/chat')
  return { success: true }
}