'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { LoaderCircle, Trash2 } from 'lucide-react'
import { deleteAccount } from '../actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function DeleteAccountSection() {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
        const result = await deleteAccount()
        if (result.error) {
            alert("Error: " + result.error)
            setIsDeleting(false)
        } else {
            // Force client-side signout to clear cookies/local state immediately
            await supabase.auth.signOut()
            router.push('/')
            router.refresh()
        }
    } catch (e) {
        setIsDeleting(false)
        alert("An unexpected error occurred.")
    }
  }

  return (
    <div className="md:col-span-2">
        <Card className="border-red-500/50 bg-red-50">
            <CardHeader>
                <CardTitle className="text-red-800">Danger Zone</CardTitle>
                <CardDescription className="text-red-700">These actions are irreversible. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-semibold text-red-900">Delete Account</h3>
                        <p className="text-sm text-red-700">Permanently delete your account and all of your data.</p>
                    </div>
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                                Delete Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your account, your vault items, and remove your data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={isDeleting}>
                                    {isDeleting ? <LoaderCircle className="animate-spin h-4 w-4" /> : "Yes, delete my account"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}