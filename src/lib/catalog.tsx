/** Agents and neighborhoods change rarely and are used on almost every page, so they are fetched
 *  once from the API and shared through context. */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Agent } from '../data/agents'
import type { Neighborhood } from '../data/neighborhoods'
import { useApi, type ApiError } from './api'

export type AgentWithStats = Agent & { activeListings: number; rentOnly: boolean }
export type NeighborhoodWithCount = Neighborhood & { listings: number }

interface Ctx {
  agents: AgentWithStats[]
  neighborhoods: NeighborhoodWithCount[]
  agentById: (id: string | null | undefined) => AgentWithStats | undefined
  loading: boolean
  error: ApiError | null
  reload: () => void
}

const CatalogCtx = createContext<Ctx | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const a = useApi<AgentWithStats[]>('/agents')
  const n = useApi<NeighborhoodWithCount[]>('/neighborhoods')
  const value = useMemo<Ctx>(() => {
    const agents = a.data ?? []
    return {
      agents,
      neighborhoods: n.data ?? [],
      agentById: (id) => (id ? agents.find((x) => x.id === id) : undefined),
      loading: a.loading || n.loading,
      error: a.error ?? n.error,
      reload: () => { a.reload(); n.reload() },
    }
  }, [a, n])
  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalog() {
  const c = useContext(CatalogCtx)
  if (!c) throw new Error('useCatalog outside provider')
  return c
}
