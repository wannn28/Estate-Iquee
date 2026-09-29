import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const KEY = 'hollisrow:saved:v1'

interface Ctx {
  saved: string[]
  isSaved: (id: string) => boolean
  toggle: (id: string) => void
  clear: () => void
}

const FavCtx = createContext<Ctx | null>(null)

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>(load)
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(saved))
  }, [saved])
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === KEY && setSaved(load())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const toggle = useCallback((id: string) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [id, ...s])), [])
  const clear = useCallback(() => setSaved([]), [])
  const value = useMemo(() => ({ saved, isSaved: (id: string) => saved.includes(id), toggle, clear }), [saved, toggle, clear])
  return <FavCtx.Provider value={value}>{children}</FavCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  const c = useContext(FavCtx)
  if (!c) throw new Error('useFavorites outside provider')
  return c
}
