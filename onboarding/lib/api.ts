import { getAuthHeader } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface ChatMessage { role: 'user' | 'assistant'; content: string }

export interface ChatRequest {
  query: string;
  agent?: string;
  llm_mode?: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  agent: string;
  intent_detected: string;
  response: string;
  sources: { title: string; url: string; connector: string }[];
}

export interface Thread {
  id: string;
  title: string;
  agent_id: string;
  status: 'draft' | 'published' | 'archived';
  artifact_type?: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  source_agent: string;
  alert_type: string;
  title: string;
  body: string;
  action_url?: string;
  action_label?: string;
  created_at: string;
}

export interface AgentConfigData {
  enabled?: boolean;
  llm?: string;
  temperature?: number;
  max_tokens?: number;
  min_role?: string;
  memory_enabled?: boolean;
  system_prompt?: string;
  behaviors?: string;
  personality?: string;
  connectors?: string;
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  chat:           (body: ChatRequest) => req<ChatResponse>('/chat', { method: 'POST', body: JSON.stringify(body) }),
  health:         ()                  => req<Record<string, unknown>>('/health'),
  connectors:     ()                  => req<Record<string, unknown>>('/connectors'),
  ragStatus:      ()                  => req<Record<string, unknown>>('/rag/status'),
  ragSync:        (connector?: string, force = false) =>
    req('/rag/sync' + (connector ? `?connector=${connector}&force=${force}` : `?force=${force}`), { method: 'POST' }),

  // Threads (persistent chat sessions)
  threads: {
    list:     (agent_id?: string)    => req<Thread[]>('/threads' + (agent_id ? `?agent_id=${agent_id}` : '')),
    create:   (body: { agent_id: string; title?: string; artifact_type?: string }) =>
      req<Thread>('/threads', { method: 'POST', body: JSON.stringify(body) }),
    messages: (thread_id: string)   => req<{ role: string; content: string; ts: string }[]>(`/threads/${thread_id}/messages`),
    chat:     (thread_id: string, body: ChatRequest) =>
      req<ChatResponse>(`/threads/${thread_id}/messages`, { method: 'POST', body: JSON.stringify(body) }),
    delete:   (thread_id: string) => req(`/threads/${thread_id}`, { method: 'DELETE' }),
  },

  // Workspace memory
  memory: {
    get:    ()    => req<Record<string, string>>('/workspace/memory'),
    update: (body: Record<string, string>) =>
      req('/workspace/memory', { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Agent config
  agents: {
    configs:   ()             => req<Record<string, AgentConfigData>>('/agents/config'),
    getConfig: (id: string)   => req<AgentConfigData>(`/agents/config/${id}`),
    saveConfig: (id: string, body: AgentConfigData) =>
      req(`/agents/config/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Alerts
  alerts: {
    list:    ()             => req<Alert[]>('/alerts'),
    create:  (body: Omit<Alert, 'id' | 'created_at'>) =>
      req<{ id: string }>('/alerts', { method: 'POST', body: JSON.stringify(body) }),
    dismiss: (id: string)  => req(`/alerts/${id}/dismiss`, { method: 'PATCH' }),
  },

  // Jira write (human-in-loop)
  jira: {
    create: (body: { project_key: string; summary: string; description: string; issue_type?: string; priority?: string; labels?: string[] }) =>
      req<{ key: string; url: string }>('/jira/create', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Artifact memory
  artifacts: {
    getMemory:    (thread_id: string) => req(`/artifacts/memory/${thread_id}`),
    createMemory: (body: { thread_id: string; artifact_type: string; title: string; summary: string; decisions?: string; open_questions?: string; key_context?: string; external_id?: string }) =>
      req<{ id: string }>('/artifacts/memory', { method: 'POST', body: JSON.stringify(body) }),
  },
};
