'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChromeIcon, LoaderCircle, ArrowRight } from 'lucide-react' 
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
      case 'signup': return { title: "Create your account", subtitle: "Join LinkVault to start organizing" }
      case 'magiclink': return { title: "Passwordless Login", subtitle: "We'll email you a magic link" }
      default: return { title: "Welcome back", subtitle: "Sign in to access your vault" }
    }
  }

  const headerText = getHeaderText()

  return (
    // CHANGE: h-screen forces fixed height, overflow-hidden prevents scrolling
    <div className="h-screen w-full flex items-center justify-center p-4 lg:p-8 relative bg-[#F5F5F0] text-stone-900 selection:bg-stone-200 overflow-hidden">
        
        {/* --- BACKGROUND TEXTURE --- */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Soft Organic Gradients */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange-200/40 blur-[100px] rounded-full pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-stone-300/40 blur-[120px] rounded-full pointer-events-none mix-blend-multiply" />

        <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-32 h-full lg:h-auto">
            
            {/* --- LEFT SIDE: BRANDING --- */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                
                <div className="space-y-4">
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-stone-900">
                        LinkVault <span className="text-stone-400">AI</span>
                    </h1>
                    
                    <div className="h-1 w-20 bg-stone-900 rounded-full mx-auto lg:mx-0" />
                </div>
                
                {/* CHANGE: 'hidden lg:block' hides this text on mobile to save space */}
                <div className="hidden lg:block space-y-6 max-w-lg">
                    <p className="text-4xl font-medium text-stone-800 leading-[1.1]">
                        The smartest place for your <span className="italic text-stone-500 font-serif">digital chaos.</span>
                    </p>
                    <p className="text-lg text-stone-600 font-light leading-relaxed">
                        Don't let ideas slip away. Capture links, notes, and images instantly, and let our AI organize them into a second brain that actually works.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs lg:text-sm font-semibold text-stone-500 uppercase tracking-widest">
                    <span>Secure</span> • <span>Private</span> • <span>Intelligent</span>
                </div>
            </div>

            {/* --- RIGHT SIDE: LOGIN CARD --- */}
            <div className="w-full lg:w-[440px]">
                <Card className="border border-stone-200 bg-white/80 shadow-xl shadow-stone-200/50 backdrop-blur-sm">
                    <CardHeader className="text-center pb-4 lg:pb-6">
                        <CardTitle className="text-xl lg:text-2xl font-bold text-stone-900 transition-all duration-300">
                            {headerText.title}
                        </CardTitle>
                        <CardDescription className="text-stone-500 font-medium text-sm lg:text-base">
                            {headerText.subtitle}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 lg:pt-2">
                        <Tabs defaultValue="signin" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-stone-100 mb-6 lg:mb-8 p-1 rounded-lg">
                                <TabsTrigger value="signin" className="cursor-pointer rounded-md text-stone-500 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm transition-all font-medium text-xs lg:text-sm">Sign In</TabsTrigger>
                                <TabsTrigger value="signup" className="cursor-pointer rounded-md text-stone-500 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm transition-all font-medium text-xs lg:text-sm">Sign Up</TabsTrigger>
                                <TabsTrigger value="magiclink" className="cursor-pointer rounded-md text-stone-500 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm transition-all font-medium text-xs lg:text-sm">Magic Link</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="signin" className="mt-0"><AuthForm mode="signin" /></TabsContent>
                            <TabsContent value="signup" className="mt-0"><AuthForm mode="signup" /></TabsContent>
                            <TabsContent value="magiclink" className="mt-0"><MagicLinkAuth /></TabsContent>
                        </Tabs>
                        
                        <div className="mt-6 lg:mt-8 relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-stone-200" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-400 font-medium tracking-wide">Or continue with</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 lg:mt-6">
                            <Button variant="outline" type="button" onClick={() => handleOAuthLogin('google')} className="cursor-pointer bg-white border-stone-200 hover:bg-stone-50 text-stone-700 h-10 lg:h-11 transition-all hover:border-stone-300">
                                <ChromeIcon className="mr-2 h-4 w-4" /> Google
                            </Button>
                            <Button variant="outline" type="button" onClick={() => handleOAuthLogin('github')} className="cursor-pointer bg-white border-stone-200 hover:bg-stone-50 text-stone-700 h-10 lg:h-11 transition-all hover:border-stone-300">
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
        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <Label className="text-stone-600 text-xs font-bold uppercase tracking-wider">Email Address</Label>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-white border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-stone-500 focus:ring-stone-500/20 h-10 lg:h-11 transition-all" 
                    placeholder="name@example.com"
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label className="text-stone-600 text-xs font-bold uppercase tracking-wider">Password</Label>
                <Input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="bg-white border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-stone-500 focus:ring-stone-500/20 h-10 lg:h-11 transition-all" 
                    placeholder="••••••••"
                    required 
                />
            </div>
            {message && <p className="text-sm font-medium text-red-600 text-center bg-red-50 p-2 rounded">{message}</p>}
            <Button type="submit" className="w-full cursor-pointer bg-stone-900 hover:bg-stone-800 text-white font-bold h-10 lg:h-11 shadow-lg shadow-stone-900/10 transition-all hover:scale-[1.01]" disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin mr-2" /> : (mode === 'signin' ? "Sign In" : "Create Account")}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
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
        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <Label className="text-stone-600 text-xs font-bold uppercase tracking-wider">Email Address</Label>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-white border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-stone-500 focus:ring-stone-500/20 h-10 lg:h-11 transition-all" 
                    placeholder="name@example.com"
                    required 
                />
            </div>
            {message && <p className="text-sm font-medium text-stone-600 text-center bg-stone-100 p-2 rounded">{message}</p>}
            <Button type="submit" className="w-full cursor-pointer bg-stone-900 hover:bg-stone-800 text-white font-bold h-10 lg:h-11 shadow-lg shadow-stone-900/10 transition-all hover:scale-[1.01]" disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin mr-2" /> : "Send Magic Link"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
        </form>
    )
}