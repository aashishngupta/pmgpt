'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { api } from '@/lib/api';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const INDUSTRIES = [
  'B2B SaaS', 'B2C / Consumer', 'Fintech', 'Healthtech', 'E-commerce',
  'Dev Tools', 'Enterprise', 'Marketplace', 'AI / ML', 'Other',
];

const TEAM_SIZES = [
  { value: 'solo',  label: 'Just me',  desc: 'Solo PM / Founder' },
  { value: '2-5',   label: '2–5',      desc: 'Small startup'     },
  { value: '6-20',  label: '6–20',     desc: 'Growing team'      },
  { value: '20+',   label: '20+',      desc: 'Scale-up / Corp'   },
];

export default function WorkspacePage() {
  const router = useRouter();
  const [industry,  setIndustry]  = useState('');
  const [teamSize,  setTeamSize]  = useState('');
  const [product,   setProduct]   = useState('');
  const [sprint,    setSprint]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  async function handleContinue() {
    setLoading(true);
    try {
      const context: Record<string, string> = {};
      if (product)  context.product = product;
      if (industry) context.company = industry + (teamSize ? ` — Team size: ${teamSize}` : '');
      if (sprint)   context.sprint  = sprint;

      if (Object.keys(context).length > 0) {
        await api.memory.update(context);
      }
    } catch {
      // non-blocking — workspace context is optional
    } finally {
      setLoading(false);
    }
    router.push('/onboarding/tools');
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">

      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-8 bg-white border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} />
          <span className="font-bold text-[15px] text-slate-900 tracking-tight">pmGPT</span>
        </Link>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-slate-100 px-8 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {['Create account', 'Workspace setup', 'Connect tools'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                i < 1 ? 'bg-blue-600 text-white' : i === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {i < 1 ? '✓' : i + 1}
              </div>
              <span className={`text-[12px] font-medium truncate ${i === 1 ? 'text-slate-800' : i < 1 ? 'text-slate-400' : 'text-slate-400'}`}>
                {label}
              </span>
              {i < 2 && <div className={`h-px flex-1 ml-1 ${i < 1 ? 'bg-blue-200' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-[26px] font-black text-slate-900 mb-1.5 tracking-tight">
              Tell us about your product
            </h1>
            <p className="text-[14px] text-slate-500">
              This becomes your AI's context — it thinks better when it knows your world.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Industry */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">
                Industry <span className="normal-case text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(ind => (
                  <button
                    type="button" key={ind}
                    onClick={() => setIndustry(industry === ind ? '' : ind)}
                    className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${
                      industry === ind
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            {/* Team size */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">
                Product team size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TEAM_SIZES.map(t => (
                  <button
                    type="button" key={t.value}
                    onClick={() => setTeamSize(teamSize === t.value ? '' : t.value)}
                    className={cn('rounded-xl p-3 border-2 text-center transition-all', teamSize === t.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-200'
                    )}
                  >
                    <div className="font-bold text-[13px] text-slate-800">{t.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Product description */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Describe your product <span className="normal-case text-slate-400 font-normal">(optional — helps AI a lot)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. B2B SaaS for project management. 50k MAU, Series A, 3 PMs. Main metric is activation rate."
                value={product}
                onChange={e => setProduct(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
              />
            </div>

            {/* Current sprint */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Current sprint / focus <span className="normal-case text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sprint 24 — Activation focus, ends Apr 30"
                value={sprint}
                onChange={e => setSprint(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <button
              onClick={handleContinue}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-bold transition-all disabled:opacity-40 shadow-lg shadow-blue-600/20"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <>Continue <ArrowRight className="w-4 h-4" /></>
              }
            </button>

            <button
              type="button"
              onClick={() => router.push('/onboarding/tools')}
              className="w-full py-2 text-[13px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
