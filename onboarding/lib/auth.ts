/**
 * Auth utilities — token storage, API calls, session management.
 * All tokens stored in localStorage (swap to httpOnly cookies for prod).
 *
 * Demo mode: when NEXT_PUBLIC_API_URL is not set (Vercel with no backend),
 * login/signup automatically fall back to a mock session so the frontend
 * is fully usable as a product demo without a running backend.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// Demo mode is active when no backend URL is configured.
// Can also be forced on with NEXT_PUBLIC_DEMO_MODE=true.
const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || BASE === '';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  workspace_id: string;
  workspace_name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: { id: string; name: string; email: string };
  workspace: { id: string; name: string; slug: string };
}

// ── Demo session factory ──────────────────────────────────────────────────────

function makeDemoTokens(name: string, email: string, company = 'My Workspace'): AuthTokens {
  const id = `demo-${Math.random().toString(36).slice(2, 10)}`;
  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    access_token:  `demo_access_${id}`,
    refresh_token: `demo_refresh_${id}`,
    user:      { id, name, email },
    workspace: { id: `ws-${id}`, name: company, slug },
  };
}

// ── Token storage ─────────────────────────────────────────────────────────────

const ACCESS_KEY  = 'pmgpt_access_token';
const REFRESH_KEY = 'pmgpt_refresh_token';
const USER_KEY    = 'pmgpt_user';
const WS_KEY      = 'pmgpt_workspace';

export const tokenStore = {
  save(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_KEY,  tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    localStorage.setItem(USER_KEY,    JSON.stringify(tokens.user));
    localStorage.setItem(WS_KEY,      JSON.stringify(tokens.workspace));
    document.cookie = `pmgpt_access_token=${tokens.access_token}; path=/; max-age=86400; SameSite=Lax`;
  },
  clear() {
    [ACCESS_KEY, REFRESH_KEY, USER_KEY, WS_KEY].forEach(k => localStorage.removeItem(k));
    document.cookie = 'pmgpt_access_token=; path=/; max-age=0';
  },
  getAccess():   string | null { return localStorage.getItem(ACCESS_KEY); },
  getRefresh():  string | null { return localStorage.getItem(REFRESH_KEY); },
  getUser():     AuthTokens['user'] | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  getWorkspace(): AuthTokens['workspace'] | null {
    const raw = localStorage.getItem(WS_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  isLoggedIn(): boolean { return !!localStorage.getItem(ACCESS_KEY); },
};

// ── API calls ─────────────────────────────────────────────────────────────────

async function authReq<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json();
}

export const authApi = {
  async signup(params: {
    name: string; email: string; password: string;
    company_name: string; role?: string; industry?: string; company_size?: string;
  }): Promise<AuthTokens> {
    if (DEMO_MODE) {
      return makeDemoTokens(params.name, params.email, params.company_name);
    }
    return authReq<AuthTokens>('/auth/signup', params);
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    if (DEMO_MODE) {
      // Derive a display name from the email prefix
      const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return makeDemoTokens(name, email);
    }
    return authReq<AuthTokens>('/auth/login', { email, password });
  },

  async refresh(): Promise<AuthTokens | null> {
    if (DEMO_MODE) return null;
    const refresh_token = tokenStore.getRefresh();
    if (!refresh_token) return null;
    try {
      return await authReq<AuthTokens>('/auth/refresh', { refresh_token });
    } catch {
      return null;
    }
  },

  async me(): Promise<AuthUser | null> {
    if (DEMO_MODE) {
      const user = tokenStore.getUser();
      const ws   = tokenStore.getWorkspace();
      if (!user || !ws) return null;
      return { id: user.id, name: user.name, email: user.email, role: 'admin', workspace_id: ws.id, workspace_name: ws.name };
    }
    const token = tokenStore.getAccess();
    if (!token) return null;
    const res = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  },

  logout() {
    tokenStore.clear();
  },

  isDemoMode(): boolean {
    return DEMO_MODE;
  },
};

// ── Auth header helper (used by api.ts) ───────────────────────────────────────

export function getAuthHeader(): Record<string, string> {
  const token = tokenStore.getAccess();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
