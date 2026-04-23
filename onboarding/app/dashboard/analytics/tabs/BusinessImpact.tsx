'use client';
import { cn } from '@/lib/utils';
import { Package, Clock, DollarSign, ThumbsUp, GitMerge, MessageSquare, FileText, CheckSquare } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { MetricTable } from '../components/MetricTable';

// TODO: replace with api.analytics.impact(range)
const ARTIFACT_ROWS: Record<string, string | number>[] = [
  { type: 'PRD',               week: 14, month:  52, quarter: 148 },
  { type: 'Jira Ticket',       week: 31, month: 112, quarter: 334 },
  { type: 'Sprint Plan',       week:  8, month:  28, quarter:  82 },
  { type: 'Competitive Brief', week: 11, month:  38, quarter: 104 },
  { type: 'Release Notes',     week:  5, month:  18, quarter:  54 },
  { type: 'Standup Report',    week:  6, month:  24, quarter:  72 },
];

const QUALITY_ROWS: Record<string, string | number>[] = [
  { task: 'PRD',               approval: '94%', edit: '6%',  hitl: '22%', abort: '2%' },
  { task: 'Jira Ticket',       approval: '89%', edit: '11%', hitl: '18%', abort: '4%' },
  { task: 'Sprint Plan',       approval: '97%', edit: '3%',  hitl: '12%', abort: '1%' },
  { task: 'Competitive Brief', approval: '91%', edit: '9%',  hitl: '8%',  abort: '3%' },
  { task: 'Release Notes',     approval: '96%', edit: '4%',  hitl: '6%',  abort: '1%' },
];

const EXTERNAL_ACTIONS = [
  { icon: CheckSquare,  label: 'Jira tickets created',       value: '31', color: 'text-blue-500'   },
  { icon: CheckSquare,  label: 'Jira tickets updated',       value: '14', color: 'text-blue-400'   },
  { icon: FileText,     label: 'Notion pages created',       value: '18', color: 'text-brand-ink'  },
  { icon: FileText,     label: 'Confluence pages published', value: '9',  color: 'text-blue-600'   },
  { icon: MessageSquare,label: 'Slack messages sent',        value: '22', color: 'text-green-600'  },
  { icon: GitMerge,     label: 'Decisions supported',        value: '47', color: 'text-purple-500' },
];

const costTrend = [
  { l: 'Oct', v: 0.52 }, { l: 'Nov', v: 0.47 }, { l: 'Dec', v: 0.43 },
  { l: 'Jan', v: 0.38 }, { l: 'Feb', v: 0.31 }, { l: 'Mar', v: 0.26 }, { l: 'Apr', v: 0.24 },
];

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-semibold text-brand-ink">{title}</h3>
      {subtitle && <p className="text-[11px] text-brand-ink-2 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function BusinessImpact({ range }: { range: string }) {
  void range;
  return (
    <div className="space-y-10">
      {/* Output & Throughput */}
      <section>
        <SectionHeader title="Output & Throughput" subtitle="End-to-end tasks shipped and automation coverage" />
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="Tasks Shipped (Week)"     value="75"   delta="+18% WoW"    positive icon={Package}  iconColor="text-brand-accent" />
          <StatCard label="Tasks Shipped (Month)"    value="272"  delta="+24% MoM"    positive icon={Package}  iconColor="text-brand-accent" />
          <StatCard label="Avg Task Velocity"        value="2.4h" delta="-0.6h vs last mo" positive icon={Clock} iconColor="text-green-500" />
          <StatCard label="Workflow Automation Rate" value="61%"  delta="+8pp MoM"    positive icon={GitMerge} iconColor="text-purple-500"  />
        </div>
        <MetricTable
          title="Artifacts by Type"
          subtitle="Week / Month / Quarter"
          columns={[
            { key: 'type',    label: 'Artifact Type'  },
            { key: 'week',    label: 'This Week',    align: 'right' },
            { key: 'month',   label: 'This Month',   align: 'right' },
            { key: 'quarter', label: 'This Quarter', align: 'right' },
          ]}
          rows={ARTIFACT_ROWS}
        />
      </section>

      {/* Value & ROI */}
      <section>
        <SectionHeader title="Value & ROI" subtitle="Estimated savings and efficiency ratio" />
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="Hours Saved (Month)"  value="148h"   delta="+22% MoM"           positive icon={Clock}      iconColor="text-green-500"    />
          <StatCard label="Cost Avoidance ($)"   value="$14.8k" delta="@ $100/hr PM rate"  neutral  icon={DollarSign}  iconColor="text-green-600"    />
          <StatCard label="pmGPT Cost (Month)"   value="$38"    delta="$14,800 delivered"  neutral  icon={DollarSign}  iconColor="text-amber-500"    />
          <StatCard label="ROI Ratio"            value="389×"   delta="Value / spend"       positive icon={ThumbsUp}   iconColor="text-brand-accent" />
        </div>
        <div className="bg-brand-surface border border-brand-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-brand-ink">Cost Per Task Trend</div>
            <span className="text-[11px] text-green-600 font-medium">↓ 54% over 6 months</span>
          </div>
          <div className="flex items-end gap-2 h-20">
            {costTrend.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-brand-ink-2">${d.v}</span>
                <div
                  className="w-full rounded-t bg-brand-accent/70 hover:bg-brand-accent transition-colors cursor-default"
                  style={{ height: `${(d.v / 0.56) * 54}px` }}
                />
                <span className="text-[10px] text-brand-ink-2">{d.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality */}
      <section>
        <SectionHeader title="Quality" subtitle="How often agents get it right the first time" />
        <MetricTable
          columns={[
            { key: 'task',     label: 'Task Type' },
            { key: 'approval', label: 'Approval Rate', align: 'right',
              render: (v) => {
                const n = parseInt(String(v));
                return <span className={cn('font-semibold', n >= 95 ? 'text-green-600' : n >= 88 ? 'text-amber-500' : 'text-red-500')}>{v}</span>;
              } },
            { key: 'edit',  label: 'Edit Rate',  align: 'right' },
            { key: 'hitl',  label: 'HITL Rate',  align: 'right' },
            { key: 'abort', label: 'Abort Rate', align: 'right',
              render: (v) => <span className={parseInt(String(v)) >= 4 ? 'text-amber-500 font-medium' : ''}>{v}</span> },
          ]}
          rows={QUALITY_ROWS}
        />
      </section>

      {/* External Actions */}
      <section>
        <SectionHeader title="Actions with Real-World Impact" subtitle="What pmGPT actually did in external systems this period" />
        <div className="grid grid-cols-3 gap-3">
          {EXTERNAL_ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={i} className="bg-brand-surface border border-brand-line rounded-xl px-4 py-3 flex items-center gap-3">
                <Icon className={cn('w-4 h-4 flex-shrink-0', a.color)} />
                <span className="flex-1 text-[12px] text-brand-ink">{a.label}</span>
                <span className="text-[18px] font-bold text-brand-ink">{a.value}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
