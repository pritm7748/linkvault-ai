'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChromeIcon, LoaderCircle } from 'lucide-react' 
import { GitHubLogoIcon } from '@radix-ui/react-icons'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  
  // State to track active tab for Dynamic Headings
  const [activeTab, setActiveTab] = useState("signin")

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  // Dynamic Text Logic
  const getHeaderText = () => {
    switch(activeTab) {
      case 'signup': return { title: "Create an Account", subtitle: "Start building your second brain" }
      case 'magiclink': return { title: "Passwordless Login", subtitle: "We'll email you a magic link" }
      default: return { title: "Welcome Back", subtitle: "Sign in to access your vault" }
    }
  }

  const headerText = getHeaderText()

  return (
    // THEME: Lighter, Vibrant Indigo/Purple Gradient (Not too dark)
    <div className="min-h-screen w-full flex items-center justify-center p-4 lg:p-8 overflow-hidden relative bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 selection:bg-purple-300 selection:text-indigo-900">
        
        {/* --- CSS BACKGROUND GLOW EFFECTS --- */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-32">
            
            {/* --- LEFT SIDE: BRANDING --- */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                
                <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tighter text-white drop-shadow-xl">
                    LinkVault <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-blue-200">AI</span>
                </h1>
                
                <div className="space-y-4 max-w-lg">
                    <p className="text-3xl font-semibold text-indigo-100 leading-tight">
                        Capture the chaos. <br/>
                        <span className="text-purple-300">Recall the brilliance.</span>
                    </p>
                    <p className="text-lg text-indigo-200/80 font-light leading-relaxed">
                        The intelligent workspace that organizes your digital life. Save links, notes, and images—let AI handle the rest.
                    </p>
                </div>
            </div>

            {/* --- RIGHT SIDE: LOGIN CARD --- */}
            <div className="w-full lg:w-[440px]">
                <Card className="border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                    <CardHeader className="text-center pb-6 border-b border-white/10">
                        {/* Dynamic Title based on Active Tab */}
                        <CardTitle className="text-2xl font-bold text-white transition-all duration-300">
                            {headerText.title}
                        </CardTitle>
                        <CardDescription className="text-indigo-200">
                            {headerText.subtitle}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Tabs defaultValue="signin" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-black/20 mb-6 border border-white/10 p-1">
                                <TabsTrigger value="signin" className="cursor-pointer text-indigo-200 data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all">Sign In</TabsTrigger>
                                <TabsTrigger value="signup" className="cursor-pointer text-indigo-200 data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all">Sign Up</TabsTrigger>
                                <TabsTrigger value="magiclink" className="cursor-pointer text-indigo-200 data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all">Magic Link</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="signin" className="mt-0"><AuthForm mode="signin" /></TabsContent>
                            <TabsContent value="signup" className="mt-0"><AuthForm mode="signup" /></TabsContent>
                            <TabsContent value="magiclink" className="mt-0"><MagicLinkAuth /></TabsContent>
                        </Tabs>
                        
                        <div className="mt-8 relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-indigo-300 font-medium tracking-wide">Or continue with</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <Button variant="outline" type="button" onClick={() => handleOAuthLogin('google')} className="cursor-pointer bg-white/5 border-white/10 hover:bg-white/20 text-white hover:text-white h-11 transition-all hover:scale-[1.02]">
                                <ChromeIcon className="mr-2 h-4 w-4" /> Google
                            </Button>
                            <Button variant="outline" type="button" onClick={() => handleOAuthLogin('github')} className="cursor-pointer bg-white/5 border-white/10 hover:bg-white/20 text-white hover:text-white h-11 transition-all hover:scale-[1.02]">
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

// --- SUB COMPONENTS (Logic Preserved) ---

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
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <Label className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-purple-400 focus:bg-black/30 h-11 transition-colors" 
                    placeholder="name@example.com"
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Password</Label>
                <Input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-purple-400 focus:bg-black/30 h-11 transition-colors" 
                    placeholder="••••••••"
                    required 
                />
            </div>
            {message && <p className="text-sm font-medium text-white text-center bg-purple-500/20 p-2 rounded border border-purple-500/30">{message}</p>}
            <Button type="submit" className="w-full cursor-pointer bg-white text-purple-900 hover:bg-indigo-50 font-bold h-11 shadow-lg transition-all hover:scale-[1.02]" disabled={loading}>
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
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <Label className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-purple-400 focus:bg-black/30 h-11 transition-colors" 
                    placeholder="name@example.com"
                    required 
                />
            </div>
            {message && <p className="text-sm font-medium text-white text-center bg-purple-500/20 p-2 rounded border border-purple-500/30">{message}</p>}
            <Button type="submit" className="w-full cursor-pointer bg-white text-purple-900 hover:bg-indigo-50 font-bold h-11 shadow-lg transition-all hover:scale-[1.02]" disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin" /> : "Send Magic Link"}
            </Button>
        </form>
    )
}