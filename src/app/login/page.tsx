'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// THE FIX: Removed unused 'KeyRound', 'Mail', and 'Wand2' imports
import { ChromeIcon, LoaderCircle } from 'lucide-react' 
import { GitHubLogoIcon } from '@radix-ui/react-icons'

function PasswordAuthForm({ action }: { action: 'signin' | 'signup' }) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    if (action === 'signup') {
      if (password.length < 6) {
        setMessage("Password must be at least 6 characters long.")
        setIsSubmitting(false)
        return
      }
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` }
      });
      if (error) setMessage(error.message)
      else setMessage("Check your email for a verification link!")
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message)
      else router.push('/')
    }
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${action}-email`}>Email</Label>
        <Input id={`${action}-email`} type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${action}-password`}>Password</Label>
        <Input id={`${action}-password`} type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {message && <p className="text-center text-sm text-green-400 p-2 bg-green-900/20 rounded-md">{message}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="animate-spin" /> : (action === 'signin' ? 'Sign In' : 'Sign Up')}
      </Button>
    </form>
  )
}

function MagicLinkForm() {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setMessage(null)
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${location.origin}/auth/callback` }
        })
        if (error) setMessage(error.message)
        else setMessage("Check your email for a magic link!")
        setIsSubmitting(false)
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input id="magic-email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {message && <p className="text-center text-sm text-green-400 p-2 bg-green-900/20 rounded-md">{message}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Send Magic Link'}
            </Button>
        </form>
    )
}

export default function LoginPage() {
  const supabase = createClient()

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen" suppressHydrationWarning>
      <div className="flex items-center justify-center py-12">
        <Card className="mx-auto w-[400px] border-none shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">LinkVault AI</CardTitle>
            <CardDescription>Your intelligent second brain.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Password</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="magiclink">Magic Link</TabsTrigger>
              </TabsList>
              <TabsContent value="signin"><PasswordAuthForm action="signin" /></TabsContent>
              <TabsContent value="signup"><PasswordAuthForm action="signup" /></TabsContent>
              <TabsContent value="magiclink"><MagicLinkForm /></TabsContent>
            </Tabs>
            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="outline" type="button" onClick={() => handleOAuthLogin('google')}>
                    <ChromeIcon className="mr-2 h-4 w-4" /> Google
                </Button>
                 <Button variant="outline" type="button" onClick={() => handleOAuthLogin('github')}>
                    <GitHubLogoIcon className="mr-2 h-4 w-4" /> GitHub
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center p-12 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-600">
         <div className="text-center">
            <h1 className="text-5xl font-bold text-white tracking-tighter">Save Anything.</h1>
            <h1 className="text-5xl font-bold text-white tracking-tighter">Find Everything.</h1>
            {/* THE FIX: Replaced ' with &apos; */}
            <p className="mt-4 text-lg text-purple-200">The last knowledge tool you&apos;ll ever need.</p>
         </div>
      </div>
    </div>
  )
}
