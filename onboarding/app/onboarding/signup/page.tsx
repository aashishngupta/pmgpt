'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveState, loadState } from '@/lib/onboarding-store';
import { Globe, Mail, ArrowRight, CalendarDays } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'default' | 'email'>('default');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = () => {
    // TODO: implement Google OAuth
    const state = loadState();
    saveState({ ...state, step: 2, auth: { ...state.auth, authMethod: 'google', verified: true, name: 'Demo User', email: 'demo@company.com' } });
    router.push('/onboarding/workspace');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !name) { setError('All fields are required.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid work email.'); return; }
    setLoading(true);
    const state = loadState();
    saveState({ ...state, step: 1, auth: { ...state.auth, authMethod: 'email', email, name, verified: false } });
    setTimeout(() => { setLoading(false); router.push('/onboarding/verify'); }, 600);
  };

  return (
    <OnboardingLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
          🔒 Invite-only early access
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to pmGPT</h1>
        <p className="text-slate-500">The AI-native Product OS for modern product teams</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
        {mode === 'default' ? (
          <>
            <Button
              className="w-full h-12 text-base font-medium gap-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm"
              variant="outline"
              onClick={handleGoogle}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400">or</span></div>
            </div>

            <Button variant="outline" className="w-full h-12 text-base font-medium gap-2.5 border-slate-200" onClick={() => setMode('email')}>
              <Mail className="w-4 h-4" />
              Sign up with work email
            </Button>

            <div className="pt-2 text-center">
              <a
                href="https://calendly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                For teams of 5+, talk to sales →
              </a>
            </div>
          </>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Aashish Gupta" value={name} onChange={e => setName(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} className="h-11" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full h-11 bg-violet-600 hover:bg-violet-700 gap-2" disabled={loading}>
              {loading ? 'Creating account…' : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
            </Button>
            <button type="button" onClick={() => setMode('default')} className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors">
              ← Back
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-5">
        Already have an account?{' '}
        <a href="#" className="text-violet-600 hover:underline">Sign in</a>
      </p>
    </OnboardingLayout>
  );
}
