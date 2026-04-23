'use client';
import { Package, Clock, DollarSign, Users, Zap, Bot, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCard } from '../components/StatCard';
import { ChartBar } from '../components/ChartBar';

// TODO: replace with api.analytics.summary(range)
const ARTIFACTS_BY_TYPE = [
  { label: 'PRDs',     value: 14 },
  { label: 'Jira',     value: 31 },
  { label: 'Sprint',   value:  8 },
  { label: 'Brief',    value: 11 },
  { label: 'Release',  value:  5 },
  { label: 'Standup',  value:  6 },
];

const CONNECTORS = [
  { name: 'Jira',         status: 'healthy'  },
  { name: 'Notion',       status: 'healthy'  },
  { name: 'Confluence',   status: 'warning'  },
  { name: 'Slack',        status: 'healthy'  },
  { name: 'Google Drive', status: 'healthy'  },
  { name: 'GitHub',       status: 'inactive' },
];

const AUDIT_EVENTS = [
  { at: '2h ago', actor: 'Aashish G', action: 'Approved Jira ticket creation',   agent: 'Sprint Planner'    },
  { at: '4h ago', actor: 'PM Lead',   action: 'Published PRD to Confluence',     agent: 'Docs Writer'       },
  { at: '6h ago', actor: 'System',    action: 'Workflow "Weekly Standup" ran',   agent: 'Strategy Advisor'  },
  { at: '1d ago', actor: 'Aashish G', action: 'Rejected Slack message draft',    agent: 'Comms Agent'       },
  { at: '1d ago', actor: 'PM Lead',   action: 'Updated agent system prompt',     agent: 'Competitive Intel' },
];

const dotColor = (s: string) => ({
  healthy:  'bg-green-500',
  warning:  'bg-amber-400',
  inactive: 'bg-brand-line',
  error:    'bg-red-500',
}[s] ?? 'bg-brand-line');

const labelColor = (s: string) => ({
  healthy:  'text-green-600',
  warning:  'text-amber-500',
  inactive: 'text-brand-ink-2',
}[s] ?? 'text-brand-ink-2');

export default function ExecutiveSummary({ range }: { range: string }) {
  void range;
  return (
    <div className="space-y-6">
      {/* North star + KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="PM Tasks Shipped / Week" value="34"    delta="+12% WoW"          positive icon={Package}    iconColor="text-brand-accent" className="xl:col-span-1" />
        <StatCard label="Hours Saved (Month)"      value="148h"  delta="+22% MoM"          positive icon={Clock}      iconColor="text-green-500"    />
        <StatCard label="LLM Spend (Month)"        value="$38"   delta="$50 budget · 76%"  neutral  icon={DollarSign}  iconColor="text-amber-500"    />
        <StatCard label="Active Users (Week)"      value="9"     delta="+2 vs last week"   positive icon={Users}      iconColor="text-indigo-500"   />
        <StatCard label="Automation Rate"          value="71%"   delta="+5pp MoM"          positive icon={Zap}        iconColor="text-purple-500"   />
      </div>

      {/* Artifacts + top agent + workflow health */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ChartBar
            title="Artifacts Shipped This Week"
            subtitle="75 total — by type"
            data={ARTIFACTS_BY_TYPE}
            height={160}
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-brand-surface border border-brand-line rounded-xl p-4 flex flex-col gap-3">
            <div className="text-[11px] font-semibold text-brand-ink-2 uppercase tracking-wider">Top Performing Agent</div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4.5 h-4.5 text-brand-accent" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-brand-ink">PM Coach</div>
                <div className="text-[11px] text-brand-ink-2">99% approval · 189 runs</div>
              </div>
            </div>
          </div>
          <div className="bg-brand-surface border border-brand-line rounded-xl p-4 flex flex-col gap-2">
            <div className="text-[11px] font-semibold text-brand-ink-2 uppercase tracking-wider">Workflow Runs (Week)</div>
            <div className="text-[24px] font-bold text-brand-ink leading-none">
              47 <span className="text-[13px] font-normal text-green-600">94% complete</span>
            </div>
            <div className="w-full h-1.5 bg-brand-bg-2 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Cost per task + connector health */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-brand-surface border border-brand-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold text-brand-ink">Cost Per Task</div>
            <span className="text-[11px] text-green-600 font-medium">↓ Trending down · good</span>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[
              { l: 'Oct', v: 0.52 }, { l: 'Nov', v: 0.47 }, { l: 'Dec', v: 0.43 },
              { l: 'Jan', v: 0.38 }, { l: 'Feb', v: 0.31 }, { l: 'Mar', v: 0.26 }, { l: 'Apr', v: 0.24 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-brand-accent/70 hover:bg-brand-accent transition-colors cursor-default"
                  style={{ height: `${(d.v / 0.56) * 48}px` }}
                  title={`$${d.v}`}
                />
                <span className="text-[9px] text-brand-ink-2">{d.l}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-brand-ink-2 mt-3">
            Current: <span className="font-semibold text-brand-ink">$0.24 / task</span>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-line rounded-xl p-5">
          <div className="text-[14px] font-semibold text-brand-ink mb-4">Connector Health</div>
          <div className="grid grid-cols-2 gap-2">
            {CONNECTORS.map(c => (
              <div key={c.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-bg-2">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColor(c.status))} />
                <span className="flex-1 text-[12px] text-brand-ink font-medium truncate">{c.name}</span>
                <span className={cn('text-[10px] font-medium capitalize', labelColor(c.status))}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit trail */}
      <div className="bg-brand-surface border border-brand-line rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-line">
          <div className="text-[14px] font-semibold text-brand-ink">Last 5 Audit Events</div>
          <a href="/dashboard/audit" className="text-[11px] text-brand-accent hover:underline">View full log →</a>
        </div>
        <div className="divide-y divide-brand-line">
          {AUDIT_EVENTS.map((e, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-bg-2 transition-colors">
              <FileText className="w-3.5 h-3.5 text-brand-ink-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-brand-ink font-medium truncate">{e.action}</div>
                <div className="text-[10px] text-brand-ink-2">{e.actor} · {e.agent}</div>
              </div>
              <span className="text-[10px] text-brand-ink-2 flex-shrink-0">{e.at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
