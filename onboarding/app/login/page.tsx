'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, tokenStore } from '@/lib/auth';
import { Logo } from '@/components/shared/Logo';
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const tokens = await authApi.login(email, password);
      tokenStore.save(tokens);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">

      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-8 bg-white border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} />
          <span className="font-bold text-[15px] text-slate-900 tracking-tight">pmGPT</span>
        </Link>
        <p className="text-[13px] text-slate-500">
          No account?{' '}
          <Link href="/onboarding/signup" className="text-blue-600 font-semibold hover:underline">
            Get started free
          </Link>
        </p>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-black text-slate-900 mb-1.5 tracking-tight">Welcome back</h1>
            <p className="text-[14px] text-slate-500">Sign in to your pmGPT workspace</p>
          </div>

          {authApi.isDemoMode() && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-blue-700 font-semibold">Demo mode</p>
                <p className="text-[12px] text-blue-600 mt-0.5">Sign in with any email and password — no backend required.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email" required autoFocus
                  placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'} required
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : <>Sign in <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-[12px] text-slate-400 mt-6">
            New to pmGPT?{' '}
            <Link href="/onboarding/signup" className="text-blue-600 font-semibold hover:underline">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
