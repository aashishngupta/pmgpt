'use client';

import { useState } from 'react';
import {
  Building2, Target, FileText, Zap, Users, Bot, ChevronDown, Check, Info,
  Plus, Trash2, Save, RefreshCw,
} from 'lucide-react';
import {
  DEFAULT_WORKSPACE_CONFIG,
  FRAMEWORK_PRESETS,
  STORY_FORMAT_TEMPLATES,
  PRD_SECTION_LIBRARY,
  type WorkspaceConfig,
  type PrioritizationFramework,
  type StoryFormat,
  type PRDFormat,
} from '@/lib/workspace-config';

// ── Shared UI primitives ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{children}</p>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
      {children}
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{children}</label>
      {hint && (
        <div className="group relative">
          <Info className="w-3 h-3 text-slate-300 cursor-help" />
          <div className="absolute left-0 top-5 z-10 hidden group-hover:block w-56 bg-slate-800 text-white text-[11px] rounded-lg p-2.5 shadow-xl">
            {hint}
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all ${className}`}
    />
  );
}

function Select<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="w-full appearance-none px-3 py-2 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all pr-8"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-slate-700">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}

function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: 'slate' | 'blue' | 'green' | 'amber' }) {
  const colors = { slate: 'bg-slate-100 text-slate-600', blue: 'bg-blue-100 text-blue-700', green: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700' };
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${colors[color]}`}>{children}</span>;
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'team',            label: 'Team Profile',       icon: Building2 },
  { id: 'prioritization',  label: 'Prioritization',     icon: Target     },
  { id: 'documentation',   label: 'Docs & Jira',        icon: FileText   },
  { id: 'planning',        label: 'Planning',           icon: Zap        },
  { id: 'stakeholders',    label: 'Stakeholders',       icon: Users      },
  { id: 'agents',          label: 'Agent Defaults',     icon: Bot        },
] as const;

type TabId = typeof TABS[number]['id'];

// ── Saved banner ──────────────────────────────────────────────────────────────

function SavedBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-[13px] font-medium animate-fade-in">
      <Check className="w-4 h-4 text-emerald-400" />
      Workspace config saved
    </div>
  );
}

// ── Tab: Team Profile ─────────────────────────────────────────────────────────

function TeamTab({ config, setConfig }: { config: WorkspaceConfig; setConfig: (c: WorkspaceConfig) => void }) {
  const stages: { value: WorkspaceConfig['stage']; label: string }[] = [
    { value: 'pre-seed', label: 'Pre-seed' }, { value: 'seed', label: 'Seed' },
    { value: 'series-a', label: 'Series A' }, { value: 'series-b', label: 'Series B' },
    { value: 'series-c', label: 'Series C' }, { value: 'growth', label: 'Growth / Late' },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Company</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel hint="Used by all agents to personalise output">Company name</FieldLabel>
            <Input value={config.companyName} onChange={v => setConfig({ ...config, companyName: v })} placeholder="e.g. Acme Corp" />
          </div>
          <div>
            <FieldLabel hint="Helps agents calibrate strategy and risk tolerance">Stage</FieldLabel>
            <Select value={config.stage} onChange={v => setConfig({ ...config, stage: v })} options={stages} />
          </div>
          <div className="col-span-2">
            <FieldLabel hint="Used by Docs and Strategy agents to target the right user">ICP (Ideal Customer Profile)</FieldLabel>
            <Input value={config.icp} onChange={v => setConfig({ ...config, icp: v })} placeholder="e.g. PM teams at Series A–C B2B SaaS, 5–50 engineers" />
          </div>
          <div>
            <FieldLabel>Team size</FieldLabel>
            <Input value={String(config.teamSize)} onChange={v => setConfig({ ...config, teamSize: Number(v) || 0 })} placeholder="e.g. 12" />
          </div>
          <div>
            <FieldLabel>Number of PMs</FieldLabel>
            <Input value={String(config.pmCount)} onChange={v => setConfig({ ...config, pmCount: Number(v) || 0 })} placeholder="e.g. 3" />
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Product areas</SectionLabel>
        <p className="text-[12px] text-slate-500 mb-3">Used by Docs and Strategy agents to scope work to the right domain.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {config.planning.productAreas.map(area => (
            <div key={area} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[12px] text-slate-700">
              {area}
              <button onClick={() => setConfig({ ...config, planning: { ...config.planning, productAreas: config.planning.productAreas.filter(a => a !== area) } })}>
                <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-400" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const area = prompt('Product area name:');
              if (area?.trim()) setConfig({ ...config, planning: { ...config.planning, productAreas: [...config.planning.productAreas, area.trim()] } });
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-[12px] text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add area
          </button>
        </div>
      </Card>

      <Card>
        <SectionLabel>Persona library</SectionLabel>
        <p className="text-[12px] text-slate-500 mb-3">Docs agent uses these personas when generating user stories and PRDs.</p>
        <div className="space-y-3">
          {config.planning.personas.map((p, i) => (
            <div key={p.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-semibold text-slate-800">{p.name}</p>
                <div className="flex items-center gap-2">
                  <Badge color={p.tech_savviness === 'high' ? 'blue' : p.tech_savviness === 'medium' ? 'amber' : 'slate'}>
                    Tech: {p.tech_savviness}
                  </Badge>
                  <button onClick={() => setConfig({ ...config, planning: { ...config.planning, personas: config.planning.personas.filter((_, j) => j !== i) } })}>
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
              <p className="text-[12px] text-slate-500">{p.role} — {p.company_type}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.pain_points.map(pp => <span key={pp} className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded">{pp}</span>)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Prioritization ───────────────────────────────────────────────────────

function PrioritizationTab({ config, setConfig }: { config: WorkspaceConfig; setConfig: (c: WorkspaceConfig) => void }) {
  const frameworks: { value: PrioritizationFramework; label: string }[] = [
    { value: 'RICE',     label: 'RICE — Reach × Impact × Confidence / Effort' },
    { value: 'ICE',      label: 'ICE — Impact × Confidence × Ease'            },
    { value: 'MoSCoW',   label: 'MoSCoW — Must / Should / Could / Won\'t'     },
    { value: 'Kano',     label: 'Kano — Basic / Performance / Delighter'      },
    { value: 'SPADE',    label: 'SPADE — Setting / People / Alternatives…'    },
    { value: 'Weighted', label: 'Weighted Score (custom factors)'              },
    { value: 'Custom',   label: 'Custom (define your own factors)'            },
  ];

  const handleFrameworkChange = (fw: PrioritizationFramework) => {
    setConfig({ ...config, prioritization: { ...config.prioritization, framework: fw, factors: FRAMEWORK_PRESETS[fw] ?? [] } });
  };

  const totalWeight = config.prioritization.factors.reduce((s, f) => s + f.weight, 0);

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Framework</SectionLabel>
        <p className="text-[12px] text-slate-500 mb-4">The Prioritization agent uses this framework for every scoring request. Switching presets auto-populates factors below.</p>
        <Select value={config.prioritization.framework} onChange={handleFrameworkChange} options={frameworks} />
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Factors & weights</SectionLabel>
          <div className={`text-[12px] font-semibold px-2 py-0.5 rounded ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
            {totalWeight}/100
          </div>
        </div>
        {config.prioritization.factors.length === 0 && (
          <p className="text-[12px] text-slate-400 italic">No factors defined. Select a preset above or add custom factors.</p>
        )}
        <div className="space-y-3">
          {config.prioritization.factors.map((f, i) => (
            <div key={f.key} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-slate-800">{f.label}</p>
                <p className="text-[11px] text-slate-400">{f.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {f.inverted && <Badge color="amber">Inverted</Badge>}
                <input
                  type="number" min={0} max={100}
                  value={f.weight}
                  onChange={e => {
                    const factors = [...config.prioritization.factors];
                    factors[i] = { ...f, weight: Number(e.target.value) };
                    setConfig({ ...config, prioritization: { ...config.prioritization, factors } });
                  }}
                  className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 text-[13px] text-right focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
                <span className="text-[12px] text-slate-400">%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Decision rules</SectionLabel>
        <div className="space-y-4">
          <div>
            <FieldLabel hint="When two items score the same, this rule breaks the tie">Tiebreaker rule</FieldLabel>
            <Input
              value={config.prioritization.tiebreaker}
              onChange={v => setConfig({ ...config, prioritization: { ...config.prioritization, tiebreaker: v } })}
              placeholder="e.g. Strategic alignment always wins in a tie"
            />
          </div>
          <div>
            <FieldLabel hint="Roles that can override a prioritization decision">Override authority</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {(['viewer', 'pm', 'pm_lead', 'admin'] as const).map(role => {
                const active = config.prioritization.overrideRoles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => {
                      const roles = active
                        ? config.prioritization.overrideRoles.filter(r => r !== role)
                        : [...config.prioritization.overrideRoles, role];
                      setConfig({ ...config, prioritization: { ...config.prioritization, overrideRoles: roles } });
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Sales request thresholds</SectionLabel>
        <p className="text-[12px] text-slate-500 mb-4">Deal values that trigger different escalation paths for sales feature requests.</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'autoScore', label: 'Auto-score', hint: 'Score automatically without PM review' },
            { key: 'escalate',  label: 'Escalate to PM Lead', hint: 'Route to PM Lead for decision' },
            { key: 'executive', label: 'Executive loop-in', hint: 'CEO / C-suite must be involved' },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <FieldLabel hint={hint}>{label}</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">$</span>
                <input
                  type="number"
                  value={(config.stakeholders.dealValueThresholds as Record<string, number>)[key]}
                  onChange={e => setConfig({ ...config, stakeholders: { ...config.stakeholders, dealValueThresholds: { ...config.stakeholders.dealValueThresholds, [key]: Number(e.target.value) } } })}
                  className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Documentation & Jira ─────────────────────────────────────────────────

function DocumentationTab({ config, setConfig }: { config: WorkspaceConfig; setConfig: (c: WorkspaceConfig) => void }) {
  const prdFormats: { value: PRDFormat; label: string }[] = [
    { value: 'two-pager', label: '2-Pager (fast, lean)'   },
    { value: 'full-spec', label: 'Full Spec (comprehensive)' },
    { value: 'lean',      label: 'Lean (problem + metric only)' },
    { value: 'custom',    label: 'Custom (choose sections)' },
  ];
  const storyFormats: { value: StoryFormat; label: string }[] = [
    { value: 'user-story', label: 'User Story — As a [persona], I want [action] so that [outcome]' },
    { value: 'bdd',        label: 'BDD — Given [context], When [action], Then [outcome]'           },
    { value: 'job-story',  label: 'Job Story — When [situation], I want to [motivation]…'          },
    { value: 'custom',     label: 'Custom template'                                                 },
  ];
  const scales: { value: import('@/lib/workspace-config').StoryPointScale; label: string }[] = [
    { value: 'fibonacci', label: 'Fibonacci (1, 2, 3, 5, 8, 13…)' },
    { value: '1-5',       label: '1–5 scale'                       },
    { value: 'tshirt',    label: 'T-shirt (XS, S, M, L, XL)'      },
    { value: 'days',      label: 'Days (raw estimate)'             },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>PRD format</SectionLabel>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <FieldLabel hint="Docs agent uses this format as the default PRD structure">Default format</FieldLabel>
            <Select value={config.documentation.prdFormat} onChange={v => setConfig({ ...config, documentation: { ...config.documentation, prdFormat: v } })} options={prdFormats} />
          </div>
          <div>
            <FieldLabel hint="Where PRDs are published by default">Publish destination</FieldLabel>
            <Select
              value={config.documentation.publishDestination}
              onChange={v => setConfig({ ...config, documentation: { ...config.documentation, publishDestination: v } })}
              options={[{ value: 'notion', label: 'Notion' }, { value: 'confluence', label: 'Confluence' }, { value: 'gdrive', label: 'Google Docs' }]}
            />
          </div>
        </div>
        <div>
          <FieldLabel hint="All success metrics generated by any agent will follow this format">Success metric format</FieldLabel>
          <Input
            value={config.documentation.successMetricFormat}
            onChange={v => setConfig({ ...config, documentation: { ...config.documentation, successMetricFormat: v } })}
            placeholder="{metric} improves from {baseline} to {target} by {date}"
          />
        </div>
        <div className="mt-4">
          <FieldLabel>PRD sections</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-1">
            {PRD_SECTION_LIBRARY.map(s => {
              const active = config.documentation.prdSections.includes(s.key);
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    const sections = active
                      ? config.documentation.prdSections.filter(k => k !== s.key)
                      : [...config.documentation.prdSections, s.key];
                    setConfig({ ...config, documentation: { ...config.documentation, prdSections: sections } });
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'} ${s.required ? 'cursor-default opacity-80' : ''}`}
                  disabled={s.required}
                  title={s.required ? 'Required — cannot be removed' : ''}
                >
                  {s.label} {s.required && <span className="text-slate-400">*</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">* Required sections cannot be removed</p>
        </div>
      </Card>

      <Card>
        <SectionLabel>Jira / ticketing</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Project key</FieldLabel>
            <Input value={config.jira.projectKey} onChange={v => setConfig({ ...config, jira: { ...config.jira, projectKey: v.toUpperCase() } })} placeholder="e.g. PMGPT" />
          </div>
          <div>
            <FieldLabel hint="Format applied to all user stories generated by Docs agent">Story format</FieldLabel>
            <Select value={config.jira.storyFormat} onChange={v => setConfig({ ...config, jira: { ...config.jira, storyFormat: v } })} options={storyFormats} />
          </div>
          <div className="col-span-2">
            <FieldLabel>Story format preview</FieldLabel>
            <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[12px] text-slate-500 font-mono">
              {STORY_FORMAT_TEMPLATES[config.jira.storyFormat] || 'Custom template — define in custom template field below'}
            </div>
          </div>
          <div>
            <FieldLabel>Story point scale</FieldLabel>
            <Select value={config.jira.storyPointScale} onChange={v => setConfig({ ...config, jira: { ...config.jira, storyPointScale: v } })} options={scales} />
          </div>
          <div>
            <FieldLabel>Epic structure</FieldLabel>
            <Input value={config.jira.epicStructure} onChange={v => setConfig({ ...config, jira: { ...config.jira, epicStructure: v } })} placeholder="e.g. Feature → Epic → Story → Sub-task" />
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel hint="Docs agent will include these fields in every generated ticket">Required fields</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-1">
            {config.jira.requiredFields.map(f => (
              <div key={f} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[12px] text-blue-700 font-medium">
                {f}
                <button onClick={() => setConfig({ ...config, jira: { ...config.jira, requiredFields: config.jira.requiredFields.filter(rf => rf !== f) } })}>
                  <Trash2 className="w-3 h-3 text-blue-400 hover:text-red-400" />
                </button>
              </div>
            ))}
            <button
              onClick={() => { const f = prompt('Field name:'); if (f?.trim()) setConfig({ ...config, jira: { ...config.jira, requiredFields: [...config.jira.requiredFields, f.trim()] } }); }}
              className="px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-[12px] text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add field
            </button>
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel hint="Labels agents can apply when creating or updating Jira tickets">Label taxonomy</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-1">
            {config.jira.labelTaxonomy.map(l => (
              <div key={l} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[12px] text-slate-600">
                {l}
                <button onClick={() => setConfig({ ...config, jira: { ...config.jira, labelTaxonomy: config.jira.labelTaxonomy.filter(ll => ll !== l) } })}>
                  <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-400" />
                </button>
              </div>
            ))}
            <button
              onClick={() => { const l = prompt('Label:'); if (l?.trim()) setConfig({ ...config, jira: { ...config.jira, labelTaxonomy: [...config.jira.labelTaxonomy, l.trim()] } }); }}
              className="px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-[12px] text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add label
            </button>
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel hint="Agents use the DoD checklist when evaluating release readiness">Definition of Done</FieldLabel>
          <div className="space-y-2 mt-1">
            {config.jira.definitionOfDone.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[13px] text-slate-700 flex-1">{d}</span>
                <button onClick={() => setConfig({ ...config, jira: { ...config.jira, definitionOfDone: config.jira.definitionOfDone.filter((_, j) => j !== i) } })}>
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                </button>
              </div>
            ))}
            <button
              onClick={() => { const d = prompt('DoD item:'); if (d?.trim()) setConfig({ ...config, jira: { ...config.jira, definitionOfDone: [...config.jira.definitionOfDone, d.trim()] } }); }}
              className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add item
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Planning ─────────────────────────────────────────────────────────────

function PlanningTab({ config, setConfig }: { config: WorkspaceConfig; setConfig: (c: WorkspaceConfig) => void }) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Sprint configuration</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel hint="Ops agent uses this for sprint planning and summaries">Sprint cadence</FieldLabel>
            <Select
              value={String(config.planning.sprintCadence) as '1' | '2' | '3'}
              onChange={v => setConfig({ ...config, planning: { ...config.planning, sprintCadence: Number(v) as 1 | 2 | 3 } })}
              options={[{ value: '1', label: '1 week' }, { value: '2', label: '2 weeks' }, { value: '3', label: '3 weeks' }]}
            />
          </div>
          <div>
            <FieldLabel hint="Rolling sprint window for velocity calculation">Velocity window</FieldLabel>
            <Select
              value={String(config.planning.velocityWindow)}
              onChange={v => setConfig({ ...config, planning: { ...config.planning, velocityWindow: Number(v) } })}
              options={[{ value: '2', label: 'Last 2 sprints' }, { value: '4', label: 'Last 4 sprints' }, { value: '6', label: 'Last 6 sprints' }]}
            />
          </div>
          <div className="col-span-2">
            <FieldLabel hint="Sprint names agents generate will follow this pattern">Sprint naming format</FieldLabel>
            <Input
              value={config.planning.sprintNamingFormat}
              onChange={v => setConfig({ ...config, planning: { ...config.planning, sprintNamingFormat: v } })}
              placeholder="e.g. Sprint {number} — {theme}"
            />
            <p className="text-[11px] text-slate-400 mt-1">Preview: Sprint 24 — Activation & Onboarding</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>OKR configuration</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel hint="How OKR scores are expressed">OKR scoring format</FieldLabel>
            <Select
              value={config.planning.okrFormat}
              onChange={v => setConfig({ ...config, planning: { ...config.planning, okrFormat: v } })}
              options={[
                { value: 'google-0-1',   label: 'Google 0.0–1.0 (0.7 = success)'        },
                { value: 'percentage',   label: 'Percentage (70% = success)'              },
                { value: 'rag',          label: 'RAG — Red / Amber / Green'              },
                { value: 'binary',       label: 'Binary — Hit / Miss'                    },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Check-in cadence</FieldLabel>
            <Select
              value={config.planning.okrCheckInCadence}
              onChange={v => setConfig({ ...config, planning: { ...config.planning, okrCheckInCadence: v } })}
              options={[{ value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Bi-weekly' }, { value: 'monthly', label: 'Monthly' }]}
            />
          </div>
        </div>
        <div className="mt-4">
          <FieldLabel hint="OKR levels from company → team → individual">OKR hierarchy</FieldLabel>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {config.planning.okrLevels.map((level, i) => (
              <div key={level.id} className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[12px] font-medium text-slate-700">{level.label}</span>
                {i < config.planning.okrLevels.length - 1 && <span className="text-slate-300">→</span>}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Stakeholders ─────────────────────────────────────────────────────────

function StakeholdersTab({ config, setConfig }: { config: WorkspaceConfig; setConfig: (c: WorkspaceConfig) => void }) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Stakeholder map</SectionLabel>
        <p className="text-[12px] text-slate-500 mb-4">Agents use this to weight stakeholder requests and route escalations correctly.</p>
        <div className="space-y-3">
          {config.stakeholders.stakeholders.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-800">{s.name}</p>
                <p className="text-[12px] text-slate-500">{s.role}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.domains.map(d => <span key={d} className="text-[11px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{d}</span>)}
                </div>
              </div>
              <Badge color={s.influence === 'high' ? 'blue' : s.influence === 'medium' ? 'amber' : 'slate'}>
                {s.influence} influence
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Slack channels</SectionLabel>
        <p className="text-[12px] text-slate-500 mb-4">Ops and GTM agents post to these channels by default.</p>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(config.stakeholders.slackChannels).map(([key, value]) => (
            <div key={key}>
              <FieldLabel>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</FieldLabel>
              <Input
                value={value}
                onChange={v => setConfig({ ...config, stakeholders: { ...config.stakeholders, slackChannels: { ...config.stakeholders.slackChannels, [key]: v } } })}
                placeholder={`e.g. #${key}`}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Escalation paths</SectionLabel>
        <div className="space-y-5">
          {[
            { key: 'salesEscalation' as const, label: 'Sales feature request escalation' },
            { key: 'customerEscalation' as const, label: 'Customer churn risk escalation' },
          ].map(({ key, label }) => {
            const path = config.stakeholders[key];
            return (
              <div key={key}>
                <p className="text-[13px] font-semibold text-slate-800 mb-2">{label}</p>
                <div className="space-y-1.5">
                  {path.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-[12px] text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Agent Defaults ───────────────────────────────────────────────────────

function AgentDefaultsTab({ config, setConfig }: { config: WorkspaceConfig; setConfig: (c: WorkspaceConfig) => void }) {
  const agentList = [
    { id: 'strategy',             name: 'Strategy Copilot',       icon: '🎯' },
    { id: 'docs',                 name: 'Docs Copilot',           icon: '📄' },
    { id: 'analytics',            name: 'Analytics Copilot',      icon: '📊' },
    { id: 'research',             name: 'Research Copilot',       icon: '🔍' },
    { id: 'ops',                  name: 'Ops Copilot',            icon: '⚡' },
    { id: 'prioritization',       name: 'Prioritization',         icon: '⚖️' },
    { id: 'competitive',          name: 'Competitive Intel',      icon: '🏆' },
    { id: 'market',               name: 'Market Intelligence',    icon: '🌐' },
    { id: 'social_signal',        name: 'Social Signal',          icon: '📡' },
    { id: 'signal_aggregator',    name: 'Signal Aggregator',      icon: '🧲' },
    { id: 'research_orchestrator',name: 'Research Orchestrator',  icon: '🔭' },
    { id: 'gtm',                  name: 'GTM Planner',            icon: '📣' },
    { id: 'release',              name: 'Release Manager',        icon: '🚀' },
    { id: 'sales',                name: 'Sales Enablement',       icon: '💼' },
    { id: 'engineering',          name: 'Engineering Copilot',    icon: '🔧' },
    { id: 'review',               name: 'Review Agent',           icon: '🔍' },
    { id: 'coach',                name: 'PM Coach',               icon: '🎓' },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-[12px] text-slate-500">Override trust levels and approval gates for each agent. Changes apply workspace-wide.</p>
      </div>
      {agentList.map(agent => {
        const defaults = config.agentDefaults[agent.id as keyof typeof config.agentDefaults] ?? { enabled: true, approvalGate: 'always' };
        return (
          <Card key={agent.id} className="py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-lg">{agent.icon}</span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-800">{agent.name}</p>
              </div>
              <Toggle
                value={defaults.enabled}
                onChange={v => setConfig({ ...config, agentDefaults: { ...config.agentDefaults, [agent.id]: { ...defaults, enabled: v } } })}
                label=""
              />
              <Select
                value={defaults.approvalGate}
                onChange={v => setConfig({ ...config, agentDefaults: { ...config.agentDefaults, [agent.id]: { ...defaults, approvalGate: v } } })}
                options={[
                  { value: 'always',        label: 'Always approve write actions' },
                  { value: 'high-risk-only',label: 'Approve high-risk only'        },
                  { value: 'never',         label: 'Fully autonomous'              },
                ]}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<TabId>('team');
  const [config, setConfig] = useState<WorkspaceConfig>(DEFAULT_WORKSPACE_CONFIG);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Persist to localStorage until backend is ready
    try { localStorage.setItem('pmgpt_workspace_config', JSON.stringify(config)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm('Reset workspace config to defaults?')) setConfig(DEFAULT_WORKSPACE_CONFIG);
  };

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[20px] font-black text-slate-900 tracking-tight">Workspace Intelligence Profile</h1>
            <p className="text-[13px] text-slate-500 mt-1">
              Every agent reads this config before acting. The more you fill in, the smarter every output gets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              <Save className="w-3.5 h-3.5" /> Save changes
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar tabs */}
        <div className="w-52 flex-shrink-0 bg-white border-r border-slate-200 p-4 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${active ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl">
            {activeTab === 'team'           && <TeamTab           config={config} setConfig={setConfig} />}
            {activeTab === 'prioritization' && <PrioritizationTab config={config} setConfig={setConfig} />}
            {activeTab === 'documentation'  && <DocumentationTab  config={config} setConfig={setConfig} />}
            {activeTab === 'planning'       && <PlanningTab       config={config} setConfig={setConfig} />}
            {activeTab === 'stakeholders'   && <StakeholdersTab   config={config} setConfig={setConfig} />}
            {activeTab === 'agents'         && <AgentDefaultsTab  config={config} setConfig={setConfig} />}
          </div>
        </div>
      </div>

      <SavedBanner show={saved} />
    </div>
  );
}
