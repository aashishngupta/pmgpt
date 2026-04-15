'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Smartphone, Globe, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const SESSIONS = [
  { device: 'MacBook Pro', location: 'San Francisco, US', lastActive: 'Now', current: true },
  { device: 'iPhone 15 Pro', location: 'San Francisco, US', lastActive: '2 hours ago', current: false },
  { device: 'Chrome on Windows', location: 'New York, US', lastActive: '3 days ago', current: false },
];

export default function SecurityPage() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Security</h1>
        <p className="text-slate-500 text-sm mt-1">Manage authentication and session security</p>
      </div>

      {/* Password */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Key className="w-4 h-4 text-violet-600" />
          <h2 className="font-semibold text-slate-800">Password</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-700">Last changed 30 days ago</div>
            <div className="text-xs text-slate-400 mt-0.5">Use a strong, unique password</div>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs">Change password</Button>
        </div>
      </section>

      {/* 2FA */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Smartphone className="w-4 h-4 text-violet-600" />
          <h2 className="font-semibold text-slate-800">Two-factor authentication</h2>
          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] ml-auto">Not enabled</Badge>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Add an extra layer of security by requiring a verification code when you sign in.
        </p>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-1.5 h-9 text-sm">
          <Shield className="w-4 h-4" /> Enable 2FA
        </Button>
      </section>

      {/* Active sessions */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-4 h-4 text-violet-600" />
          <h2 className="font-semibold text-slate-800">Active sessions</h2>
        </div>
        <div className="space-y-4">
          {SESSIONS.map((session, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                session.current ? 'bg-emerald-100' : 'bg-slate-100'
              )}>
                <Globe className={cn('w-4 h-4', session.current ? 'text-emerald-600' : 'text-slate-400')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{session.device}</span>
                  {session.current && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">This device</Badge>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span>{session.location}</span>
                  <span>·</span>
                  <Clock className="w-3 h-3" />
                  <span>{session.lastActive}</span>
                </div>
              </div>
              {!session.current && (
                <Button variant="outline" size="sm" className="h-7 text-xs text-red-500 border-red-100 hover:bg-red-50">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" className="text-xs text-red-500 border-red-100 hover:bg-red-50">
            Sign out all other sessions
          </Button>
        </div>
      </section>
    </div>
  );
}
