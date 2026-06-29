/**
 * Backend API client for the dashboard.
 *
 * All identity/billing/device/session state is owned by the backend (Phases
 * 11–13). The dashboard calls these endpoints with the Firebase ID token —
 * it never computes entitlements or mutates this state directly.
 */
import { auth } from './firebase';

const API_BASE = (
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.VITE_DERIVO_API_URL as string) ||
  'http://localhost:3001'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, 'unauthenticated', 'Not signed in');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = { ...(await authHeader()), ...(init.headers || {}) };
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'unreachable', `Cannot reach the backend at ${API_BASE}`);
  }
  const text = await res.text();
  const body = text ? safeJson(text) : {};
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body.code || 'error',
      body.error || `Request failed (${res.status})`,
    );
  }
  return body as T;
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

// ── Billing / entitlements ───────────────────────────────────────────────────
export interface SubscriptionState {
  active: boolean;
  planId: string;
  planLabel: string;
  status: string;
  isTrial: boolean;
  inGrace: boolean;
  endsAt: string | null;
  renewalDate: string | null;
  remainingDays: number;
  remainingHours: number;
  reason: string;
}
export interface UsageReport {
  planId: string;
  usage: Record<string, { used: number; limit: number; remaining: number }>;
}
export interface FeatureDecision {
  feature: string;
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  reason: string;
}

export const billingApi = {
  subscription: () => request<SubscriptionState>('/api/subscription'),
  usage: () => request<UsageReport>('/api/usage'),
  limits: () => request<{ planId: string; limits: Record<string, number> }>('/api/limits'),
  features: () => request<{ features: Record<string, FeatureDecision> }>('/api/features'),
};

// ── Sessions ─────────────────────────────────────────────────────────────────
export interface SessionInfo {
  id: string;
  deviceId: string | null;
  deviceName: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}
export const sessionsApi = {
  list: () => request<{ sessions: SessionInfo[] }>('/api/sessions'),
  logout: (sessionId: string) =>
    request('/api/sessions/logout', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  logoutAll: (exceptSessionId?: string) =>
    request('/api/sessions/logout-all', {
      method: 'POST',
      body: JSON.stringify(exceptSessionId ? { exceptSessionId } : {}),
    }),
};

// ── Devices ──────────────────────────────────────────────────────────────────
export interface DeviceInfo {
  id: string;
  name: string;
  type?: string;
  os?: string;
  hostname?: string | null;
  arch?: string | null;
  nodeVersion?: string | null;
  cliVersion?: string;
  fingerprint?: string;
  isTrusted?: boolean;
  revoked?: boolean;
  createdAt?: string;
  lastSeenAt?: string;
  updatedAt?: string;
}
export const devicesApi = {
  list: () => request<{ devices: DeviceInfo[] }>('/api/devices'),
  rename: (id: string, name: string) =>
    request(`/api/devices/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  trust: (id: string) =>
    request(`/api/devices/${encodeURIComponent(id)}/trust`, { method: 'POST', body: '{}' }),
  untrust: (id: string) =>
    request(`/api/devices/${encodeURIComponent(id)}/untrust`, { method: 'POST', body: '{}' }),
  revoke: (id: string) =>
    request(`/api/devices/${encodeURIComponent(id)}/revoke`, { method: 'POST', body: '{}' }),
  remove: (id: string) => request(`/api/devices/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ── API keys ─────────────────────────────────────────────────────────────────
export interface ApiKeyInfo {
  id: string;
  name: string;
  preview: string;
  status: 'active' | 'disabled' | 'revoked' | 'expired';
  environment: string;
  permissions: string[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}
export interface CreatedKey {
  id: string;
  key: string;
  keyRecord: ApiKeyInfo;
  message: string;
}
export const keysApi = {
  list: () => request<{ keys: ApiKeyInfo[] }>('/api/keys'),
  create: (input: {
    name: string;
    environment?: 'live' | 'test';
    permissions?: string[];
    tags?: string[];
    expiresInDays?: number;
  }) => request<CreatedKey>('/api/keys', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: { name?: string; tags?: string[]; status?: 'active' | 'disabled' }) =>
    request(`/api/keys/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  rotate: (id: string, graceSeconds = 0) =>
    request<CreatedKey>(`/api/keys/${encodeURIComponent(id)}/rotate`, {
      method: 'POST',
      body: JSON.stringify({ graceSeconds }),
    }),
  revoke: (id: string) =>
    request(`/api/keys/${encodeURIComponent(id)}/revoke`, { method: 'POST', body: '{}' }),
};

// ── Login history ────────────────────────────────────────────────────────────
export interface LoginHistoryEvent {
  id: string;
  type: string;
  detail?: string;
  deviceId?: string;
  at: string;
}
export const historyApi = {
  list: () => request<{ history: LoginHistoryEvent[] }>('/api/login-history'),
};
