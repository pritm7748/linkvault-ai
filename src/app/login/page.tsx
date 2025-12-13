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

// --- COMPONENT: Password Form ---
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
            className="bg-white/50 border-white/40 focus:bg-white transition-colors" 
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
            className="bg-white/50 border-white/40 focus:bg-white transition-colors"
        />
      </div>
      {message && <p className="text-center text-sm text-blue-800 p-2 bg-blue-100/50 rounded-md backdrop-blur-sm">{message}</p>}
      
      <Button type="submit" className="w-full cursor-pointer hover:bg-slate-800 transition-colors" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="animate-spin" /> : (action === 'signin' ? 'Sign In' : 'Sign Up')}
      </Button>
    </form>
  )
}

// --- COMPONENT: Magic Link Form ---
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
                    className="bg-white/50 border-white/40 focus:bg-white transition-colors"
                />
            </div>
            {message && <p className="text-center text-sm text-blue-800 p-2 bg-blue-100/50 rounded-md backdrop-blur-sm">{message}</p>}
            
            <Button type="submit" className="w-full cursor-pointer hover:bg-slate-800 transition-colors" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Send Magic Link'}
            </Button>
        </form>
    )
}

// --- MAIN PAGE ---
export default function LoginPage() {
  const supabase = createClient()

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div 
        style={{
            // 1. Force the background image via inline style (highest priority)
            backgroundImage: "url('/images/background.png')", 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            // 2. Fallback color if image is missing
            backgroundColor: '#1e1b4b', 
            // 3. Force full screen dimensions
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            inset: 0,
            overflow: 'auto'
        }}
        className="flex items-center justify-center"
    >
        
        {/* Dark Overlay */}
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-0 pointer-events-none" />

        {/* --- CONTENT LAYER --- */}
        <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen px-4 gap-12 lg:gap-24 mx-auto">
            
            {/* LEFT SIDE: Branding */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                <h1 className="text-6xl font-bold tracking-tighter text-white drop-shadow-2xl">
                    LinkVault AI
                </h1>
                <p className="text-2xl text-white/95 font-medium max-w-lg drop-shadow-md">
                    Save Anything. <br/>
                    <span className="text-purple-200">Find Everything.</span>
                </p>
                <p className="text-lg text-white/90 max-w-md drop-shadow-sm font-light">
                   Your intelligent second brain. Organize links, notes, and images with the power of Gemini AI.
                </p>
            </div>

            {/* RIGHT SIDE: Login Card */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                <Card className="w-full max-w-[420px] border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
                    <CardDescription className="text-slate-600">
                      Sign in to access your vault
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="signin" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-black/5 mb-4">
                        <TabsTrigger value="signin" className="cursor-pointer data-[state=active]:bg-white data-[state=active]:shadow-sm">Password</TabsTrigger>
                        <TabsTrigger value="signup" className="cursor-pointer data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                        <TabsTrigger value="magiclink" className="cursor-pointer data-[state=active]:bg-white data-[state=active]:shadow-sm">Magic Link</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="signin"><PasswordAuthForm action="signin" /></TabsContent>
                      <TabsContent value="signup"><PasswordAuthForm action="signup" /></TabsContent>
                      <TabsContent value="magiclink"><MagicLinkForm /></TabsContent>
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
                            className="bg-white/50 border-white/40 hover:bg-white/80 cursor-pointer transition-colors"
                        >
                            <ChromeIcon className="mr-2 h-4 w-4" /> Google
                        </Button>
                         <Button 
                            variant="outline" 
                            type="button" 
                            onClick={() => handleOAuthLogin('github')}
                            className="bg-white/50 border-white/40 hover:bg-white/80 cursor-pointer transition-colors"
                        >
                            <GitHubLogoIcon className="mr-2 h-4 w-4" /> GitHub
                        </Button>
                    </div>
                  </CardContent>
                </Card>
            </div>
        </div>
    </div>
  )
}