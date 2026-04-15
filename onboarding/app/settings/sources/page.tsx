'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Plus, ExternalLink, Lock, Zap, RefreshCw } from 'lucide-react';

interface Connector {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  category: string;
  adminOnly?: boolean;
  beta?: boolean;
}

const CONNECTORS: Connector[] = [
  // Project management
  { id: 'jira',      name: 'Jira',      desc: 'Issues, sprints, epics',           emoji: '🔵', category: 'Project Management' },
  { id: 'linear',    name: 'Linear',    desc: 'Issues, cycles, projects',          emoji: '⚫', category: 'Project Management' },
  { id: 'asana',     name: 'Asana',     desc: 'Tasks, projects, portfolios',       emoji: '🔴', category: 'Project Management' },
  // Docs
  { id: 'notion',    name: 'Notion',    desc: 'Pages, databases, wikis',           emoji: '⬜', category: 'Docs & Knowledge' },
  { id: 'confluence',name: 'Confluence',desc: 'Spaces, pages, templates',          emoji: '🔷', category: 'Docs & Knowledge' },
  { id: 'gdrive',    name: 'Google Drive', desc: 'Docs, slides, sheets',           emoji: '🌈', category: 'Docs & Knowledge' },
  // Communication
  { id: 'slack',     name: 'Slack',     desc: 'Channels, threads, DMs',           emoji: '💬', category: 'Communication' },
  { id: 'teams',     name: 'MS Teams',  desc: 'Channels, meetings, files',         emoji: '🟣', category: 'Communication', beta: true },
  { id: 'email',     name: 'Gmail',     desc: 'Threads, labels, contacts',         emoji: '📧', category: 'Communication' },
  // Analytics
  { id: 'amplitude', name: 'Amplitude', desc: 'Events, funnels, retention',        emoji: '📈', category: 'Analytics' },
  { id: 'mixpanel',  name: 'Mixpanel',  desc: 'User flows, cohorts, events',       emoji: '🔮', category: 'Analytics' },
  { id: 'ga4',       name: 'Google Analytics', desc: 'Sessions, conversions, funnels', emoji: '📊', category: 'Analytics' },
  // Customer
  { id: 'intercom',  name: 'Intercom',  desc: 'Conversations, feedback, NPS',      emoji: '💙', category: 'CRM & Support' },
  { id: 'zendesk',   name: 'Zendesk',   desc: 'Tickets, macros, CSAT',             emoji: '🟢', category: 'CRM & Support' },
  { id: 'salesforce',name: 'Salesforce',desc: 'Accounts, opps, contacts',          emoji: '☁️',  category: 'CRM & Support', adminOnly: true },
  // Design
  { id: 'figma',     name: 'Figma',     desc: 'Files, frames, prototypes',         emoji: '🎨', category: 'Design' },
  { id: 'miro',      name: 'Miro',      desc: 'Boards, flows, templates',          emoji: '🟡', category: 'Design', beta: true },
];

const CATEGORIES = ['Project Management', 'Docs & Knowledge', 'Communication', 'Analytics', 'CRM & Support', 'Design'];

export default function SourcesPage() {
  const [connected, setConnected] = useState<string[]>(['gdrive', 'slack', 'jira']);
  const [syncing, setSyncing] = useState<string | null>(null);

  const connect = (id: string) => {
    setConnected(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const disconnect = (id: string) => {
    setConnected(prev => prev.filter(c => c !== id));
  };

  const syncNow = (id: string) => {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 2000);
  };

  const connectedCount = connected.length;

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sources & MCP</h1>
          <p className="text-slate-500 text-sm mt-1">Connect your tools via Model Context Protocol</p>
        </div>
        <div className="flex items-center gap-2.5 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
          <div className="text-xl font-bold text-violet-700">{connectedCount}</div>
          <div className="text-xs text-violet-600">sources<br />connected</div>
        </div>
      </div>

      {/* MCP explainer */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 mb-6 text-white">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">⚡</div>
          <div>
            <div className="font-semibold mb-1">Model Context Protocol (MCP)</div>
            <p className="text-sm text-slate-300 leading-relaxed">
              MCP is an open standard that lets pmGPT agents securely read from your tools in real-time.
              No data is stored — agents query your sources on demand, with your permission.
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      {CATEGORIES.map(category => {
        const catConnectors = CONNECTORS.filter(c => c.category === category);
        return (
          <section key={category} className="mb-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{category}</h2>
            <div className="grid grid-cols-1 gap-2">
              {catConnectors.map(connector => {
                const isConnected = connected.includes(connector.id);
                const isSyncing = syncing === connector.id;

                return (
                  <div
                    key={connector.id}
                    className={cn(
                      'bg-white rounded-xl border-2 p-4 flex items-center gap-4 transition-all',
                      isConnected ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="text-2xl flex-shrink-0">{connector.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-slate-800">{connector.name}</span>
                        {connector.adminOnly && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] gap-1">
                            <Lock className="w-2.5 h-2.5" /> Admin only
                          </Badge>
                        )}
                        {connector.beta && (
                          <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">Beta</Badge>
                        )}
                        {isConnected && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Connected
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{connector.desc}</div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isConnected ? (
                        <>
                          <button
                            onClick={() => syncNow(connector.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                            title="Sync now"
                          >
                            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                          </button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200"
                            onClick={() => disconnect(connector.id)}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-violet-600 hover:bg-violet-700 gap-1.5"
                          onClick={() => connect(connector.id)}
                        >
                          <Plus className="w-3.5 h-3.5" /> Connect
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Custom MCP */}
      <section className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
        <div className="text-2xl mb-2">🔌</div>
        <div className="font-medium text-slate-700 mb-1">Custom MCP server</div>
        <p className="text-sm text-slate-400 mb-4">Connect any tool that supports the MCP protocol</p>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <ExternalLink className="w-3.5 h-3.5" /> View MCP docs
        </Button>
      </section>
    </div>
  );
}
