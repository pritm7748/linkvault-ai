import { createServer } from '@/lib/supabase/server'
import { UpdatePasswordForm } from './_components/update-password-form'
import { DeleteAccountSection } from './_components/delete-account-section' // Import New Component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cookies } from 'next/headers'

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = createServer(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const isOAuthUser = user?.app_metadata.provider === 'google' || user?.app_metadata.provider === 'github'

  return (
    <div className="py-6">
      
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

        {/* Change Password (Conditional) */}
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

        {/* Danger Zone - NOW FUNCTIONAL */}
        <DeleteAccountSection />

      </div>
    </div>
  )
}