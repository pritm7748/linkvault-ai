// src/app/login/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChromeIcon, LoaderCircle } from 'lucide-react' 
import { GitHubLogoIcon } from '@radix-ui/react-icons'

// --- COMPONENT: Password Form (Logic Unchanged) ---
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
        <Input 
            id={`${action}-email`} 
            type="email" 
            placeholder="m@example.com" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            // Added simple transparency to inputs to match glass theme
            className="bg-white/50 border-white/40 focus:bg-white" 
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${action}-password`}>Password</Label>
        <Input 
            id={`${action}-password`} 
            type="password" 
            placeholder="••••••••" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/50 border-white/40 focus:bg-white"
        />
      </div>
      {message && <p className="text-center text-sm text-blue-800 p-2 bg-blue-100/50 rounded-md backdrop-blur-sm">{message}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="animate-spin" /> : (action === 'signin' ? 'Sign In' : 'Sign Up')}
      </Button>
    </form>
  )
}

// --- COMPONENT: Magic Link Form (Logic Unchanged) ---
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
                <Input 
                    id="magic-email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="bg-white/50 border-white/40 focus:bg-white"
                />
            </div>
            {message && <p className="text-center text-sm text-blue-800 p-2 bg-blue-100/50 rounded-md backdrop-blur-sm">{message}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Send Magic Link'}
            </Button>
        </form>
    )
}

// --- COMPONENT: Main Page (UPDATED UI) ---
export default function LoginPage() {
  const supabase = createClient()

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    // UPDATED: Main container with Background Image
    <div 
        className="flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/images/background.png')" }}
    >
        {/* Optional Overlay to ensure text readability if background is bright */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />

        {/* Glassmorphism Card */}
        <Card className="relative z-10 mx-4 w-full max-w-[420px] border-white/20 bg-white/60 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">LinkVault AI</CardTitle>
            <CardDescription className="text-slate-700 font-medium">
              Your intelligent second brain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/5">
                <TabsTrigger value="signin">Password</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="magiclink">Magic Link</TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                <TabsContent value="signin"><PasswordAuthForm action="signin" /></TabsContent>
                <TabsContent value="signup"><PasswordAuthForm action="signup" /></TabsContent>
                <TabsContent value="magiclink"><MagicLinkForm /></TabsContent>
              </div>
            </Tabs>
            
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-slate-600 font-semibold backdrop-blur-sm rounded">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-6">
                <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => handleOAuthLogin('google')}
                    className="bg-white/50 border-white/40 hover:bg-white/80"
                >
                    <ChromeIcon className="mr-2 h-4 w-4" /> Google
                </Button>
                 <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => handleOAuthLogin('github')}
                    className="bg-white/50 border-white/40 hover:bg-white/80"
                >
                    <GitHubLogoIcon className="mr-2 h-4 w-4" /> GitHub
                </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}