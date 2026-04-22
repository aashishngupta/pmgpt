'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, ArrowRight, ArrowUpRight, Bell, Calendar,
  CheckCircle2, Clock, MessageSquare, TrendingDown, TrendingUp,
  Zap, GitBranch, X, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { USAGE_TIMELINE, AGENTS } from '@/lib/platform-data';
import { api, Alert } from '@/lib/api';

const AGENT_COLOR_MAP = Object.fromEntries(AGENTS.map(a => [a.id, { color: a.color, bg: a.bg }]));

// ── Mock data ─────────────────────────────────────────────────────────────────

const METRICS = [
  { label: 'Daily Active Users', value: '24,812', delta: '+6.2%',  up: true,  spark: [180,195,210,202,218,225,240,248] },
  { label: 'Net Promoter Score', value: '61',     delta: '+3 pts', up: true,  spark: [52,55,54,57,58,60,61,61]        },
  { label: 'Activation Rate',    value: '38.4%',  delta: '-1.1%',  up: false, spark: [41,40,39.5,39,38.8,39.2,38.5,38.4] },
  { label: 'Monthly Revenue',    value: '$142k',  delta: '+4.8%',  up: true,  spark: [120,124,128,130,132,136,139,142] },
];

const SPRINT = {
  name: 'Sprint 24 — Activation',
  endsIn: '4 days',
  total: 42,
  done: 27,
  inProgress: 9,
  blocked: 3,
};

const OKRS = [
  { objective: 'Improve activation rate to 45%', pct: 71, on_track: true  },
  { objective: 'Reach $150k MRR by Q2',          pct: 95, on_track: true  },
  { objective: 'Reduce churn below 3%',          pct: 48, on_track: false },
  { objective: 'Launch mobile v2 by June 30',    pct: 60, on_track: true  },
];

const BLOCKERS = [
  { label: 'Auth redesign blocked on design review',   owner: 'Sarah',  since: '3d' },
  { label: 'Analytics pipeline delay — KPI dashboard', owner: 'Ravi',   since: '1d' },
  { label: 'API rate limit on import flow',            owner: 'Marcus', since: '5h' },
];

const UPCOMING = [
  { label: 'Sprint review and demo',      time: 'Today, 3:00 PM',    type: 'meeting'  },
  { label: 'Q2 roadmap stakeholder sync', time: 'Tomorrow, 10:00 AM',type: 'meeting'  },
  { label: 'Mobile v2 alpha release',     time: 'Apr 22',            type: 'release'  },
  { label: 'Board deck due',             time: 'Apr 25',             type: 'deadline' },
];

const SIGNALS = [
  { theme: 'Onboarding confusion',  count: 18, sentiment: 'negative' as const, sample: '"Setup took 30+ minutes, next step was unclear."' },
  { theme: 'Analytics praised',     count: 12, sentiment: 'positive' as const, sample: '"The new dashboard is exactly what we needed."'   },
  { theme: 'Mobile UX requests',    count: 9,  sentiment: 'neutral'  as const, sample: '"Would love a better mobile experience."'         },
];

const QUICK_PROMPTS = [
  { label: 'Write sprint summary',    prompt: 'Write a sprint 24 summary for stakeholders', agent: 'ops'       },
  { label: 'Draft release notes',     prompt: 'Draft release notes for mobile v2 alpha',    agent: 'docs'      },
  { label: 'Diagnose activation dip', prompt: 'Activation dropped 1.1% — investigate RCA',  agent: 'analytics' },
  { label: 'Generate standup update', prompt: 'Generate my weekly standup update',           agent: 'ops'       },
];

// ── Primitives ────────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-brand-surface border border-brand-line rounded-lg', className)}>
      {children}
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-[13px] font-semibold text-brand-ink">{title}</h2>
      {sub && <span className="text-[11px] text-brand-ink-3">{sub}</span>}
    </div>
  );
}

function RowDivider() {
  return <div className="border-t border-brand-line-2" />;
}

type StatusDot = 'green' | 'amber' | 'red' | 'blue' | 'neutral';
function Dot({ color }: { color: StatusDot }) {
  return (
    <div className={cn('w-[6px] h-[6px] rounded-full flex-shrink-0', {
      'bg-brand-green':  color === 'green',
      'bg-brand-amber':  color === 'amber',
      'bg-brand-red':    color === 'red',
      'bg-brand-accent': color === 'blue',
      'bg-brand-ink-4':  color === 'neutral',
    })} />
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const d = data.map((v, i) => ({ v, i }));
  const color = up ? '#10B981' : '#EF4444';
  return (
    <ResponsiveContainer width={64} height={28}>
      <AreaChart data={d} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={`g${up}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#g${up})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, delta, up, spark }: typeof METRICS[0]) {
  return (
    <Card className={cn('p-4 border-l-2', up ? 'border-l-brand-green' : 'border-l-brand-red')}>
      <div className="text-[11px] text-brand-ink-3 font-medium mb-2 uppercase tracking-[0.04em]">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[22px] font-bold text-brand-ink font-mono leading-none">{value}</div>
          <div className={cn('flex items-center gap-1 text-[11px] font-medium mt-1.5', up ? 'text-brand-green' : 'text-brand-red')}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {delta}
          </div>
        </div>
        <Spark data={spark} up={up} />
      </div>
    </Card>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────

function AlertFeed() {
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.alerts.list()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  function dismiss(id: string) {
    api.alerts.dismiss(id).catch(() => {});
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  const ALERT_TYPE_DOT: Record<string, StatusDot> = {
    warning: 'amber', error: 'red', info: 'blue', success: 'green',
  };

  if (loading) {
    return (
      <Card className="p-4 border-l-2 border-l-brand-amber">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-3.5 h-3.5 text-brand-amber" />
          <span className="text-[12px] font-semibold text-brand-ink">Alerts</span>
        </div>
        <p className="text-[12px] text-brand-ink-3">Loading…</p>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="p-4 border-l-2 border-l-brand-green">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-3.5 h-3.5 text-brand-green" />
          <span className="text-[12px] font-semibold text-brand-ink">Alerts</span>
        </div>
        <p className="text-[12px] text-brand-green">All clear — no active alerts</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-l-2 border-l-brand-amber">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-3.5 h-3.5 text-brand-amber" />
        <span className="text-[12px] font-semibold text-brand-ink">Alerts</span>
        <span className="ml-auto text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-brand-amber-bg text-brand-amber">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-2.5">
        {alerts.slice(0, 4).map(alert => (
          <div key={alert.id} className="flex items-start gap-2">
            <Dot color={ALERT_TYPE_DOT[alert.alert_type] ?? 'amber'} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-brand-ink leading-snug">{alert.title}</div>
              <p className="text-[11px] text-brand-ink-3 leading-snug mt-0.5 truncate">{alert.body}</p>
              {alert.action_url && (
                <a href={alert.action_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-[11px] text-brand-accent mt-0.5 hover:underline">
                  {alert.action_label ?? 'View'} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <button
              onClick={() => dismiss(alert.id)}
              className="flex-shrink-0 text-brand-ink-4 hover:text-brand-ink-2 transition-colors mt-0.5"
              title="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const sprintPct = Math.round((SPRINT.done / SPRINT.total) * 100);
  const remaining = SPRINT.total - SPRINT.done - SPRINT.inProgress - SPRINT.blocked;

  return (
    <div className="max-w-[1100px] mx-auto px-7 py-6 space-y-5">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-brand-ink-3 font-medium mb-1 uppercase tracking-[0.04em]">{today}</div>
          <h1 className="text-[20px] font-bold text-brand-ink leading-tight">Good morning, Aashish</h1>
          <p className="text-[13px] text-brand-ink-2 mt-1">
            Sprint ending in {SPRINT.endsIn} —{' '}
            <span className="text-brand-red font-medium">3 active blockers</span>
          </p>
        </div>
        <Link href="/dashboard/chat">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-brand-accent hover:bg-brand-accent-dim text-white text-[13px] font-medium transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            Ask AI Copilot
          </button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {METRICS.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Usage chart */}
        <Card className="col-span-2 p-4">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-[13px] font-semibold text-brand-ink">AI Usage — 7 days</h2>
              <p className="text-[11px] text-brand-ink-3 mt-0.5">Queries across all agents</p>
            </div>
            <span className="text-[11px] font-mono font-medium text-brand-ink-2">
              {USAGE_TIMELINE.reduce((s, d) => s + d.queries, 0)} total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={USAGE_TIMELINE} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  padding: '6px 10px',
                }}
                cursor={{ fill: '#EFF6FF' }}
              />
              <Bar dataKey="queries" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Sprint card */}
        <Card className="p-4">
          <div className="mb-3">
            <div className="text-[10px] text-brand-ink-3 uppercase tracking-[0.06em] font-semibold mb-0.5">Current sprint</div>
            <div className="text-[13px] font-semibold text-brand-ink">{SPRINT.name}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-brand-amber" />
              <span className="text-[11px] text-brand-amber font-medium">Ends in {SPRINT.endsIn}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-brand-ink-3">Progress</span>
            <span className="text-[11px] font-mono font-semibold text-brand-ink">{sprintPct}%</span>
          </div>
          <div className="w-full h-1 bg-brand-line-2 rounded-full mb-4 overflow-hidden">
            <div className="h-1 bg-brand-accent rounded-full" style={{ width: `${sprintPct}%` }} />
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Done',        count: SPRINT.done,       dot: 'green'   as StatusDot },
              { label: 'In progress', count: SPRINT.inProgress, dot: 'blue'    as StatusDot },
              { label: 'Blocked',     count: SPRINT.blocked,    dot: 'red'     as StatusDot },
              { label: 'Not started', count: remaining,          dot: 'neutral' as StatusDot },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <Dot color={s.dot} />
                <span className="text-[12px] text-brand-ink-2 flex-1">{s.label}</span>
                <span className="text-[12px] font-mono font-semibold text-brand-ink">{s.count}</span>
              </div>
            ))}
          </div>

          <RowDivider />
          <div className="pt-3">
            <Link href="/dashboard/workflows"
              className="flex items-center gap-1.5 text-[12px] text-brand-accent hover:text-brand-accent-dim font-medium transition-colors">
              <GitBranch className="w-3 h-3" /> View workflows
            </Link>
          </div>
        </Card>
      </div>

      {/* OKRs + Signals + Right column */}
      <div className="grid grid-cols-3 gap-4">

        {/* OKRs */}
        <Card className="p-4">
          <SectionHead title="Q2 Objectives" sub="4 objectives" />
          <div className="space-y-4">
            {OKRS.map(okr => (
              <div key={okr.objective}>
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <span className="text-[12px] text-brand-ink leading-snug flex-1">{okr.objective}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={cn('text-[11px] font-mono font-semibold', okr.on_track ? 'text-brand-green' : 'text-brand-amber')}>
                      {okr.pct}%
                    </span>
                    {okr.on_track
                      ? <CheckCircle2 className="w-3 h-3 text-brand-green" />
                      : <AlertTriangle className="w-3 h-3 text-brand-amber" />}
                  </div>
                </div>
                <div className="w-full h-1 bg-brand-line-2 rounded-full overflow-hidden">
                  <div
                    className={cn('h-1 rounded-full', okr.on_track ? 'bg-brand-green' : 'bg-brand-amber')}
                    style={{ width: `${okr.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer signals */}
        <Card className="p-4">
          <SectionHead title="Customer Signals" sub="Last 7 days" />
          <div>
            {SIGNALS.map((s, i) => (
              <div key={s.theme}>
                <div className="flex items-start gap-2.5 py-2.5">
                  <Dot color={s.sentiment === 'negative' ? 'red' : s.sentiment === 'positive' ? 'green' : 'neutral'} />
                  <div className="flex-1 min-w-0 mt-[-1px]">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-medium text-brand-ink">{s.theme}</span>
                      <span className="text-[10px] font-mono text-brand-ink-3">{s.count}</span>
                    </div>
                    <p className="text-[11px] text-brand-ink-3 leading-snug">{s.sample}</p>
                  </div>
                  <Link href={`/dashboard/chat?q=${encodeURIComponent('Summarize customer feedback about: ' + s.theme)}&agent=research`}>
                    <button className="text-[11px] text-brand-accent hover:text-brand-accent-dim font-medium flex items-center gap-0.5 flex-shrink-0 mt-0.5 transition-colors">
                      Ask AI <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </Link>
                </div>
                {i < SIGNALS.length - 1 && <RowDivider />}
              </div>
            ))}
          </div>
          <div className="pt-3 mt-1 border-t border-brand-line-2">
            <Link href="/dashboard/chat?agent=research"
              className="text-[12px] text-brand-accent hover:text-brand-accent-dim font-medium transition-colors">
              Full VOC analysis
            </Link>
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-4">

          {/* Blockers */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-brand-red" />
                <span className="text-[13px] font-semibold text-brand-ink">Blockers</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-brand-red-bg text-brand-red">
                {BLOCKERS.length}
              </span>
            </div>
            <div>
              {BLOCKERS.map((b, i) => (
                <div key={b.label}>
                  <div className="flex items-start gap-2.5 py-2.5">
                    <div className="w-5 h-5 rounded-full bg-brand-elevated flex items-center justify-center text-[9px] font-bold text-brand-ink-2 flex-shrink-0 mt-0.5">
                      {b.owner[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-brand-ink leading-snug">{b.label}</p>
                      <span className="text-[11px] text-brand-ink-3">{b.owner} · {b.since} ago</span>
                    </div>
                  </div>
                  {i < BLOCKERS.length - 1 && <RowDivider />}
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5 text-brand-ink-3" />
              <span className="text-[13px] font-semibold text-brand-ink">Upcoming</span>
            </div>
            <div>
              {UPCOMING.map((u, i) => (
                <div key={u.label}>
                  <div className="flex items-start gap-2.5 py-2.5">
                    <Dot color={u.type === 'meeting' ? 'blue' : u.type === 'release' ? 'green' : 'amber'} />
                    <div className="mt-[-1px]">
                      <div className="text-[12px] font-medium text-brand-ink leading-snug">{u.label}</div>
                      <div className="text-[11px] text-brand-ink-3 mt-0.5">{u.time}</div>
                    </div>
                  </div>
                  {i < UPCOMING.length - 1 && <RowDivider />}
                </div>
              ))}
            </div>
          </Card>

          {/* Alerts */}
          <AlertFeed />
        </div>
      </div>

      {/* Quick Copilot */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-brand-accent" />
          <h2 className="text-[13px] font-semibold text-brand-ink">Quick Copilot</h2>
          <Link href="/dashboard/chat"
            className="ml-auto text-[12px] text-brand-accent hover:text-brand-accent-dim font-medium transition-colors flex items-center gap-1">
            Open chat <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_PROMPTS.map(qp => (
            <Link
              key={qp.label}
              href={`/dashboard/chat?q=${encodeURIComponent(qp.prompt)}&agent=${qp.agent}`}
              className="group flex flex-col gap-1.5 border border-brand-line rounded-md px-3 py-2.5 hover:border-brand-accent hover:bg-brand-accent-bg transition-all"
            >
              <span className="text-[12px] font-medium text-brand-ink group-hover:text-brand-accent-text leading-snug">
                {qp.label}
              </span>
              <span className={cn(
                'text-[10px] flex items-center gap-0.5 font-mono uppercase tracking-wide transition-colors',
                AGENT_COLOR_MAP[qp.agent]?.color ?? 'text-brand-ink-3',
              )}>
                {qp.agent} <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
            </Link>
          ))}
        </div>
      </Card>

    </div>
  );
}
