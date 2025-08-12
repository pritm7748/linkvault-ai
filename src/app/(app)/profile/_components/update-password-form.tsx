'use client'

import { useState } from 'react'
import { updatePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LoaderCircle } from 'lucide-react'

export function UpdatePasswordForm() {
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setMessage(null)

    const result = await updatePassword(formData)

    
    if (result?.error) {
      setMessage({ type: 'error', text: result.error.message })
    } else if (result?.success) {
      setMessage({ type: 'success', text: result.success.message })
    }

    setIsSubmitting(false)
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Enter a new password for your account.</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Update Password'}
          </Button>
          {message && (
            <p className={`mt-4 text-sm ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>{message.text}</p>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
