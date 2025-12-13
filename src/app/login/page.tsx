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

export default function LoginPage() {
  const supabase = createClient()

  // --- AUTH HANDLERS ---
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  // --- RENDER ---
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* === LAYER 1: THE BACKGROUND IMAGE === 
            We use a standard HTML <img> tag with forced styling.
            This bypasses all CSS/Tailwind conflicts. 
        */}
        <img 
            src="/images/background.png" 
            alt="App Background"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                objectFit: 'cover',
                zIndex: -1, // Puts it behind everything
            }}
            // Debugging: If this fails, it logs to your browser console
            onError={(e) => console.error("Image failed to load:", e.currentTarget.src)}
        />

        {/* === LAYER 2: DARK OVERLAY === 
            Makes text readable on top of the image
        */}
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0, 0.3)', // 30% Dark tint
                backdropFilter: 'blur(4px)',
                zIndex: 0, 
            }}
        />

        {/* === LAYER 3: CONTENT === 
            Sits on top of everything (z-10)
        */}
        <div className="relative z-10 container flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 px-4">
            
            {/* Left Side: Branding */}
            <div className="text-center lg:text-left space-y-4 max-w-lg">
                <h1 className="text-6xl font-bold tracking-tighter text-white drop-shadow-xl">
                    LinkVault AI
                </h1>
                <p className="text-2xl text-white/90 font-medium">
                    Save Anything. <br/> <span className="text-purple-300">Find Everything.</span>
                </p>
                <p className="text-lg text-white/75">
                   Your intelligent second brain.
                </p>
            </div>

            {/* Right Side: Login Card */}
            <Card className="w-full max-w-[400px] border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
                    <CardDescription className="text-slate-600">Sign in to your vault</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="signin" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-black/5 mb-4">
                            <TabsTrigger value="signin">Password</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                            <TabsTrigger value="magiclink">Magic Link</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="signin"><AuthForm mode="signin" /></TabsContent>
                        <TabsContent value="signup"><AuthForm mode="signup" /></TabsContent>
                        <TabsContent value="magiclink"><MagicLinkAuth /></TabsContent>
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
                        <Button variant="outline" type="button" onClick={() => handleOAuthLogin('google')} className="bg-white/50 hover:bg-white/80">
                            <ChromeIcon className="mr-2 h-4 w-4" /> Google
                        </Button>
                        <Button variant="outline" type="button" onClick={() => handleOAuthLogin('github')} className="bg-white/50 hover:bg-white/80">
                            <GitHubLogoIcon className="mr-2 h-4 w-4" /> GitHub
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

// --- SUB-COMPONENTS (Logic Preserved) ---

function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (mode === 'signup') {
             const { error } = await supabase.auth.signUp({ 
                email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` }
             })
             if (error) setMessage(error.message)
             else setMessage("Check email for verification!")
        } else {
             const { error } = await supabase.auth.signInWithPassword({ email, password })
             if (error) setMessage(error.message)
             else router.push('/')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white/50 focus:bg-white" required />
            </div>
            <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-white/50 focus:bg-white" required />
            </div>
            {message && <p className="text-xs text-blue-600 text-center">{message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin" /> : (mode === 'signin' ? "Sign In" : "Sign Up")}
            </Button>
        </form>
    )
}

function MagicLinkAuth() {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithOtp({
            email, options: { emailRedirectTo: `${location.origin}/auth/callback` }
        })
        if (error) setMessage(error.message)
        else setMessage("Magic link sent!")
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white/50 focus:bg-white" required />
            </div>
            {message && <p className="text-xs text-blue-600 text-center">{message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin" /> : "Send Magic Link"}
            </Button>
        </form>
    )
}