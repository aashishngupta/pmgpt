'use client';
import { cn } from '@/lib/utils';
import { Bot, GitBranch, Clock, CheckCircle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { MetricTable } from '../components/MetricTable';

// TODO: replace with api.analytics.automation(range)
const AGENT_ROWS: Record<string, string | number>[] = [
  { name: 'PM Coach',            runs: 189, completion: '99%', approval: '99%', turns: 2.1, abandon: '1%',  p50: '0.9s', p90: '1.6s', errors: '0.5%' },
  { name: 'Strategy Advisor',    runs: 234, completion: '97%', approval: '97%', turns: 3.2, abandon: '2%',  p50: '1.1s', p90: '2.1s', errors: '0.8%' },
  { name: 'Sprint Planner',      runs: 143, completion: '98%', approval: '97%', turns: 2.8, abandon: '1%',  p50: '1.3s', p90: '2.4s', errors: '0.6%' },
  { name: 'Competitive Intel',   runs: 152, completion: '94%', approval: '91%', turns: 4.1, abandon: '4%',  p50: '2.1s', p90: '3.8s', errors: '2.1%' },
  { name: 'Docs Writer',         runs: 128, completion: '96%', approval: '94%', turns: 3.6, abandon: '2%',  p50: '1.8s', p90: '3.1s', errors: '1.2%' },
  { name: 'Market Intelligence', runs:  98, completion: '92%', approval: '89%', turns: 4.8, abandon: '5%',  p50: '2.4s', p90: '4.2s', errors: '2.8%' },
  { name: 'Sales Intel',         runs:  87, completion: '95%', approval: '93%', turns: 3.3, abandon: '3%',  p50: '1.6s', p90: '2.9s', errors: '1.4%' },
  { name: 'Release Manager',     runs:  63, completion: '99%', approval: '98%', turns: 2.2, abandon: '0%',  p50: '1.2s', p90: '2.0s', errors: '0.3%' },
];

const WORKFLOW_ROWS: Record<string, string | number>[] = [
  { name: 'Weekly Standup Digest',    runs: 12, completion: '100%', aborts: '0%', avgTime: '0.8m', approvals: '0%',  saved: '3.6h' },
  { name: 'Sprint Planning Prep',     runs:  4, completion: '100%', aborts: '0%', avgTime: '2.1m', approvals: '25%', saved: '4.2h' },
  { name: 'Competitive Monitor',      runs:  8, completion:  '88%', aborts: '4%', avgTime: '3.4m', approvals: '12%', saved: '6.4h' },
  { name: 'Release Notes Generator',  runs:  6, completion:  '83%', aborts: '0%', avgTime: '1.8m', approvals: '33%', saved: '3.0h' },
  { name: 'Jira Sync + Triage',       runs: 24, completion:  '96%', aborts: '2%', avgTime: '1.2m', approvals: '8%',  saved: '7.2h' },
];

const FUNNEL = [
  { label: 'Previewed', value: 87, color: 'bg-brand-accent'  },
  { label: 'Approved',  value: 79, color: 'bg-green-500'     },
  { label: 'Executed',  value: 76, color: 'bg-green-700'     },
];

function pct(v: string | number) { return parseInt(String(v)); }

export default function AutomationPerformance({ range }: { range: string }) {
  void range;
  return (
    <div className="space-y-10">
      {/* Agent Performance */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">Agent Performance</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Invocations, quality, and latency per agent</p>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Agent Runs"    value="1,094" delta="+31% WoW"    positive icon={Bot}         iconColor="text-brand-accent" />
          <StatCard label="Avg Completion Rate" value="96.5%" delta="+1.2pp MoM"  positive icon={CheckCircle} iconColor="text-green-500"    />
          <StatCard label="Avg Approval Rate"   value="94.8%" delta="+0.8pp MoM"  positive icon={CheckCircle} iconColor="text-green-500"    />
          <StatCard label="Avg Task Turns"      value="3.1"   delta="-0.4 MoM"    positive icon={Clock}       iconColor="text-purple-500"   />
        </div>
        <MetricTable
          columns={[
            { key: 'name',       label: 'Agent' },
            { key: 'runs',       label: 'Runs',       align: 'right' },
            { key: 'completion', label: 'Completion',  align: 'right',
              render: (v) => <span className={cn('font-semibold', pct(v) >= 97 ? 'text-green-600' : pct(v) >= 93 ? 'text-amber-500' : 'text-red-500')}>{v}</span> },
            { key: 'approval',   label: 'Approval',   align: 'right',
              render: (v) => <span className={cn('font-semibold', pct(v) >= 97 ? 'text-green-600' : pct(v) >= 90 ? 'text-amber-500' : 'text-red-500')}>{v}</span> },
            { key: 'turns',      label: 'Avg Turns',  align: 'right' },
            { key: 'abandon',    label: 'Abandon',    align: 'right',
              render: (v) => <span className={pct(v) >= 4 ? 'text-amber-500 font-medium' : 'text-brand-ink-2'}>{v}</span> },
            { key: 'p50',        label: 'p50',        align: 'right' },
            { key: 'p90',        label: 'p90',        align: 'right' },
            { key: 'errors',     label: 'Errors',     align: 'right',
              render: (v) => <span className={parseFloat(String(v)) >= 2.0 ? 'text-red-500 font-medium' : 'text-brand-ink-2'}>{v}</span> },
          ]}
          rows={AGENT_ROWS}
        />
      </section>

      {/* Workflow Performance */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">Workflow Performance</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Scheduled and manual workflow execution health</p>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Workflow Runs"       value="54"    delta="+8 WoW"        positive icon={GitBranch}  iconColor="text-purple-500"   />
          <StatCard label="Avg Completion Rate"       value="93.4%" delta="-1.2pp WoW"    neutral  icon={CheckCircle} iconColor="text-amber-500"   />
          <StatCard label="Avg Execution Time"        value="1.9m"  delta="-0.2m MoM"     positive icon={Clock}      iconColor="text-green-500"    />
          <StatCard label="Hours Saved (Workflows)"   value="24.4h" delta="+3.1h WoW"     positive icon={Clock}      iconColor="text-brand-accent" />
        </div>
        <MetricTable
          columns={[
            { key: 'name',       label: 'Workflow' },
            { key: 'runs',       label: 'Runs',           align: 'right' },
            { key: 'completion', label: 'Completion',     align: 'right',
              render: (v) => <span className={cn('font-semibold', pct(v) >= 97 ? 'text-green-600' : pct(v) >= 85 ? 'text-amber-500' : 'text-red-500')}>{v}</span> },
            { key: 'aborts',     label: 'Abort Rate',     align: 'right',
              render: (v) => <span className={pct(v) >= 3 ? 'text-amber-500 font-medium' : 'text-brand-ink-2'}>{v}</span> },
            { key: 'avgTime',    label: 'Avg Time',       align: 'right' },
            { key: 'approvals',  label: 'Approval Steps', align: 'right' },
            { key: 'saved',      label: 'Hours Saved',    align: 'right',
              render: (v) => <span className="text-green-600 font-medium">{v}</span> },
          ]}
          rows={WORKFLOW_ROWS}
        />

        {/* Preview → Approve → Execute funnel */}
        <div className="mt-4 bg-brand-surface border border-brand-line rounded-xl p-5">
          <div className="text-[13px] font-semibold text-brand-ink mb-4">Preview → Approve → Execute Funnel</div>
          <div className="flex items-stretch gap-2">
            {FUNNEL.map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'flex-1 flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border',
                  i === 0 ? 'bg-brand-accent/10 border-brand-accent/20' :
                  i === 1 ? 'bg-green-50 border-green-200' : 'bg-green-100 border-green-300',
                )}>
                  <span className="text-[24px] font-bold text-brand-ink">{step.value}</span>
                  <span className="text-[12px] text-brand-ink-2 font-medium">{step.label}</span>
                  {i > 0 && (
                    <span className="text-[10px] text-green-600 font-medium">
                      {Math.round(step.value / FUNNEL[i - 1].value * 100)}% conversion
                    </span>
                  )}
                </div>
                {i < FUNNEL.length - 1 && (
                  <span className="text-[18px] text-brand-ink-2 flex-shrink-0">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
