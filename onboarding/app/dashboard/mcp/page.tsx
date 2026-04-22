'use client';

import { useState } from 'react';
import { MCP_SERVERS, MCPServer } from '@/lib/platform-data';
import { cn } from '@/lib/utils';
import { Download, CheckCircle2, Star, ExternalLink, Search, Package, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MCP_CATEGORIES = ['all', 'ai', 'storage', 'engineering', 'docs', 'comms', 'web', 'database', 'pm'];

export default function MCPPage() {
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(MCP_SERVERS.filter(s => s.installed).map(s => s.id))
  );

  const filtered = MCP_SERVERS.filter(s =>
    (cat === 'all' || s.category === cat) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
     s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="px-8 py-7 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-5 h-5 text-violet-600" />
          <h1 className="text-xl font-bold text-slate-900">MCP Library</h1>
        </div>
        <p className="text-sm text-slate-400">
          Model Context Protocol servers extend your agents with new tools and capabilities.
          Installed servers are available to all agents.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available servers', value: MCP_SERVERS.length,                            color: 'text-slate-800' },
          { label: 'Installed',         value: installed.size,                                 color: 'text-emerald-600' },
          { label: 'Official servers',  value: MCP_SERVERS.filter(s => s.official).length,    color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={cn('text-2xl font-bold mb-0.5', s.color)}>{s.value}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + category filter */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search MCP servers…"
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 w-64"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {MCP_CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                cat === c ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Server grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(server => {
          const isInstalled = installed.has(server.id);
          return (
            <div key={server.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-violet-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{server.name}</span>
                      {server.official && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">OFFICIAL</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 capitalize">{server.category}</span>
                  </div>
                </div>
                {server.stars && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 flex-shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {(server.stars / 1000).toFixed(1)}k
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-3">{server.description}</p>

              {/* Tools */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {server.tools.map(t => (
                  <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{t}</span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isInstalled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setInstalled(prev => { const n = new Set(prev); n.delete(server.id); return n; })}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Installed
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700"
                    onClick={() => setInstalled(prev => new Set(Array.from(prev).concat(server.id)))}
                  >
                    <Download className="w-3.5 h-3.5" /> Install
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-slate-500">
                  <ExternalLink className="w-3 h-3" /> Docs
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-700">What is MCP?</strong> Model Context Protocol (MCP) is an open standard by Anthropic that lets AI agents communicate with external tools in a standardized way.
        Each installed server adds tools that agents can call during a conversation.
        <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener" className="text-violet-600 hover:underline ml-1">Learn more →</a>
      </div>
    </div>
  );
}
