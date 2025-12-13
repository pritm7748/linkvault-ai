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
  const router = useRouter()

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    // MAIN CONTAINER: 
    // 1. We access '/background.png' directly (after you move it to public/).
    // 2. We use specific text colors to ensure visibility.
    <div 
        className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center p-8 gap-12 lg:gap-24 overflow-hidden relative"
        style={{
            backgroundImage: "url('/background.png')", 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#2e1065', // Fallback purple if image fails
        }}
    >
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />

        {/* --- LEFT SIDE: BRANDING --- */}
        <div className="relative z-10 w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <h1 className="text-6xl font-extrabold tracking-tighter text-white drop-shadow-2xl">
                LinkVault AI
            </h1>
            <p className="text-3xl text-white/95 font-semibold drop-shadow-lg">
                Save Anything. <br/>
                <span className="text-purple-300">Find Everything.</span>
            </p>
            <p className="text-xl text-white/80 max-w-md font-light">
               Your intelligent second brain. Organize links, notes, and images with the power of Gemini AI.
            </p>
        </div>

        {/* --- RIGHT SIDE: LOGIN CARD --- */}
        <div className="relative z-10 w-full lg:w-1/2 flex justify-center lg:justify-end">
            <Card className="w-full max-w-[420px] border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
                    <CardDescription className="text-slate-600 font-medium">
                        Sign in to access your vault
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="signin" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-slate-200/50 mb-6">
                            <TabsTrigger value="signin" className="cursor-pointer font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                            <TabsTrigger value="signup" className="cursor-pointer font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                            <TabsTrigger value="magiclink" className="cursor-pointer font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">Magic Link</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="signin"><AuthForm mode="signin" /></TabsContent>
                        <TabsContent value="signup"><AuthForm mode="signup" /></TabsContent>
                        <TabsContent value="magiclink"><MagicLinkAuth /></TabsContent>
                    </Tabs>
                    
                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-300" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-slate-500 font-bold backdrop-blur-md">Or continue with</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <Button variant="outline" type="button" onClick={() => handleOAuthLogin('google')} className="cursor-pointer bg-white hover:bg-slate-50 border-slate-300">
                            <ChromeIcon className="mr-2 h-4 w-4 text-slate-700" /> Google
                        </Button>
                        <Button variant="outline" type="button" onClick={() => handleOAuthLogin('github')} className="cursor-pointer bg-white hover:bg-slate-50 border-slate-300">
                            <GitHubLogoIcon className="mr-2 h-4 w-4 text-slate-700" /> GitHub
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

// --- SUB COMPONENTS ---

function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
    const supabase = createClient()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

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
                <Label className="text-slate-700 font-semibold">Email</Label>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-white border-slate-300 focus:border-purple-500 placeholder:text-slate-400" 
                    placeholder="name@example.com"
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Password</Label>
                <Input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="bg-white border-slate-300 focus:border-purple-500 placeholder:text-slate-400" 
                    placeholder="••••••••"
                    required 
                />
            </div>
            {message && <p className="text-sm font-medium text-blue-600 text-center bg-blue-50 p-2 rounded">{message}</p>}
            <Button type="submit" className="w-full cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold" disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin" /> : (mode === 'signin' ? "Sign In" : "Create Account")}
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
        else setMessage("Magic link sent! Check your inbox.")
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Email</Label>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-white border-slate-300 focus:border-purple-500 placeholder:text-slate-400" 
                    placeholder="name@example.com"
                    required 
                />
            </div>
            {message && <p className="text-sm font-medium text-blue-600 text-center bg-blue-50 p-2 rounded">{message}</p>}
            <Button type="submit" className="w-full cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold" disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin" /> : "Send Magic Link"}
            </Button>
        </form>
    )
}