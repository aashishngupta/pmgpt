'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Search, Trash2, Tag, FileText, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextDoc {
  id: string;
  title: string;
  type: 'PRD' | 'Strategy' | 'Research' | 'Competitive' | 'OKR' | 'Meeting notes';
  tags: string[];
  preview: string;
  lastUpdated: string;
  usedBy: string[];
}

const SAMPLE_DOCS: ContextDoc[] = [
  {
    id: '1',
    title: 'Q2 2024 Product Strategy',
    type: 'Strategy',
    tags: ['Q2', 'roadmap', 'OKRs'],
    preview: 'Our north star for Q2 is to grow DAU by 30% through improved onboarding and...',
    lastUpdated: '2 days ago',
    usedBy: ['Strategy Agent', 'Docs Agent'],
  },
  {
    id: '2',
    title: 'User Research — Checkout Flow',
    type: 'Research',
    tags: ['checkout', 'ux', 'interviews'],
    preview: 'We interviewed 12 users and found 4 critical drop-off points in the checkout...',
    lastUpdated: '1 week ago',
    usedBy: ['Research Agent', 'Analytics Agent'],
  },
  {
    id: '3',
    title: 'Competitor Analysis — Notion vs Linear',
    type: 'Competitive',
    tags: ['competitors', 'market'],
    preview: 'Key differentiators: Notion focuses on docs-first workflow while Linear...',
    lastUpdated: '3 days ago',
    usedBy: ['Research Agent', 'Strategy Agent'],
  },
  {
    id: '4',
    title: 'Mobile App PRD v2.1',
    type: 'PRD',
    tags: ['mobile', 'v2', 'specs'],
    preview: 'This document outlines the requirements for the next version of our mobile app...',
    lastUpdated: '5 hours ago',
    usedBy: ['Docs Agent'],
  },
  {
    id: '5',
    title: 'OKRs — H2 2024',
    type: 'OKR',
    tags: ['OKRs', 'H2', 'goals'],
    preview: 'Objective 1: Become the go-to tool for enterprise product teams...',
    lastUpdated: '1 month ago',
    usedBy: ['Strategy Agent'],
  },
];

const TYPE_COLORS: Record<string, string> = {
  PRD: 'bg-blue-100 text-blue-700',
  Strategy: 'bg-violet-100 text-violet-700',
  Research: 'bg-orange-100 text-orange-700',
  Competitive: 'bg-red-100 text-red-700',
  OKR: 'bg-emerald-100 text-emerald-700',
  'Meeting notes': 'bg-slate-100 text-slate-600',
};

const ALL_TYPES = ['All', 'PRD', 'Strategy', 'Research', 'Competitive', 'OKR', 'Meeting notes'];

export default function ContextLibraryPage() {
  const [docs, setDocs] = useState<ContextDoc[]>(SAMPLE_DOCS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags.some(t => t.includes(search.toLowerCase()));
    const matchesType = filter === 'All' || doc.type === filter;
    return matchesSearch && matchesType;
  });

  const deleteDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    if (selected === id) setSelected(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Context Library</h1>
          <p className="text-slate-500 text-sm mt-1">Documents agents use as background knowledge</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-1.5">
          <Plus className="w-4 h-4" /> Add document
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10"
            placeholder="Search documents..."
          />
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {ALL_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all',
              filter === type
                ? 'border-violet-500 bg-violet-100 text-violet-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Doc list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No documents match your search</p>
          </div>
        )}

        {filtered.map(doc => (
          <div
            key={doc.id}
            className={cn(
              'bg-white rounded-xl border-2 p-4 cursor-pointer transition-all group',
              selected === doc.id ? 'border-violet-300 shadow-sm' : 'border-slate-200 hover:border-slate-300'
            )}
            onClick={() => setSelected(selected === doc.id ? null : doc.id)}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-sm text-slate-800">{doc.title}</span>
                  <Badge className={cn('text-[10px] border-0', TYPE_COLORS[doc.type])}>{doc.type}</Badge>
                </div>
                <p className="text-xs text-slate-400 truncate">{doc.preview}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" /> {doc.lastUpdated}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Tag className="w-3 h-3" />
                    {doc.tags.map(t => `#${t}`).join(' ')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); deleteDoc(doc.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className={cn('w-4 h-4 text-slate-300 transition-transform', selected === doc.id && 'rotate-90')} />
              </div>
            </div>

            {/* Expanded detail */}
            {selected === doc.id && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed mb-3">{doc.preview}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Used by:</span>
                  {doc.usedBy.map(agent => (
                    <Badge key={agent} variant="secondary" className="text-[10px]">{agent}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
