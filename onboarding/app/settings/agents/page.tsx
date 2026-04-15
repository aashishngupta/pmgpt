'use client';

import { useState } from 'react';
import { AGENTS, Agent } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const LLM_MODELS = [
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic', recommended: true },
  { id: 'claude-3-opus',     label: 'Claude 3 Opus',     provider: 'Anthropic' },
  { id: 'gpt-4o',            label: 'GPT-4o',            provider: 'OpenAI' },
  { id: 'gpt-4o-mini',       label: 'GPT-4o Mini',       provider: 'OpenAI' },
  { id: 'gemini-1.5-pro',    label: 'Gemini 1.5 Pro',    provider: 'Google' },
  { id: 'gemini-flash',      label: 'Gemini Flash',      provider: 'Google' },
  { id: 'mistral-local',     label: 'Mistral (local)',   provider: 'Ollama' },
];

const OUTPUT_FORMATS = ['Markdown', 'Structured doc', 'Bullet points', 'Executive summary', 'Slide outline'];
const TONALITY_OPTIONS = ['Professional', 'Concise', 'Detailed', 'Executive', 'Collaborative', 'Mentoring'];
const SCOPE_OPTIONS = ['All workspaces', 'My workspace only', 'Shared templates', 'Personal only'];

const AGENT_DEFAULTS: Record<string, { model: string; format: string; tonality: string; scope: string; context: number }> = {
  strategy:  { model: 'claude-3-5-sonnet', format: 'Markdown',        tonality: 'Executive',     scope: 'All workspaces',    context: 20 },
  docs:      { model: 'claude-3-5-sonnet', format: 'Structured doc',  tonality: 'Professional',  scope: 'All workspaces',    context: 30 },
  analytics: { model: 'gpt-4o',            format: 'Bullet points',   tonality: 'Concise',       scope: 'My workspace only', context: 15 },
  research:  { model: 'gemini-1.5-pro',    format: 'Markdown',        tonality: 'Detailed',      scope: 'All workspaces',    context: 25 },
  review:    { model: 'claude-3-5-sonnet', format: 'Bullet points',   tonality: 'Mentoring',     scope: 'Personal only',     context: 10 },
  ops:       { model: 'gpt-4o-mini',       format: 'Bullet points',   tonality: 'Collaborative', scope: 'All workspaces',    context: 10 },
};

export default function AgentsPage() {
  const [expanded, setExpanded] = useState<string | null>('strategy');
  const [configs, setConfigs] = useState(AGENT_DEFAULTS);

  const update = (agentId: string, field: string, value: string | number) => {
    setConfigs(prev => ({ ...prev, [agentId]: { ...prev[agentId], [field]: value } }));
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Agent Configuration</h1>
        <p className="text-slate-500 text-sm mt-1">Customize each agent's model, tone, and output format</p>
      </div>

      <div className="space-y-3">
        {AGENTS.map((agent: Agent) => {
          const isOpen = expanded === agent.id;
          const cfg = configs[agent.id];

          return (
            <div key={agent.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : agent.id)}
              >
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl flex-shrink-0', agent.color)}>
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm">{agent.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{agent.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-normal hidden sm:flex">
                    {LLM_MODELS.find(m => m.id === cfg.model)?.label || cfg.model}
                  </Badge>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />
                  }
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 p-5 space-y-5">

                  {/* LLM model */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                      LLM Model
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {LLM_MODELS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => update(agent.id, 'model', m.id)}
                          className={cn(
                            'flex items-center gap-2.5 p-2.5 rounded-lg border-2 text-left transition-all',
                            cfg.model === m.id
                              ? 'border-violet-400 bg-violet-50'
                              : 'border-slate-200 hover:border-slate-300'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={cn('text-xs font-medium truncate', cfg.model === m.id ? 'text-violet-700' : 'text-slate-700')}>
                              {m.label}
                            </div>
                            <div className="text-[10px] text-slate-400">{m.provider}</div>
                          </div>
                          {m.recommended && (
                            <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                              REC
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Output format */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                      Default output format
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {OUTPUT_FORMATS.map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => update(agent.id, 'format', fmt)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all',
                            cfg.format === fmt
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 text-slate-500 hover:border-violet-300'
                          )}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tonality */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                      Tonality
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TONALITY_OPTIONS.map(t => (
                        <button
                          key={t}
                          onClick={() => update(agent.id, 'tonality', t)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all',
                            cfg.tonality === t
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 text-slate-500 hover:border-violet-300'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scope */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                      Scope
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SCOPE_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => update(agent.id, 'scope', s)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all',
                            cfg.scope === s
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-slate-200 text-slate-500 hover:border-violet-300'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Context window slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Context memory
                      </label>
                      <span className="text-xs font-medium text-violet-700">{cfg.context} turns</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={cfg.context}
                      onChange={e => update(agent.id, 'context', Number(e.target.value))}
                      className="w-full accent-violet-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>5 turns</span>
                      <span>50 turns</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-violet-50 rounded-lg p-3">
                    <Info className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-violet-700">
                      Changes apply to new sessions. Active conversations use the previous config.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
