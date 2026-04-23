'use client';
import { cn } from '@/lib/utils';
import { Users, TrendingUp, CheckCircle, Zap } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { MetricTable } from '../components/MetricTable';

// TODO: replace with api.analytics.workspace(range)
const USER_ROWS: Record<string, string | number>[] = [
  { user: 'Aashish G', role: 'Admin',   sessions: 28, agents: 9, tier: 'Power'      },
  { user: 'PM Lead',   role: 'PM Lead', sessions: 19, agents: 7, tier: 'Power'      },
  { user: 'PM 1',      role: 'PM',      sessions: 12, agents: 5, tier: 'Regular'    },
  { user: 'PM 2',      role: 'PM',      sessions:  8, agents: 4, tier: 'Regular'    },
  { user: 'Eng Lead',  role: 'PM',      sessions:  5, agents: 3, tier: 'Occasional' },
  { user: 'Designer',  role: 'Viewer',  sessions:  3, agents: 2, tier: 'Occasional' },
  { user: 'Eng 1',     role: 'Viewer',  sessions:  2, agents: 1, tier: 'Light'      },
  { user: 'Eng 2',     role: 'Viewer',  sessions:  1, agents: 1, tier: 'Light'      },
];

const ONBOARDING_STEPS = [
  { step: 'Account created',           done: 100, users: 9 },
  { step: 'First agent output',        done: 100, users: 9 },
  { step: 'First connector activated', done:  78, users: 7 },
  { step: 'First artifact shipped',    done:  78, users: 7 },
  { step: 'First workflow configured', done:  44, users: 4 },
  { step: 'Workspace memory filled',   done:  33, users: 3 },
];

const SETUP_ITEMS = [
  { label: 'Connectors live',                   value: '5 / 6', pct: 83, good: true  },
  { label: 'Workflows configured + active',     value: '5 / 8', pct: 62, good: true  },
  { label: 'Home screen widgets set up',        value: '3 / 8', pct: 37, good: false },
  { label: 'Workspace memory completeness',     value: '68%',   pct: 68, good: true  },
  { label: 'Artifact memory coverage',          value: '41%',   pct: 41, good: false },
  { label: 'Agent prompt customizations made',  value: '7',     pct: 54, good: true  },
];

const tierStyle = (t: string) => ({
  Power:      'bg-brand-accent/10 text-brand-accent',
  Regular:    'bg-green-100 text-green-700',
  Occasional: 'bg-amber-100 text-amber-700',
  Light:      'bg-brand-bg-2 text-brand-ink-2',
}[t] ?? 'bg-brand-bg-2 text-brand-ink-2');

export default function WorkspaceIntelligence({ range }: { range: string }) {
  void range;
  return (
    <div className="space-y-10">
      {/* User Engagement */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">User Engagement</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Adoption breadth and session activity across the team</p>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="DAU (avg)"       value="6"   delta="of 9 total users"  neutral  icon={Users}      iconColor="text-brand-accent" />
          <StatCard label="WAU"             value="9"   delta="full team active"   positive icon={Users}      iconColor="text-green-500"    />
          <StatCard label="Sessions / User" value="9.8" delta="+1.2 WoW"          positive icon={TrendingUp} iconColor="text-purple-500"   />
          <StatCard label="Power Users"     value="2"   delta="22% of team"        neutral  icon={Zap}        iconColor="text-amber-500"    />
        </div>
        <MetricTable
          columns={[
            { key: 'user',     label: 'User' },
            { key: 'role',     label: 'Role',          align: 'right' },
            { key: 'sessions', label: 'Sessions (Wk)', align: 'right' },
            { key: 'agents',   label: 'Agents Used',   align: 'right' },
            { key: 'tier',     label: 'Tier',          align: 'right',
              render: (v) => (
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', tierStyle(String(v)))}>{v}</span>
              ) },
          ]}
          rows={USER_ROWS}
        />
      </section>

      {/* Onboarding funnel */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">Onboarding & Time-to-Value</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">How far the team has progressed through initial setup milestones</p>
        </div>
        <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-4">
          {ONBOARDING_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle className={cn('w-4 h-4 flex-shrink-0', s.done === 100 ? 'text-green-500' : 'text-brand-line')} />
              <span className="text-[12px] text-brand-ink w-52 flex-shrink-0">{s.step}</span>
              <div className="flex-1 h-2 bg-brand-bg-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    s.done === 100 ? 'bg-green-500' : s.done >= 60 ? 'bg-brand-accent' : 'bg-amber-400',
                  )}
                  style={{ width: `${s.done}%` }}
                />
              </div>
              <span className="text-[11px] text-brand-ink-2 w-20 text-right flex-shrink-0">{s.users} / 9 users</span>
              <span className="text-[11px] font-semibold text-brand-ink w-10 text-right flex-shrink-0">{s.done}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Setup Depth */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">Setup Depth</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Leading indicator of long-term retention and value delivery</p>
        </div>
        <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-4 mb-4">
          {SETUP_ITEMS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[12px] text-brand-ink flex-shrink-0 w-60">{s.label}</span>
              <div className="flex-1 h-2 bg-brand-bg-2 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', s.good ? 'bg-green-500' : 'bg-amber-400')}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <span className="text-[12px] font-semibold text-brand-ink w-14 text-right flex-shrink-0">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-brand-surface border border-brand-line rounded-xl p-4 text-center">
            <div className="text-[28px] font-bold text-amber-500">62%</div>
            <div className="text-[11px] text-brand-ink-2 mt-1">Overall Setup Score</div>
            <div className="text-[10px] text-amber-500 mt-1">Home widgets + artifact memory need attention</div>
          </div>
          <div className="bg-brand-surface border border-brand-line rounded-xl p-4 text-center">
            <div className="text-[28px] font-bold text-green-600">Day 3</div>
            <div className="text-[11px] text-brand-ink-2 mt-1">Avg Time to First Output</div>
            <div className="text-[10px] text-green-600 mt-1">↓ improved from Day 6 last cohort</div>
          </div>
          <div className="bg-brand-surface border border-brand-line rounded-xl p-4 text-center">
            <div className="text-[28px] font-bold text-brand-ink">Day 7</div>
            <div className="text-[11px] text-brand-ink-2 mt-1">Avg Time to First Artifact</div>
            <div className="text-[10px] text-brand-ink-2 mt-1">Benchmark target: &lt; Day 5</div>
          </div>
        </div>
      </section>
    </div>
  );
}
