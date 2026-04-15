'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Button } from '@/components/ui/button';
import { loadState, saveState } from '@/lib/onboarding-store';
import { Mail } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const state = loadState();

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the 6-digit code.'); return; }
    setLoading(true);
    // TODO: verify OTP against backend
    // Mock: any 6-digit code works
    setTimeout(() => {
      saveState({ ...state, step: 2, auth: { ...state.auth, verified: true } });
      router.push('/onboarding/workspace');
    }, 700);
  };

  const handleResend = () => {
    setResent(true);
    // TODO: resend OTP via backend
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <OnboardingLayout>
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-violet-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
        <p className="text-slate-500 text-sm">
          We sent a 6-digit code to <span className="font-medium text-slate-700">{state.auth.email || 'your email'}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button
          className="w-full h-11 bg-violet-600 hover:bg-violet-700"
          onClick={handleVerify}
          disabled={loading || otp.join('').length < 6}
        >
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>

        <div className="text-center">
          <button
            onClick={handleResend}
            className="text-sm text-slate-500 hover:text-violet-600 transition-colors"
            disabled={resent}
          >
            {resent ? '✓ Code resent!' : "Didn't get it? Resend code"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Code expires in 10 minutes. Check your spam folder if needed.
      </p>
    </OnboardingLayout>
  );
}
