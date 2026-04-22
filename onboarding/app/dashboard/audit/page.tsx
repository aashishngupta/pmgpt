'use client';

import { useState } from 'react';
import { AUDIT_LOGS } from '@/lib/platform-data';
import { cn } from '@/lib/utils';
import { Download, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CLASSIFICATION_COLORS: Record<string, string> = {
  public:       'bg-emerald-100 text-emerald-700',
  internal:     'bg-blue-100 text-blue-700',
  confidential: 'bg-amber-100 text-amber-700',
  restricted:   'bg-red-100 text-red-700',
};

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const logs = AUDIT_LOGS.filter(l =>
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.agent.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-8 py-7 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-400 mt-0.5">Every agent query, data access, and classification — fully auditable</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, agent, action…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400" />
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-9 text-xs"><Filter className="w-4 h-4" /> Filter</Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Timestamp','User','Agent','Action','Classification','Latency','Tokens'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.ts}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{log.user}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[10px] font-semibold capitalize">{log.agent}</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{log.action}</td>
                <td className="py-3 px-4">
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', CLASSIFICATION_COLORS[log.classification])}>
                    {log.classification}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">{(log.latencyMs/1000).toFixed(2)}s</td>
                <td className="py-3 px-4 text-slate-500">{log.tokens.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
