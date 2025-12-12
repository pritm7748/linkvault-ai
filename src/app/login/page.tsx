'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChromeIcon, GithubIcon, LoaderCircle } from 'lucide-react' 

// --- UPDATED FORM COMPONENTS FOR DARK GLASS THEME ---

function PasswordAuthForm({ action }: { action: 'signin' | 'signup' }) {
  const router = useRouter()
  const constHz = createClient()
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
      else router.push('/vault')
    }
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${action}-email`} className="text-gray-300">Email</Label>
        <Input 
          id={`${action}-email`} 
          type="email" 
          placeholder="m@example.com" 
          required 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="glass-input" // Custom class from globals.css
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${action}-password`} className="text-gray-300">Password</Label>
        <Input 
          id={`${action}-password`} 
          type="password" 
          placeholder="••••••••" 
          required 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="glass-input" 
        />
      </div>
      {message && <p className="text-center text-sm text-cyan-300 p-2 bg-cyan-900/30 rounded-md border border-cyan-500/30">{message}</p>}
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/20" 
        disabled={isSubmitting}
      >
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
                <Label htmlFor="magic-email" className="text-gray-300">Email</Label>
                <Input 
                  id="magic-email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="glass-input" 
                />
            </div>
            {message && <p className="text-center text-sm text-cyan-300 p-2 bg-cyan-900/30 rounded-md border border-cyan-500/30">{message}</p>}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/20" 
              disabled={isSubmitting}
            >
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Send Magic Link'}
            </Button>
        </form>
    )
}

// --- MAIN PAGE COMPONENT ---

export default function LoginPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'magic'>('signin')

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpg')" }} 
      >
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <div className="z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-16 p-6 items-center">
        
        {/* Left Side: The Copy */}
        <div className="text-white space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left-10 duration-700">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-tight">
            LinkVault <span className="text-cyan-400">AI</span>
          </h1>
          <div className="space-y-4">
            <h2 className="text-4xl font-semibold text-gray-100">
              Extend Your Mind.
            </h2>
            <p className="text-xl text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              The AI memory layer for everything you read, watch, and save.
            </p>
          </div>
        </div>

        {/* Right Side: The Glass Card */}
        <div className="glass-card p-8 rounded-2xl w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
          
          {/* Custom Tab Switcher */}
          <div className="flex bg-black/30 p-1 rounded-lg mb-8 border border-white/5">
            {['signin', 'signup', 'magic'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'magic' ? 'Magic Link' : tab === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Render the active form */}
          <div className="space-y-4 min-h-[250px]">
             {activeTab === 'signin' && <PasswordAuthForm action="signin" />}
             {activeTab === 'signup' && <PasswordAuthForm action="signup" />}
             {activeTab === 'magic' && <MagicLinkForm />}
          </div>

          {/* Divider */}
          <div className="mt-8 mb-6 relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-transparent px-2 text-gray-500 font-semibold">Or continue with</span></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
                variant="outline" 
                onClick={() => handleOAuthLogin('google')} 
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-cyan-400 hover:border-cyan-400/30 transition-all"
            >
              <ChromeIcon className="mr-2 h-4 w-4" /> Google
            </Button>
            <Button 
                variant="outline" 
                onClick={() => handleOAuthLogin('github')} 
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-cyan-400 hover:border-cyan-400/30 transition-all"
            >
              <GithubIcon className="mr-2 h-4 w-4" /> GitHub
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}