'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOLS = [
  { id: 'Jira',             icon: '🔵', desc: 'Issue tracking'       },
  { id: 'Linear',           icon: '⚫', desc: 'Project management'   },
  { id: 'Notion',           icon: '⬜', desc: 'Docs & wikis'         },
  { id: 'Confluence',       icon: '🔷', desc: 'Knowledge base'       },
  { id: 'Slack',            icon: '💬', desc: 'Team comms'           },
  { id: 'Amplitude',        icon: '📈', desc: 'Product analytics'    },
  { id: 'Mixpanel',         icon: '🔮', desc: 'Event analytics'      },
  { id: 'Intercom',         icon: '💙', desc: 'Customer support'     },
  { id: 'Zendesk',          icon: '🟢', desc: 'Support tickets'      },
  { id: 'Figma',            icon: '🎨', desc: 'Design'               },
  { id: 'Google Workspace', icon: '🌈', desc: 'Docs & Drive'         },
  { id: 'GitHub',           icon: '🐙', desc: 'Code & PRs'           },
];

export default function ToolsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">

      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-8 bg-white border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} />
          <span className="font-bold text-[15px] text-slate-900 tracking-tight">pmGPT</span>
        </Link>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-slate-100 px-8 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {['Create account', 'Workspace setup', 'Connect tools'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                i < 2 ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {i < 2 ? '✓' : i + 1}
              </div>
              <span className={`text-[12px] font-medium truncate ${i === 2 ? 'text-slate-800' : 'text-slate-400'}`}>
                {label}
              </span>
              {i < 2 && <div className="h-px flex-1 bg-blue-200 ml-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-[26px] font-black text-slate-900 mb-1.5 tracking-tight">
              Which tools does your team use?
            </h1>
            <p className="text-[14px] text-slate-500">
              We'll suggest the right connectors — you can enable them later in Settings.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {TOOLS.map(tool => {
              const on = selected.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  onClick={() => toggle(tool.id)}
                  className={cn(
                    'relative rounded-2xl border-2 p-4 text-left transition-all',
                    on
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                  )}
                >
                  {on && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <div className="text-2xl mb-2">{tool.icon}</div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">{tool.id}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{tool.desc}</div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[15px] font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.01]"
          >
            {selected.length > 0
              ? `Launch pmGPT with ${selected.length} tool${selected.length > 1 ? 's' : ''}`
              : 'Launch pmGPT'
            }
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-[12px] text-slate-400 mt-4">
            Connect and configure tools anytime in{' '}
            <span className="text-slate-600 font-medium">Settings → Sources</span>
          </p>
        </div>
      </div>
    </div>
  );
}
