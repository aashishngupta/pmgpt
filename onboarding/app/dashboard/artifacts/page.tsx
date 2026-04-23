'use client';

import { FolderOpen, FileText, BarChart2, Layers, Plus } from 'lucide-react';

const MOCK = [
  { id: 1, title: 'Mobile Onboarding Redesign PRD',   kind: 'PRD',      agent: 'Docs Copilot',    status: 'draft',     updated: '2h ago'   },
  { id: 2, title: 'Q2 Activation Drop Analysis',      kind: 'Analysis', agent: 'Analytics Intel', status: 'published', updated: 'Yesterday' },
  { id: 3, title: 'Sprint 24 Stakeholder Summary',    kind: 'Report',   agent: 'Ops Automation',  status: 'published', updated: '3d ago'    },
  { id: 4, title: 'Productboard Competitive Battlecard', kind: 'Report', agent: 'Competitive Intel', status: 'draft',  updated: '5d ago'    },
];

const KIND_ICON: Record<string, React.ElementType> = {
  PRD: FileText, Analysis: BarChart2, Report: Layers,
};

export default function ArtifactsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-brand-ink tracking-tight">Artifacts</h1>
          <p className="text-[14px] text-brand-ink-3 mt-0.5">PRDs, analyses, and reports created with your agents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-white text-[13px] font-semibold hover:bg-brand-accent-dim transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New artifact
        </button>
      </div>

      {MOCK.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="w-12 h-12 text-brand-ink-4 mb-4" />
          <h2 className="text-[16px] font-semibold text-brand-ink mb-2">No artifacts yet</h2>
          <p className="text-[14px] text-brand-ink-3 max-w-sm">Start a conversation with any agent and publish the output here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {MOCK.map(a => {
            const Icon = KIND_ICON[a.kind] ?? FileText;
            return (
              <div key={a.id} className="flex items-center gap-4 p-4 bg-brand-surface border border-brand-line rounded-xl hover:border-brand-accent/30 hover:shadow-sm transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-brand-accent-bg border border-brand-accent/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-brand-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-brand-ink group-hover:text-brand-accent transition-colors truncate">{a.title}</p>
                  <p className="text-[12px] text-brand-ink-3 mt-0.5">{a.agent} · {a.updated}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[11px] font-medium text-brand-ink-3 bg-brand-elevated px-2 py-0.5 rounded">{a.kind}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${a.status === 'published' ? 'bg-brand-green-bg text-brand-green' : 'bg-brand-amber-bg text-brand-amber'}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
