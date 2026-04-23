'use client';
import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExecutiveSummary      from './tabs/ExecutiveSummary';
import BusinessImpact        from './tabs/BusinessImpact';
import AutomationPerformance from './tabs/AutomationPerformance';
import AIObservability       from './tabs/AIObservability';
import IntegrationActivity   from './tabs/IntegrationActivity';
import WorkspaceIntelligence from './tabs/WorkspaceIntelligence';
import { AnalyticsCopilot }  from './components/AnalyticsCopilot';

type Tab   = 'summary' | 'impact' | 'automation' | 'observability' | 'integration' | 'workspace';
type Range = '7d' | '30d' | '90d';

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary',       label: 'Executive Summary'      },
  { id: 'impact',        label: 'Business Impact'        },
  { id: 'automation',    label: 'Automation Performance' },
  { id: 'observability', label: 'AI Observability'       },
  { id: 'integration',   label: 'Integration Activity'   },
  { id: 'workspace',     label: 'Workspace Intelligence' },
];

export default function AnalyticsPage() {
  const [tab,   setTab]   = useState<Tab>('summary');
  const [range, setRange] = useState<Range>('7d');

  return (
    <div className="flex-1 overflow-y-auto bg-brand-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-brand-bg border-b border-brand-line px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-brand-ink">Analytics</h1>
          <p className="text-[12px] text-brand-ink-2 mt-0.5">pmGPT workspace performance and AI health</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-brand-line overflow-hidden text-[12px] font-medium">
            {(['7d', '30d', '90d'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  range === r ? 'bg-brand-accent text-white' : 'text-brand-ink-2 hover:bg-brand-bg-2',
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-line text-[12px] text-brand-ink-2 hover:bg-brand-bg-2 transition-colors">
            <Calendar className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[57px] z-10 bg-brand-bg border-b border-brand-line px-8 flex items-center gap-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors',
              tab === t.id
                ? 'border-brand-accent text-brand-ink'
                : 'border-transparent text-brand-ink-2 hover:text-brand-ink hover:border-brand-line',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-8 py-6 pb-28">
        {tab === 'summary'       && <ExecutiveSummary      range={range} />}
        {tab === 'impact'        && <BusinessImpact        range={range} />}
        {tab === 'automation'    && <AutomationPerformance range={range} />}
        {tab === 'observability' && <AIObservability       range={range} />}
        {tab === 'integration'   && <IntegrationActivity   range={range} />}
        {tab === 'workspace'     && <WorkspaceIntelligence range={range} />}
      </div>

      {/* Global analytics copilot — accessible from any tab */}
      <AnalyticsCopilot currentTab={tab} dateRange={range} />
    </div>
  );
}
