/** Saved homes, keyed by an anonymous client id (random UUID kept in localStorage; no sign-up).
 *  The list lives in MySQL via /api/saved/{clientId}; localStorage is only an offline cache so the
 *  hearts render instantly and survive a flaky connection. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api } from './api'

const KEY = 'hollisrow:saved:v1'
const CID_KEY = 'hollisrow:client-id'

interface Ctx {
  clientId: string
  saved: string[]
  synced: boolean
  isSaved: (id: string) => boolean
  toggle: (id: string) => void
  clear: () => void
}

const FavCtx = createContext<Ctx | null>(null)

function uuid4() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

function clientId() {
  try {
    let id = localStorage.getItem(CID_KEY)
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) {
      id = uuid4()
      localStorage.setItem(CID_KEY, id)
    }
    return id
  } catch {
    return uuid4()
  }
}

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [cid] = useState(clientId)
  const [saved, setSaved] = useState<string[]>(load)
  const [synced, setSynced] = useState(false)
  const savedRef = useRef(saved)
  savedRef.current = saved

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(saved)) } catch { /* quota */ } }, [saved])

  // First load: upload whatever this browser already had and adopt the server's union.
  useEffect(() => {
    const ctl = new AbortController()
    api<{ ids: string[] }>(`/saved/${cid}/merge`, { method: 'POST', body: { ids: savedRef.current }, signal: ctl.signal })
      .then((r) => { setSaved(r.ids); setSynced(true) })
      .catch(() => { /* offline: keep the local cache */ })
    return () => ctl.abort()
  }, [cid])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === KEY && setSaved(load())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = useCallback((id: string) => {
    const on = savedRef.current.includes(id)
    setSaved((s) => (on ? s.filter((x) => x !== id) : [id, ...s.filter((x) => x !== id)]))
    api(`/saved/${cid}/${encodeURIComponent(id)}`, { method: on ? 'DELETE' : 'PUT' }).catch(() => {
      // roll back the optimistic update if the server refused it
      setSaved((s) => (on ? [id, ...s.filter((x) => x !== id)] : s.filter((x) => x !== id)))
    })
  }, [cid])
  const clear = useCallback(() => {
    const prev = savedRef.current
    setSaved([])
    api(`/saved/${cid}`, { method: 'DELETE' }).catch(() => setSaved(prev))
  }, [cid])
  const value = useMemo(() => ({ clientId: cid, saved, synced, isSaved: (id: string) => saved.includes(id), toggle, clear }), [cid, saved, synced, toggle, clear])
  return <FavCtx.Provider value={value}>{children}</FavCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  const c = useContext(FavCtx)
  if (!c) throw new Error('useFavorites outside provider')
  return c
}
