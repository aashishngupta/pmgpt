'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { ChatMessage } from '@/lib/api';

const QUICK_PROMPTS = [
  'Summarize this week\'s performance',
  'Which agent is underperforming?',
  'What\'s our LLM cost trend?',
  'Are we getting ROI?',
  'Where are we losing time?',
  'What should I improve first?',
];

const TAB_CONTEXT: Record<string, string> = {
  summary:       'Executive Summary — workspace health, tasks shipped, hours saved, LLM spend, connector health, audit trail',
  impact:        'Business Impact — ROI story, tasks throughput, artifacts created, cost avoidance, approval rates, external actions',
  automation:    'Automation Performance — agent invocations, completion rates, workflow runs, step failures, abort rates',
  observability: 'AI Observability — LLM token usage, cost by model, prompt cache hits, RAG retrieval health, latency p50/p90/p99',
  integration:   'Integration Activity — Jira/Notion/Slack/GDrive actions, connector sync health, write action audit log',
  workspace:     'Workspace Intelligence — DAU/WAU/MAU, onboarding funnel, setup depth, agent adoption per user',
};

interface AnalyticsCopilotProps {
  currentTab: string;
  dateRange: string;
}

export function AnalyticsCopilot({ currentTab, dateRange }: AnalyticsCopilotProps) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(query: string) {
    if (!query.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const ctx = `You are the pmGPT Analytics Copilot. The user is on the ${TAB_CONTEXT[currentTab] ?? currentTab} tab. Date range: ${dateRange}. Analytics data is illustrative at this stage. Help the user understand what metrics mean, what to act on, and which tab has the answer they need.`;
      const res = await api.chat({
        query: `${ctx}\n\nUser: ${query}`,
        agent: 'analytics',
        history: messages,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Backend unavailable — try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-[13px] font-medium transition-all',
          open ? 'bg-brand-ink text-white' : 'bg-brand-accent text-white hover:bg-brand-accent/90',
        )}
      >
        {open ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        {open ? 'Close' : 'Ask Analytics'}
      </button>

      {open && (
        <div className="fixed bottom-[72px] right-6 z-50 w-[380px] h-[520px] bg-brand-surface border border-brand-line rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-brand-line bg-brand-bg-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-brand-accent flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-brand-ink">Analytics Copilot</div>
              <div className="text-[10px] text-brand-ink-2 truncate">{TAB_CONTEXT[currentTab]?.split('—')[0].trim()}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-[12px] text-brand-ink-2 text-center pt-2">Ask anything about your analytics data</p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {QUICK_PROMPTS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => send(q)}
                      className="text-left text-[11px] text-brand-ink-2 hover:text-brand-ink bg-brand-bg-2 hover:bg-brand-line rounded-lg px-2.5 py-2 transition-colors leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] text-[12px] leading-relaxed rounded-xl px-3 py-2',
                  m.role === 'user'
                    ? 'bg-brand-accent text-white rounded-br-sm'
                    : 'bg-brand-bg-2 text-brand-ink rounded-bl-sm',
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-brand-bg-2 rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-3.5 h-3.5 text-brand-ink-2 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-brand-line flex-shrink-0">
            <div className="flex items-center gap-2 bg-brand-bg-2 rounded-xl px-3 py-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                placeholder="Ask about any metric…"
                className="flex-1 bg-transparent text-[12px] text-brand-ink placeholder:text-brand-ink-2 outline-none"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="text-brand-accent disabled:opacity-30 hover:text-brand-accent/80 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
