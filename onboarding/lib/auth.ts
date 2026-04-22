/**
 * Auth utilities — token storage, API calls, session management.
 * All tokens stored in localStorage (swap to httpOnly cookies for prod).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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
    // Set cookie so Next.js middleware can protect routes server-side
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
    return authReq<AuthTokens>('/auth/signup', params);
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    return authReq<AuthTokens>('/auth/login', { email, password });
  },

  async refresh(): Promise<AuthTokens | null> {
    const refresh_token = tokenStore.getRefresh();
    if (!refresh_token) return null;
    try {
      return await authReq<AuthTokens>('/auth/refresh', { refresh_token });
    } catch {
      return null;
    }
  },

  async me(): Promise<AuthUser | null> {
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
};

// ── Auth header helper (used by api.ts) ───────────────────────────────────────

export function getAuthHeader(): Record<string, string> {
  const token = tokenStore.getAccess();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
