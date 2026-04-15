'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AGENTS } from '@/lib/types';
import { UserPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PM_ROLES = [
  {
    id: 'cpo',
    title: 'CPO / VP Product',
    desc: 'Full access to all agents, org-wide strategy',
    color: 'from-violet-500 to-purple-600',
    defaultAgents: ['strategy', 'docs', 'analytics', 'research', 'review', 'ops'],
    tonality: 'Executive',
  },
  {
    id: 'head',
    title: 'Head of Product',
    desc: 'Strategy, roadmap, cross-team alignment',
    color: 'from-blue-500 to-indigo-600',
    defaultAgents: ['strategy', 'docs', 'analytics', 'research'],
    tonality: 'Strategic',
  },
  {
    id: 'senior-pm',
    title: 'Senior PM',
    desc: 'Full product lifecycle, mentoring junior PMs',
    color: 'from-emerald-500 to-teal-600',
    defaultAgents: ['strategy', 'docs', 'analytics', 'research', 'ops'],
    tonality: 'Professional',
  },
  {
    id: 'pm',
    title: 'PM',
    desc: 'Feature execution, story writing, sprint ops',
    color: 'from-orange-500 to-amber-600',
    defaultAgents: ['docs', 'ops'],
    tonality: 'Collaborative',
  },
  {
    id: 'aspiring',
    title: 'Aspiring PM',
    desc: 'Learning mode, interview prep, portfolio',
    color: 'from-pink-500 to-rose-600',
    defaultAgents: ['docs', 'review'],
    tonality: 'Mentoring',
  },
];

const TONALITY_OPTIONS = ['Executive', 'Strategic', 'Professional', 'Collaborative', 'Mentoring', 'Casual'];

export default function TeamRolesPage() {
  const [expanded, setExpanded] = useState<string | null>('cpo');
  const [roleAgents, setRoleAgents] = useState<Record<string, string[]>>(
    Object.fromEntries(PM_ROLES.map(r => [r.id, r.defaultAgents]))
  );
  const [roleTonality, setRoleTonality] = useState<Record<string, string>>(
    Object.fromEntries(PM_ROLES.map(r => [r.id, r.tonality]))
  );

  const toggleAgent = (roleId: string, agentId: string) => {
    setRoleAgents(prev => {
      const current = prev[roleId] || [];
      return {
        ...prev,
        [roleId]: current.includes(agentId)
          ? current.filter(a => a !== agentId)
          : [...current, agentId],
      };
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team & Roles</h1>
          <p className="text-slate-500 text-sm mt-1">Configure agent access and permissions by role</p>
        </div>
        <Link href="/settings/team/invite">
          <Button className="bg-violet-600 hover:bg-violet-700 gap-1.5">
            <UserPlus className="w-4 h-4" /> Invite member
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {PM_ROLES.map(role => {
          const isOpen = expanded === role.id;
          const agents = roleAgents[role.id] || [];
          const tonality = roleTonality[role.id] || role.tonality;

          return (
            <div key={role.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : role.id)}
              >
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex-shrink-0', role.color)} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm">{role.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{role.desc}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs hidden sm:flex">
                    {agents.length}/{AGENTS.length} agents
                  </Badge>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />
                  }
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 p-5 space-y-5">
                  {/* Agent toggles */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Agent access
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {AGENTS.map(agent => {
                        const enabled = agents.includes(agent.id);
                        return (
                          <button
                            key={agent.id}
                            onClick={() => toggleAgent(role.id, agent.id)}
                            className={cn(
                              'flex items-center gap-2.5 p-2.5 rounded-lg border-2 text-left transition-all',
                              enabled
                                ? 'border-violet-300 bg-violet-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            )}
                          >
                            <span className="text-base">{agent.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className={cn('text-xs font-medium leading-tight', enabled ? 'text-violet-700' : 'text-slate-600')}>
                                {agent.name}
                              </div>
                            </div>
                            <div className={cn(
                              'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                              enabled ? 'border-violet-500 bg-violet-500' : 'border-slate-300'
                            )}>
                              {enabled && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tonality */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Output tonality
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TONALITY_OPTIONS.map(t => (
                        <button
                          key={t}
                          onClick={() => setRoleTonality(prev => ({ ...prev, [role.id]: t }))}
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium border-2 transition-all',
                            tonality === t
                              ? 'border-violet-500 bg-violet-100 text-violet-700'
                              : 'border-slate-200 text-slate-500 hover:border-violet-300'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Permissions
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Create & edit documents', granted: true },
                        { label: 'Share with external stakeholders', granted: role.id !== 'aspiring' },
                        { label: 'Manage team members', granted: ['cpo', 'head'].includes(role.id) },
                        { label: 'Configure agents', granted: ['cpo', 'head', 'senior-pm'].includes(role.id) },
                        { label: 'Access billing & settings', granted: role.id === 'cpo' },
                      ].map(perm => (
                        <div key={perm.label} className="flex items-center gap-2.5">
                          <div className={cn(
                            'w-4 h-4 rounded flex items-center justify-center flex-shrink-0',
                            perm.granted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'
                          )}>
                            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                              {perm.granted
                                ? <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                : <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              }
                            </svg>
                          </div>
                          <span className={cn('text-xs', perm.granted ? 'text-slate-700' : 'text-slate-400')}>
                            {perm.label}
                          </span>
                        </div>
                      ))}
                    </div>
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
