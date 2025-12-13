'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChromeIcon, LoaderCircle, Sparkles } from 'lucide-react' 
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
    // MAIN CONTAINER: Dark AI Theme generated via CSS (No external images required)
    <div className="min-h-screen w-full flex items-center justify-center p-4 lg:p-8 overflow-hidden relative bg-slate-950 selection:bg-purple-500/30">
        
        {/* --- CSS BACKGROUND EFFECTS --- */}
        {/* 1. Purple Glow at Top Center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
        {/* 2. Blue Glow at Bottom Right */}
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        {/* 3. Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">
            
            {/* --- LEFT SIDE: BRANDING --- */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-200 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span>Now with Gemini 2.0 Flash</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-white drop-shadow-2xl">
                    LinkVault <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">AI</span>
                </h1>
                
                <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                    Your intelligent second brain. Save links, notes, and images, and let AI organize them for you.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start">
                   <div className="flex -space-x-4 rtl:space-x-reverse">
                        {[1,2,3,4].map((i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-xs text-white font-bold">
                                {String.fromCharCode(64+i)}
                            </div>
                        ))}
                   </div>
                   <p className="flex items-center text-sm text-slate-500">Trusted by 1,000+ thinkers</p>
                </div>
            </div>

            {/* --- RIGHT SIDE: LOGIN CARD --- */}
            <div className="w-full lg:w-[420px]">
                <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
                    <CardHeader className="text-center pb-6 border-b border-white/5">
                        <CardTitle className="text-2xl font-bold text-white">Get Started</CardTitle>
                        <CardDescription className="text-slate-400">
                            Sign in to access your vault
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Tabs defaultValue="signin" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-black/20 mb-6 border border-white/5">
                                <TabsTrigger value="signin" className="cursor-pointer text-slate-400 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Sign In</TabsTrigger>
                                <TabsTrigger value="signup" className="cursor-pointer text-slate-400 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Sign Up</TabsTrigger>
                                <TabsTrigger value="magiclink" className="cursor-pointer text-slate-400 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Magic Link</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="signin"><AuthForm mode="signin" /></TabsContent>
                            <TabsContent value="signup"><AuthForm mode="signup" /></TabsContent>
                            <TabsContent value="magiclink"><MagicLinkAuth /></TabsContent>
                        </Tabs>
                        
                        <div className="mt-8 relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-slate-500 font-medium">Or continue with</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <Button variant="outline" type="button" onClick={() => handleOAuthLogin('google')} className="cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white h-11">
                                <ChromeIcon className="mr-2 h-4 w-4" /> Google
                            </Button>
                            <Button variant="outline" type="button" onClick={() => handleOAuthLogin('github')} className="cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white h-11">
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

// --- SUB COMPONENTS (Logic Preserved, UI Upgraded) ---

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
                <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 h-11" 
                    placeholder="name@example.com"
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</Label>
                <Input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 h-11" 
                    placeholder="••••••••"
                    required 
                />
            </div>
            {message && <p className="text-sm font-medium text-blue-400 text-center bg-blue-900/20 p-2 rounded border border-blue-500/30">{message}</p>}
            <Button type="submit" className="w-full cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]" disabled={loading}>
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
                <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 h-11" 
                    placeholder="name@example.com"
                    required 
                />
            </div>
            {message && <p className="text-sm font-medium text-blue-400 text-center bg-blue-900/20 p-2 rounded border border-blue-500/30">{message}</p>}
            <Button type="submit" className="w-full cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]" disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin" /> : "Send Magic Link"}
            </Button>
        </form>
    )
}