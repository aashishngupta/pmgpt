'use client';

import { useState, useEffect } from 'react';
import { loadState, saveState } from '@/lib/onboarding-store';
import { OnboardingState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, CheckCircle2, XCircle, Send, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const ROLES = ['CPO / VP Product', 'Head of Product', 'Senior PM', 'PM', 'Aspiring PM', 'Observer'];

export default function InvitePage() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('PM');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => { setState(loadState()); }, []);
  if (!state) return null;

  const invites = state.team.invites;

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleInvite = () => {
    if (!isValidEmail(email)) { setError('Enter a valid email address'); return; }
    if (invites.some(i => i.email === email)) { setError('This person is already invited'); return; }
    setError('');
    const updated: OnboardingState = {
      ...state,
      team: {
        invites: [...invites, { email, role, status: 'pending' }],
      },
    };
    saveState(updated);
    setState(updated);
    setEmail('');
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const removeInvite = (emailToRemove: string) => {
    const updated: OnboardingState = {
      ...state,
      team: { invites: state.team.invites.filter(i => i.email !== emailToRemove) },
    };
    saveState(updated);
    setState(updated);
  };

  const statusIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (status === 'declined') return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      declined: 'bg-red-50 text-red-600 border-red-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return map[status] || map.pending;
  };

  return (
    <div className="max-w-xl mx-auto px-8 py-8">
      <div className="mb-8">
        <Link href="/settings/team" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to roles
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Invite teammates</h1>
        <p className="text-slate-500 text-sm mt-1">Add your product team — they'll get an email with a magic link</p>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email address</label>
            <Input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              className="h-10"
              placeholder="colleague@company.com"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Role</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all',
                    role === r
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 text-slate-500 hover:border-violet-300'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <Button
            className={cn('w-full gap-2', sent ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-violet-600 hover:bg-violet-700')}
            onClick={handleInvite}
          >
            {sent
              ? <><CheckCircle2 className="w-4 h-4" /> Invite sent!</>
              : <><Send className="w-4 h-4" /> Send invite</>
            }
          </Button>
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-slate-800">Invites sent</h2>
            <Badge variant="secondary" className="text-xs">{invites.length}</Badge>
          </div>
          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.email} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {invite.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">{invite.email}</div>
                  <div className="text-xs text-slate-400">{invite.role}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusIcon(invite.status)}
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', statusBadge(invite.status))}>
                    {invite.status}
                  </span>
                </div>
                <button
                  onClick={() => removeInvite(invite.email)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 ml-1"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {invites.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No invites sent yet</p>
        </div>
      )}
    </div>
  );
}
