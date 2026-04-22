'use client';

import { useState } from 'react';
import { BookOpen, Upload, Search, RefreshCw, FileText, File, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DOCS = [
  { id: 1, title: 'pmGPT Strategic Thesis',    connector: 'gdrive',  chunks: 84,  size: '79.7k chars', updated: '1h ago',  type: 'pdf'  },
  { id: 2, title: 'Q2 OKRs & Roadmap',         connector: 'notion',  chunks: 12,  size: '4.2k chars',  updated: '2h ago',  type: 'page' },
  { id: 3, title: 'Activation Sprint Plan',    connector: 'notion',  chunks: 8,   size: '3.1k chars',  updated: '2h ago',  type: 'page' },
  { id: 4, title: 'Product Principles v2',     connector: 'gdrive',  chunks: 22,  size: '12.4k chars', updated: '3d ago',  type: 'doc'  },
  { id: 5, title: 'Team Onboarding Guide',     connector: 'notion',  chunks: 18,  size: '8.9k chars',  updated: '5d ago',  type: 'page' },
  { id: 6, title: 'NPS Analysis Q1 2026',      connector: 'gdrive',  chunks: 34,  size: '21.1k chars', updated: '1w ago',  type: 'pdf'  },
];

const CONTEXT = [
  { key: 'product',    label: 'Product',         content: 'pmGPT — AI Chief of Staff for PMs. B2B SaaS. Series A prep. 50+ customers.' },
  { key: 'team',       label: 'Team structure',  content: 'Head of PM: Aashish. PMs: Priya (Activation), Rahul (Analytics). Designer: Alex.' },
  { key: 'okrs',       label: 'Current OKRs',    content: 'Q2: Activation 45%, MRR $150k, Churn <3%, Mobile v2 by Jun 30.' },
  { key: 'sprint',     label: 'Current sprint',  content: 'Sprint 24 — Activation focus. 42 stories, 27 done. Ends Apr 24.' },
];

export default function KnowledgePage() {
  const [tab, setTab] = useState<'docs' | 'context'>('docs');
  const [search, setSearch] = useState('');

  const filtered = DOCS.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-8 py-7 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Knowledge</h1>
          <p className="text-sm text-slate-400 mt-0.5">RAG-indexed documents and always-on context injected into every agent</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 h-9 text-xs"><RefreshCw className="w-4 h-4" /> Sync all</Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 gap-2 h-9 text-xs"><Upload className="w-4 h-4" /> Upload doc</Button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5">
        {(['docs', 'context'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all',
              tab === t ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}>
            {t === 'docs' ? `Indexed Documents (${DOCS.length})` : 'Context Library'}
          </button>
        ))}
      </div>

      {tab === 'docs' && (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Document', 'Source', 'Chunks', 'Size', 'Updated'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-800">{doc.title}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium capitalize">{doc.connector}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{doc.chunks}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{doc.size}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{doc.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">Total: {DOCS.reduce((s,d) => s+d.chunks, 0)} chunks indexed across {DOCS.length} documents</p>
        </>
      )}

      {tab === 'context' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 mb-4">These snippets are always prepended to agent queries. Keep them concise and current.</p>
          {CONTEXT.map(c => (
            <div key={c.key} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{c.label}</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-400">Edit</Button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{c.content}</p>
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-2 h-9 text-xs mt-2"><BookOpen className="w-4 h-4" /> Add context snippet</Button>
        </div>
      )}
    </div>
  );
}
