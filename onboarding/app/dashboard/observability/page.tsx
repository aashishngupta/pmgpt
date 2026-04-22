'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { USAGE_TIMELINE, AGENT_USAGE, LLM_EVAL, AUDIT_LOGS } from '@/lib/platform-data';
import { cn } from '@/lib/utils';
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Cpu,
  DollarSign, TrendingUp, Zap, Filter, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PIE_COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const CLASSIFICATION_COLORS: Record<string, string> = {
  public:       'bg-emerald-100 text-emerald-700',
  internal:     'bg-blue-100 text-blue-700',
  confidential: 'bg-amber-100 text-amber-700',
  restricted:   'bg-red-100 text-red-700',
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, alert }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string; alert?: boolean;
}) {
  return (
    <div className={cn('bg-white rounded-xl border p-4', alert ? 'border-red-200' : 'border-slate-200')}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-xs text-slate-500">{label}</span>
        {alert && <AlertTriangle className="w-3.5 h-3.5 text-red-500 ml-auto" />}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function QualityBar({ label, value, threshold = 80 }: { label: string; value: number; threshold?: number }) {
  const ok = value >= threshold;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-2 rounded-full transition-all', ok ? 'bg-emerald-400' : 'bg-red-400')}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn('text-xs font-bold w-10 text-right', ok ? 'text-emerald-600' : 'text-red-600')}>{value}%</span>
      {!ok && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
    </div>
  );
}

export default function ObservabilityPage() {
  const [evalAgent, setEvalAgent] = useState('Analytics');
  const totalQueries = USAGE_TIMELINE.reduce((s, d) => s + d.queries, 0);
  const totalCost    = USAGE_TIMELINE.reduce((s, d) => s + d.cost, 0);
  const totalTokens  = USAGE_TIMELINE.reduce((s, d) => s + d.tokens, 0);
  const evalData     = LLM_EVAL.find(e => e.agent === evalAgent) ?? LLM_EVAL[0];
  const hallucTotal  = LLM_EVAL.reduce((s, e) => s + e.hallucinations, 0);

  return (
    <div className="px-8 py-7 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Monitoring & Observability</h1>
          <p className="text-sm text-slate-400 mt-0.5">LLM quality, usage, cost, and audit — all in one place</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
          <Download className="w-4 h-4" /> Export report
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard icon={Activity}    label="Queries (7d)"       value={totalQueries.toLocaleString()}           color="text-violet-600" />
        <KpiCard icon={DollarSign}  label="LLM cost (7d)"      value={`$${totalCost.toFixed(2)}`}              color="text-emerald-600" sub="after cache savings" />
        <KpiCard icon={Cpu}         label="Tokens used"         value={`${(totalTokens/1e6).toFixed(1)}M`}      color="text-blue-600" />
        <KpiCard icon={AlertTriangle} label="Hallucinations (7d)" value={String(hallucTotal)}                  color="text-red-500" alert={hallucTotal > 2} />
        <KpiCard icon={TrendingUp}  label="Cache hit rate"     value="34%"                                      color="text-amber-500" sub="prompt cache" />
      </div>

      {/* Usage + Agent distribution */}
      <div className="grid grid-cols-3 gap-6">

        {/* Usage timeline */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="Query & Cost Timeline" subtitle="Last 7 days" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={USAGE_TIMELINE} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, name: any) => {
                  const n = Number(v);
                  const label = name === 'cost' ? 'Cost ($)' : name === 'queries' ? 'Queries' : 'Tokens';
                  return [name === 'cost' ? `$${n.toFixed(2)}` : n.toLocaleString(), label];
                }}
              />
              <Line yAxisId="left"  type="monotone" dataKey="queries" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="cost"    stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-0.5 bg-violet-600 rounded" /> Queries</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-0.5 bg-emerald-500 rounded border-dashed" /> Cost ($)</div>
          </div>
        </div>

        {/* Agent distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="Agent Usage Split" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={AGENT_USAGE} dataKey="queries" nameKey="agent" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                {AGENT_USAGE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), "Queries"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {AGENT_USAGE.map((a, i) => (
              <div key={a.agent} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-[11px] text-slate-600 flex-1">{a.agent}</span>
                <span className="text-[11px] font-semibold text-slate-700">{a.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LLM Evaluation */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="LLM Eval Scores" subtitle="Per agent, quality metrics vs 80% threshold" />
          <div className="flex flex-wrap gap-1.5 mb-4">
            {LLM_EVAL.map(e => (
              <button
                key={e.agent}
                onClick={() => setEvalAgent(e.agent)}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  evalAgent === e.agent ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {e.agent}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <QualityBar label="Faithfulness"   value={evalData.faithfulness}  threshold={85} />
            <QualityBar label="Relevance"      value={evalData.relevance}     threshold={85} />
            <QualityBar label="Completeness"   value={evalData.completeness}  threshold={80} />
            <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
              <span className="text-xs text-slate-600 w-28">Hallucinations</span>
              <span className={cn('text-sm font-bold', evalData.hallucinations === 0 ? 'text-emerald-600' : 'text-red-600')}>
                {evalData.hallucinations}
              </span>
              <span className="text-xs text-slate-400">this week</span>
              {evalData.hallucinations > 0 && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
            </div>
          </div>
        </div>

        {/* Eval bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="Quality Score by Agent" subtitle="Faithfulness score comparison" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={LLM_EVAL} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="agent" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="faithfulness" name="Faithfulness" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="relevance"    name="Relevance"    fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Token breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <SectionHeader title="Token Utilization by Agent" subtitle="Total tokens used (7d)" />
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={AGENT_USAGE.map((a, i) => ({
            ...a,
            tokens: [3840000, 8200000, 6100000, 3200000, 4800000, 980000, 720000][i] ?? 0,
          }))} layout="vertical" margin={{ left: 10, right: 30 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
            <YAxis type="category" dataKey="agent" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
            <Tooltip formatter={(v: any) => [`${(Number(v)/1e6).toFixed(2)}M tokens`]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Bar dataKey="tokens" fill="#7c3aed" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent audit log preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Recent Activity" subtitle="Latest agent queries across your workspace" />
          <a href="/dashboard/audit" className="text-xs text-violet-600 hover:underline font-medium">View full audit log →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                {['Timestamp', 'User', 'Agent', 'Action', 'Classification', 'Latency', 'Tokens'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {AUDIT_LOGS.slice(0, 5).map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{log.ts}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{log.user}</td>
                  <td className="py-2.5 px-3 capitalize">
                    <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[10px] font-semibold">{log.agent}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{log.action}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', CLASSIFICATION_COLORS[log.classification])}>
                      {log.classification}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{(log.latencyMs/1000).toFixed(2)}s</td>
                  <td className="py-2.5 px-3 text-slate-500">{log.tokens.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
