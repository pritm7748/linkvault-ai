    'use server'

    import { createServer } from '@/lib/supabase/server'
    import { revalidatePath } from 'next/cache'

    
    export async function createCollection(formData: FormData) {
      const supabase = await createServer()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: { message: 'You must be logged in to create a collection.' } }
      }

      const collectionName = formData.get('name') as string

      if (!collectionName || collectionName.trim().length < 2) {
        return { error: { message: 'Collection name must be at least 2 characters long.' } }
      }

      const { error } = await supabase
        .from('collections')
        .insert({ name: collectionName, user_id: user.id })

      if (error) {
        if (error.code === '23505') { 
          return { error: { message: 'A collection with this name already exists.' } }
        }
        console.error('Error creating collection:', error)
        return { error: { message: 'Failed to create collection.' } }
      }

      
      revalidatePath('/', 'layout')
      return { success: { message: 'Collection created successfully!' } }
    }
    