'use client';
import { cn } from '@/lib/utils';
import { CheckSquare, FileText, MessageSquare, HardDrive, GitMerge } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { MetricTable } from '../components/MetricTable';

// TODO: replace with api.analytics.integration(range)
const CONNECTOR_ACTIONS = [
  {
    icon: CheckSquare, name: 'Jira', color: 'text-blue-500',
    actions: [
      { label: 'Tickets created', value: 31 },
      { label: 'Tickets updated', value: 14 },
      { label: 'Comments added',  value: 22 },
    ],
  },
  {
    icon: FileText, name: 'Notion', color: 'text-brand-ink',
    actions: [
      { label: 'Pages created', value: 18 },
      { label: 'Pages updated', value: 11 },
    ],
  },
  {
    icon: FileText, name: 'Confluence', color: 'text-blue-600',
    actions: [
      { label: 'Pages published', value: 9 },
      { label: 'Pages updated',   value: 6 },
    ],
  },
  {
    icon: MessageSquare, name: 'Slack', color: 'text-green-600',
    actions: [
      { label: 'Messages sent',   value: 22 },
      { label: 'Threads replied', value:  8 },
    ],
  },
  {
    icon: HardDrive, name: 'Google Drive', color: 'text-amber-500',
    actions: [
      { label: 'Docs read',    value: 84 },
      { label: 'Docs created', value:  6 },
    ],
  },
];

const HEALTH_ROWS: Record<string, string | number>[] = [
  { connector: 'Jira',         lastSync: '4m ago',  success: '100%', errors: 0,  volume: '2.1 MB', auth: 'Valid 29d' },
  { connector: 'Notion',       lastSync: '12m ago', success: '99%',  errors: 1,  volume: '1.4 MB', auth: 'Valid 12d' },
  { connector: 'Confluence',   lastSync: '1h ago',  success: '91%',  errors: 9,  volume: '3.2 MB', auth: 'Valid 6d'  },
  { connector: 'Slack',        lastSync: '8m ago',  success: '100%', errors: 0,  volume: '0.8 MB', auth: 'Valid 22d' },
  { connector: 'Google Drive', lastSync: '18m ago', success: '97%',  errors: 2,  volume: '4.6 MB', auth: 'Valid 18d' },
];

const AUDIT_ROWS = [
  { at: '2h ago', actor: 'Aashish G', action: 'Jira ticket created',        agent: 'Sprint Planner',   approved: 'Aashish G', status: 'executed' },
  { at: '4h ago', actor: 'PM Lead',   action: 'Confluence page published',  agent: 'Docs Writer',      approved: 'PM Lead',   status: 'executed' },
  { at: '6h ago', actor: 'System',    action: 'Slack standup digest sent',  agent: 'Strategy Advisor', approved: 'auto',      status: 'executed' },
  { at: '8h ago', actor: 'Aashish G', action: 'Jira comment — aborted',    agent: 'Sprint Planner',   approved: '—',         status: 'aborted'  },
  { at: '1d ago', actor: 'PM Lead',   action: 'Notion page updated',        agent: 'Docs Writer',      approved: 'PM Lead',   status: 'executed' },
  { at: '1d ago', actor: 'System',    action: 'GDrive doc read (RAG sync)', agent: 'RAG',              approved: 'auto',      status: 'executed' },
];

export default function IntegrationActivity({ range }: { range: string }) {
  void range;
  return (
    <div className="space-y-10">
      {/* Actions by connector */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">Actions by Connector</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Everything pmGPT did in external systems this period</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <StatCard label="Total External Actions" value="231"  delta="+18% WoW"          positive />
          <StatCard label="Write Actions"          value="142"  delta="89 reads this period" neutral />
          <StatCard label="Aborted at Preview"     value="4"    delta="user rejected"        neutral />
        </div>
        <div className="grid grid-cols-5 gap-3">
          {CONNECTOR_ACTIONS.map(conn => {
            const Icon = conn.icon;
            return (
              <div key={conn.name} className="bg-brand-surface border border-brand-line rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={cn('w-4 h-4 flex-shrink-0', conn.color)} />
                  <span className="text-[13px] font-semibold text-brand-ink">{conn.name}</span>
                </div>
                <div className="space-y-2">
                  {conn.actions.map(a => (
                    <div key={a.label} className="flex items-center justify-between">
                      <span className="text-[11px] text-brand-ink-2 leading-tight">{a.label}</span>
                      <span className="text-[14px] font-bold text-brand-ink ml-2 flex-shrink-0">{a.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Connector Health */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">Connector Health</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Sync status, API error rates, data volume ingested, and auth token expiry</p>
        </div>
        <MetricTable
          columns={[
            { key: 'connector', label: 'Connector' },
            { key: 'lastSync',  label: 'Last Sync',     align: 'right' },
            { key: 'success',   label: 'Success Rate',  align: 'right',
              render: (v) => {
                const n = parseInt(String(v));
                return <span className={cn('font-semibold', n === 100 ? 'text-green-600' : n >= 95 ? 'text-amber-500' : 'text-red-500')}>{v}</span>;
              } },
            { key: 'errors',    label: 'API Errors', align: 'right',
              render: (v) => <span className={Number(v) > 5 ? 'text-red-500 font-medium' : Number(v) > 0 ? 'text-amber-500' : 'text-green-600'}>{Number(v) === 0 ? '—' : v}</span> },
            { key: 'volume',    label: 'Data Ingested', align: 'right' },
            { key: 'auth',      label: 'Auth Token',   align: 'right',
              render: (v) => {
                const days = parseInt(String(v).match(/\d+/)?.[0] ?? '30');
                return <span className={cn('font-medium', days < 7 ? 'text-red-500' : days < 14 ? 'text-amber-500' : 'text-green-600')}>{v}</span>;
              } },
          ]}
          rows={HEALTH_ROWS}
        />
      </section>

      {/* Audit & Governance */}
      <section>
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-brand-ink">Audit & Governance</h3>
          <p className="text-[11px] text-brand-ink-2 mt-0.5">Write action log — initiated by, previewed, approved by, executed</p>
        </div>
        <div className="bg-brand-surface border border-brand-line rounded-xl overflow-hidden">
          <div className="grid grid-cols-6 px-5 py-2.5 bg-brand-bg-2 border-b border-brand-line text-[11px] font-medium text-brand-ink-2">
            <div>Time</div>
            <div>Actor</div>
            <div className="col-span-2">Action</div>
            <div>Approved By</div>
            <div className="text-right">Status</div>
          </div>
          {AUDIT_ROWS.map((r, i) => (
            <div key={i} className="grid grid-cols-6 px-5 py-3 border-b border-brand-line last:border-0 hover:bg-brand-bg-2 transition-colors text-[12px]">
              <div className="text-brand-ink-2">{r.at}</div>
              <div className="text-brand-ink font-medium">{r.actor}</div>
              <div className="col-span-2 text-brand-ink">{r.action}</div>
              <div className="text-brand-ink-2">{r.approved}</div>
              <div className="text-right">
                <span className={cn(
                  'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold',
                  r.status === 'executed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                )}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
