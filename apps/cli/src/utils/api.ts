/**
 * Derivo CLI — Backend API client
 *
 * The CLI is a thin client. All security-sensitive decisions (auth,
 * subscription) are made by the backend (apps/api). This module resolves the
 * backend base URL and performs authenticated requests.
 *
 * Base URL resolution order:
 *   1. DERIVO_API_URL environment variable
 *   2. `apiUrl` in ~/.derivo/config.json
 *   3. Default: http://localhost:3001 (local backend during beta)
 */
import http from 'http';
import https from 'https';
import { getGlobalConfig } from './config.js';

export const DEFAULT_API_URL = 'http://localhost:3001';

export function getApiBaseUrl(): string {
  const fromEnv = process.env.DERIVO_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const fromConfig = getGlobalConfig().apiUrl?.trim();
  if (fromConfig) return fromConfig.replace(/\/+$/, '');
  return DEFAULT_API_URL;
}

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

export class ApiUnreachableError extends Error {
  constructor(
    public readonly url: string,
    cause?: unknown,
  ) {
    super(`Could not reach the Derivo backend at ${url}`);
    this.name = 'ApiUnreachableError';
    if (cause instanceof Error) this.stack = cause.stack;
  }
}

interface RequestOptions {
  method?: string;
  token?: string;
  body?: unknown;
  timeoutMs?: number;
}

/**
 * Perform a request against the backend. Resolves with status + parsed body.
 * Throws `ApiUnreachableError` on connection failure or timeout.
 */
export function apiRequest<T = unknown>(
  pathname: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const base = getApiBaseUrl();
  const url = new URL(pathname.replace(/^\//, '/'), base + '/');
  const isHttps = url.protocol === 'https:';
  const transport = isHttps ? https : http;
  const timeout = options.timeoutMs ?? 8000;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method ?? 'GET',
        headers,
        timeout,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data: T;
          try {
            data = raw ? (JSON.parse(raw) as T) : ({} as T);
          } catch {
            data = raw as unknown as T;
          }
          resolve({ status: res.statusCode ?? 500, data });
        });
      },
    );

    req.on('error', (err) => reject(new ApiUnreachableError(base, err)));
    req.on('timeout', () => {
      req.destroy();
      reject(new ApiUnreachableError(base));
    });

    if (options.body !== undefined) req.write(JSON.stringify(options.body));
    req.end();
  });
}
