import { createServer } from '@/lib/supabase/server'
import { UpdatePasswordForm } from './_components/update-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cookies } from 'next/headers' // --- ADD THIS IMPORT ---

export default async function ProfilePage() {
  const cookieStore = cookies() // --- ADD THIS LINE ---
  const supabase = createServer(cookieStore) // --- PASS cookieStore HERE & REMOVE AWAIT ---
  const { data: { user } } = await supabase.auth.getUser()

  
  const isOAuthUser = user?.app_metadata.provider === 'google' || user?.app_metadata.provider === 'github'

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      <div className="grid gap-8 md:grid-cols-2 max-w-4xl">
        
        {/* User Information Card */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>This is the information associated with your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
              <div className="flex justify-between">
              <span className="text-slate-500">Sign-in Method:</span>
              <span className="font-medium capitalize">{user?.app_metadata.provider || 'Email'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Conditionally render the password update form */}
        {isOAuthUser ? (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                You signed in using an external provider (e.g., Google, GitHub). Password management is handled by that account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <UpdatePasswordForm />
        )}

        {/* Danger Zone for Account Deletion */}
        <div className="md:col-span-2">
            <Card className="border-red-500/50 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-800">Danger Zone</CardTitle>
                    <CardDescription className="text-red-700">These actions are irreversible. Please proceed with caution.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-red-800">Delete Account</h3>
                            <p className="text-sm text-red-600">Permanently delete your account and all of your data.</p>
                        </div>
                        <Button variant="destructive" disabled>Delete Account</Button>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  )
}