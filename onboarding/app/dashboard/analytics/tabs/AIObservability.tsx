'use client';
import { cn } from '@/lib/utils';
import { DollarSign, Zap, AlertTriangle, Database } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { MetricTable } from '../components/MetricTable';
import { ChartBar } from '../components/ChartBar';

// TODO: replace with api.analytics.observability(range)
const COST_BY_MODEL = [
  { label: 'Claude',   value: 22, color: 'bg-brand-accent/80' },
  { label: 'GPT-4o',   value:  9, color: 'bg-blue-400/80'     },
  { label: 'Gemini',   value:  5, color: 'bg-green-400/80'    },
  { label: 'Mistral',  value:  2, color: 'bg-purple-400/80'   },
];

const COST_BY_AGENT = [
  { label: 'Strategy',    value:  9 },
  { label: 'Competitive', value:  7 },
  { label: 'Docs',        value:  6 },
  { label: 'Market',      value:  5 },
  { label: 'Sprint',      value:  4 },
  { label: 'Coach',       value:  4 },
  { label: 'Sales',       value:  2 },
  { label: 'Release',     value:  1 },
];

const LATENCY_ROWS: Record<string, string | number>[] = [
  { agent: 'PM Coach',            ttft: '0.4s', total: '0.9s', p50: '0.9s', p90: '1.6s', p99: '2.8s' },
  { agent: 'Strategy Advisor',    ttft: '0.5s', total: '1.1s', p50: '1.1s', p90: '2.1s', p99: '3.9s' },
  { agent: 'Sprint Planner',      ttft: '0.6s', total: '1.3s', p50: '1.3s', p90: '2.4s', p99: '4.1s' },
  { agent: 'Competitive Intel',   ttft: '0.9s', total: '2.1s', p50: '2.1s', p90: '3.8s', p99: '6.2s' },
  { agent: 'Docs Writer',         ttft: '0.8s', total: '1.8s', p50: '1.8s', p90: '3.1s', p99: '5.4s' },
  { agent: 'Market Intelligence', ttft: '1.1s', total: '2.4s', p50: '2.4s', p90: '4.2s', p99: '7.1s' },
];

const RAG_ROWS: Record<string, string | number>[] = [
  { source: 'Jira',         hit: '96%', coverage: '95%', stale: 0, freshness: '< 7 days'  },
  { source: 'Notion',       hit: '92%', coverage: '88%', stale: 2, freshness: '< 7 days'  },
  { source: 'Confluence',   hit: '84%', coverage: '72%', stale: 8, freshness: '7-30 days' },
  { source: 'Google Drive', hit: '79%', coverage: '65%', stale: 3, freshness: '< 7 days'  },
  { source: 'Slack',        hit: '71%', coverage: '58%', stale: 5, freshness: '7-30 days' },
];

const FRESHNESS = [
  { label: '< 7 days',  count: 312, color: 'bg-green-500' },
  { label: '7-30 days', count: 184, color: 'bg-amber-400' },
  { label: '> 30 days', count:  76, color: 'bg-red-400'   },
];

export default function AIObservability({ range }: { range: string }) {
  void range;
  const totalDocs = FRESHNESS.reduce((s, b) => s + b.count, 0);

  return (
    <div className="space-y-10">
      {/* LLM Usage & Cost */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">LLM Usage & Cost</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Token consumption, spend by model and agent, routing and cache efficiency</p>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Tokens (Month)"   value="4.2M"  delta="2.8M in · 1.4M out"    neutral  icon={Zap}           iconColor="text-brand-accent" />
          <StatCard label="Total LLM Spend"        value="$38"   delta="vs $50 budget"           neutral  icon={DollarSign}    iconColor="text-green-500"    />
          <StatCard label="Cache Hit Rate"         value="67%"   delta="+9pp MoM · saving $11"   positive icon={Zap}           iconColor="text-purple-500"   />
          <StatCard label="Retry / Regen Rate"     value="2.1%"  delta="-0.4pp MoM"              positive icon={AlertTriangle} iconColor="text-amber-500"    />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <ChartBar title="Cost by Model ($)" subtitle="This month" data={COST_BY_MODEL} height={150} />
          <ChartBar title="Cost by Agent ($)" subtitle="This month" data={COST_BY_AGENT} height={150} />
        </div>
        <div className="bg-brand-surface border border-brand-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold text-brand-ink">Token Budget vs Actual</div>
            <span className="text-[11px] text-brand-ink-2">$38 of $50 used — 9 days remain</span>
          </div>
          <div className="w-full h-3 bg-brand-bg-2 rounded-full overflow-hidden">
            <div className="h-full bg-brand-accent rounded-full transition-all" style={{ width: '76%' }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-brand-ink-2">
            <span>$0</span><span className="text-brand-accent font-medium">$38 spent (76%)</span><span>$50 budget</span>
          </div>
        </div>
      </section>

      {/* Latency */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">Latency</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Response time per agent — time to first token and full p50/p90/p99</p>
        </div>
        <MetricTable
          columns={[
            { key: 'agent', label: 'Agent' },
            { key: 'ttft',  label: 'TTFT',  align: 'right' },
            { key: 'total', label: 'Total', align: 'right' },
            { key: 'p50',   label: 'p50',   align: 'right' },
            { key: 'p90',   label: 'p90',   align: 'right' },
            { key: 'p99',   label: 'p99',   align: 'right',
              render: (v) => <span className={parseFloat(String(v)) > 5 ? 'text-amber-500 font-medium' : ''}>{v}</span> },
          ]}
          rows={LATENCY_ROWS}
        />
      </section>

      {/* RAG & Knowledge Health */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">RAG & Knowledge Health</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Retrieval quality, coverage gaps, and document freshness per connector</p>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="Overall Hit Rate"   value="86%"   delta="+3pp MoM"        positive icon={Database}      iconColor="text-brand-accent" />
          <StatCard label="Knowledge Gap Rate" value="14%"   delta="-3pp MoM"        positive icon={Database}      iconColor="text-green-500"    />
          <StatCard label="Stale Doc Alerts"   value="18"    delta="Need refresh"     neutral  icon={AlertTriangle} iconColor="text-amber-500"    />
          <StatCard label="Embedding Cost"     value="$1.20" delta="This month"       neutral  icon={DollarSign}    iconColor="text-purple-500"   />
        </div>
        <MetricTable
          title="Knowledge Source Coverage"
          columns={[
            { key: 'source',   label: 'Connector' },
            { key: 'hit',      label: 'Hit Rate',  align: 'right',
              render: (v) => {
                const n = parseInt(String(v));
                return <span className={cn('font-semibold', n >= 90 ? 'text-green-600' : n >= 75 ? 'text-amber-500' : 'text-red-500')}>{v}</span>;
              } },
            { key: 'coverage', label: 'Coverage',  align: 'right' },
            { key: 'stale',    label: 'Stale Docs', align: 'right',
              render: (v) => <span className={Number(v) > 5 ? 'text-amber-500 font-medium' : ''}>{Number(v) === 0 ? '—' : v}</span> },
            { key: 'freshness',label: 'Avg Freshness', align: 'right' },
          ]}
          rows={RAG_ROWS}
        />

        <div className="mt-4 bg-brand-surface border border-brand-line rounded-xl p-5">
          <div className="text-[13px] font-semibold text-brand-ink mb-4">Document Freshness Distribution</div>
          <div className="flex gap-3">
            {FRESHNESS.map((b, i) => (
              <div key={i} className="flex-1 bg-brand-bg-2 rounded-xl p-4 text-center">
                <div className={cn('w-3 h-3 rounded-full mx-auto mb-2', b.color)} />
                <div className="text-[22px] font-bold text-brand-ink">{b.count}</div>
                <div className="text-[11px] text-brand-ink-2 mt-1">{b.label}</div>
                <div className="text-[10px] text-brand-ink-2 mt-0.5 font-medium">{Math.round(b.count / totalDocs * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
