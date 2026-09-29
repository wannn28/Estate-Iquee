/** Small fetch wrapper for the Hollis Row Go API (JSON errors with field messages, admin bearer token). */
import { useCallback, useEffect, useState } from 'react'

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'
const ADMIN_KEY = 'hollisrow:admin-token'

export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string>
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export const adminToken = {
  get: () => { try { return sessionStorage.getItem(ADMIN_KEY) } catch { return null } },
  set: (t: string | null) => { try { if (t) sessionStorage.setItem(ADMIN_KEY, t); else sessionStorage.removeItem(ADMIN_KEY) } catch { /* private mode */ } },
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; signal?: AbortSignal; auth?: boolean; keepalive?: boolean } = {}): Promise<T> {
  const headers = new Headers()
  if (opts.body !== undefined) headers.set('Content-Type', 'application/json')
  const tok = opts.auth ? adminToken.get() : null
  if (tok) headers.set('Authorization', `Bearer ${tok}`)
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET', headers, signal: opts.signal, keepalive: opts.keepalive,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError(0, 'network', 'We couldn’t reach the Hollis Row server. Check your connection and try again.')
  }
  if (!res.ok) {
    let b: { error?: string; message?: string; fields?: Record<string, string> } = {}
    try { b = await res.json() } catch { /* not JSON */ }
    throw new ApiError(res.status, b.error ?? 'http_error', b.message ?? `Request failed (${res.status}).`, b.fields)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** GET hook that keeps previous data while refetching; path=null skips the request. */
export function useApi<T>(path: string | null, opts: { auth?: boolean } = {}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(path !== null)
  const [nonce, setNonce] = useState(0)
  const auth = !!opts.auth
  useEffect(() => {
    if (path === null) { setLoading(false); return }
    const ctl = new AbortController()
    setLoading(true)
    api<T>(path, { signal: ctl.signal, auth })
      .then((d) => { setData(d); setError(null) })
      .catch((e) => { if (e.name !== 'AbortError') setError(e instanceof ApiError ? e : new ApiError(0, 'unknown', String(e))) })
      .finally(() => { if (!ctl.signal.aborted) setLoading(false) })
    return () => ctl.abort()
  }, [path, nonce, auth])
  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { data, error, loading, reload, setData }
}
