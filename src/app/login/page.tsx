'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChromeIcon, GithubIcon, LoaderCircle, Sparkles } from 'lucide-react' 

// --- 1. SUB-COMPONENTS (Clean & Modular) ---

function SocialButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <Button 
      variant="outline" 
      onClick={onClick} 
      className="h-11 bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300"
    >
      <Icon className="mr-2 h-4 w-4" /> {label}
    </Button>
  )
}

function AuthForm({ mode }: { mode: 'signin' | 'signup' | 'magic' }) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email, options: { emailRedirectTo: `${location.origin}/auth/callback` }
        })
        if (error) throw error
        setMessage({ type: 'success', text: "Magic link sent! Check your inbox." })
      } 
      else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` }
        })
        if (error) throw error
        setMessage({ type: 'success', text: "Account created! Check email to verify." })
      } 
      else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/vault')
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-4">
        <Input 
          type="email" 
          placeholder="name@work-email.com" 
          required 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="tech-input h-11" 
        />
        {mode !== 'magic' && (
          <Input 
            type="password" 
            placeholder="Password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="tech-input h-11" 
          />
        )}
      </div>

      {message && (
        <div className={`text-xs p-3 rounded border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'}`}>
          {message.text}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium tracking-wide shadow-lg shadow-cyan-900/20 border-0"
      >
        {loading ? <LoaderCircle className="animate-spin" /> : (mode === 'magic' ? 'Send Magic Link' : mode === 'signin' ? 'Enter Vault' : 'Create Account')}
      </Button>
    </form>
  )
}

// --- 2. MAIN PAGE LAYOUT ---

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin')
  const supabase = createClient()

  const handleOAuth = (provider: 'google' | 'github') => {
    supabase.auth.signInWithOAuth({
      provider, options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-color-dodge"
          style={{ backgroundImage: "url('/background.jpg')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-zinc-950/0 to-zinc-950" />
      </div>

      <div className="z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-16 p-6 items-center">
        
        {/* Left: Brand Identity */}
        <div className="space-y-8 text-center lg:text-left hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-200">
            <Sparkles className="w-3 h-3" />
            <span>v2.0 Now Live</span>
          </div>
          <h1 className="text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Extend <br />
            <span className="text-glow">Your Mind.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-md leading-relaxed">
            The AI memory layer for everything you read, watch, and save.
          </p>
        </div>

        {/* Right: The Interface */}
        <div className="w-full max-w-[420px] mx-auto lg:mx-0 lg:ml-auto">
          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
            
            {/* Subtle Top Highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-semibold text-white tracking-tight">Welcome back</h2>
              <p className="text-sm text-zinc-500 mt-1">Authenticate to access your vault</p>
            </div>

            {/* Segmented Controller */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900/50 rounded-lg border border-white/5">
              {[
                { id: 'signin', label: 'Sign In' },
                { id: 'signup', label: 'Sign Up' },
                { id: 'magic', label: 'Magic' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id as any)}
                  className={`text-xs font-medium py-2 rounded-md transition-all duration-300 ${
                    mode === tab.id ? 'glass-tab-active' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AuthForm mode={mode} />

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-zinc-900/50 px-2 text-zinc-600">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SocialButton icon={ChromeIcon} label="Google" onClick={() => handleOAuth('google')} />
              <SocialButton icon={GithubIcon} label="GitHub" onClick={() => handleOAuth('github')} />
            </div>

          </div>
          
          {/* Mobile-only Branding Footer */}
          <p className="lg:hidden text-center text-zinc-600 text-xs mt-8">
            LinkVault AI — Extend Your Mind
          </p>
        </div>

      </div>
    </div>
  )
}