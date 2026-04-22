'use client';

import { useState } from 'react';
import { CONNECTORS, Connector, MCP_SERVERS } from '@/lib/platform-data';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw,
  Plus, ExternalLink, Search, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = [
  { id: 'all',                label: 'All'           },
  { id: 'project_management', label: 'Project Mgmt'  },
  { id: 'docs',               label: 'Docs & Wiki'   },
  { id: 'communication',      label: 'Comms'         },
  { id: 'analytics',          label: 'Analytics'     },
  { id: 'storage',            label: 'Storage'       },
  { id: 'engineering',        label: 'Engineering'   },
  { id: 'crm',                label: 'CRM'           },
];

function StatusIcon({ status }: { status: Connector['status'] }) {
  if (status === 'connected') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'partial')   return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  if (status === 'error')     return <XCircle className="w-4 h-4 text-red-500" />;
  return <div className="w-4 h-4 rounded-full border-2 border-slate-300" />;
}

function StatusText({ status }: { status: Connector['status'] }) {
  const map = {
    connected:    'text-emerald-600',
    partial:      'text-amber-600',
    error:        'text-red-600',
    disconnected: 'text-slate-400',
  };
  return <span className={cn('text-[11px] font-semibold capitalize', map[status])}>{status}</span>;
}

function ConnectorCard({ connector }: { connector: Connector }) {
  const [syncing, setSyncing] = useState(false);

  function handleSync() {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl flex-shrink-0">
          {connector.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-sm font-bold text-slate-900">{connector.name}</span>
            <div className="flex items-center gap-1.5">
              <StatusIcon status={connector.status} />
              <StatusText status={connector.status} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-3">{connector.description}</p>

          {/* Metadata */}
          {connector.status !== 'disconnected' && (
            <div className="flex items-center gap-3 mb-3">
              {connector.docsIndexed !== undefined && (
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{connector.docsIndexed}</span> docs indexed
                </div>
              )}
              {connector.lastSync && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" /> {connector.lastSync}
                </div>
              )}
            </div>
          )}

          {/* Error hint */}
          {connector.status === 'error' && (
            <div className="mb-3 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-600">
              Connection failed — check API credentials
            </div>
          )}
          {connector.status === 'partial' && (
            <div className="mb-3 px-2.5 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-700">
              Partially connected — search.messages requires User token
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {connector.status === 'disconnected' ? (
              <Button size="sm" className="h-7 text-xs bg-violet-600 hover:bg-violet-700 gap-1">
                <Plus className="w-3 h-3" /> Connect
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={cn('w-3 h-3', syncing && 'animate-spin')} />
                  {syncing ? 'Syncing…' : 'Sync now'}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <ExternalLink className="w-3 h-3" /> Settings
                </Button>
              </>
            )}
            <span className="text-[10px] text-slate-400 ml-auto capitalize">{connector.authType.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectorsPage() {
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = CONNECTORS.filter(c =>
    (cat === 'all' || c.category === cat) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const connected   = CONNECTORS.filter(c => c.status === 'connected' || c.status === 'partial').length;
  const errors      = CONNECTORS.filter(c => c.status === 'error').length;
  const totalDocs   = CONNECTORS.reduce((s, c) => s + (c.docsIndexed ?? 0), 0);

  return (
    <div className="px-8 py-7 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Integrations</h1>
          <p className="text-sm text-slate-400 mt-0.5">Connect your tools to give agents access to your real data</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-2 h-9 text-sm">
          <Plus className="w-4 h-4" /> Add connector
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Connected',     value: connected,           color: 'text-emerald-600' },
          { label: 'Errors',        value: errors,              color: 'text-red-500'     },
          { label: 'Disconnected',  value: CONNECTORS.filter(c => c.status === 'disconnected').length, color: 'text-slate-400' },
          { label: 'Docs indexed',  value: totalDocs,           color: 'text-violet-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={cn('text-2xl font-bold mb-0.5', s.color)}>{s.value}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search connectors…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                cat === c.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(c => <ConnectorCard key={c.id} connector={c} />)}
      </div>
    </div>
  );
}
