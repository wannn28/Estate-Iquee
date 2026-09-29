import { listings, type Amenity, type Listing, type Mode, type PropertyType } from '../data/listings'
import { neighborhoods } from '../data/neighborhoods'

export type Sort = 'newest' | 'price-asc' | 'price-desc' | 'sqft-desc'
export type View = 'grid' | 'list' | 'map'

export interface Filters {
  mode: Mode
  area: string // neighborhood group slug or ''
  min: number | null
  max: number | null
  beds: number
  baths: number
  types: PropertyType[]
  amenities: Amenity[]
  agent: string
  sort: Sort
  view: View
}

export const PRICE_STEPS: Record<Mode, number[]> = {
  buy: [500000, 750000, 1000000, 1250000, 1500000, 2000000, 2500000, 3000000, 4000000],
  rent: [2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000],
}

export function parseFilters(sp: URLSearchParams): Filters {
  const n = (k: string) => {
    const v = Number(sp.get(k))
    return sp.get(k) && Number.isFinite(v) && v > 0 ? v : null
  }
  const list = (k: string) => (sp.get(k) ?? '').split(',').filter(Boolean)
  const sort = sp.get('sort') as Sort
  const view = sp.get('view') as View
  return {
    mode: sp.get('mode') === 'rent' ? 'rent' : 'buy',
    area: sp.get('area') ?? '',
    min: n('min'),
    max: n('max'),
    beds: n('beds') ?? 0,
    baths: n('baths') ?? 0,
    types: list('type') as PropertyType[],
    amenities: list('amenities') as Amenity[],
    agent: sp.get('agent') ?? '',
    sort: ['newest', 'price-asc', 'price-desc', 'sqft-desc'].includes(sort) ? sort : 'newest',
    view: ['grid', 'list', 'map'].includes(view) ? view : 'grid',
  }
}

export function toParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.mode === 'rent') p.set('mode', 'rent')
  if (f.area) p.set('area', f.area)
  if (f.min) p.set('min', String(f.min))
  if (f.max) p.set('max', String(f.max))
  if (f.beds) p.set('beds', String(f.beds))
  if (f.baths) p.set('baths', String(f.baths))
  if (f.types.length) p.set('type', f.types.join(','))
  if (f.amenities.length) p.set('amenities', f.amenities.join(','))
  if (f.agent) p.set('agent', f.agent)
  if (f.sort !== 'newest') p.set('sort', f.sort)
  if (f.view !== 'grid') p.set('view', f.view)
  return p
}

export function applyFilters(f: Filters): Listing[] {
  const hood = neighborhoods.find((h) => h.slug === f.area)
  const out = listings.filter(
    (l) =>
      l.mode === f.mode &&
      (!hood || hood.covers.includes(l.neighborhood)) &&
      (!f.min || l.price >= f.min) &&
      (!f.max || l.price <= f.max) &&
      l.beds >= f.beds &&
      l.baths >= f.baths &&
      (!f.types.length || f.types.includes(l.type)) &&
      f.amenities.every((a) => l.amenities.includes(a)) &&
      (!f.agent || l.agentId === f.agent),
  )
  const s = {
    newest: (a: Listing, b: Listing) => a.daysListed - b.daysListed,
    'price-asc': (a: Listing, b: Listing) => a.price - b.price,
    'price-desc': (a: Listing, b: Listing) => b.price - a.price,
    'sqft-desc': (a: Listing, b: Listing) => b.sqft - a.sqft,
  }[f.sort]
  return out.sort(s)
}

export function activeCount(f: Filters) {
  return [f.area, f.min, f.max, f.beds, f.baths, f.agent].filter(Boolean).length + f.types.length + f.amenities.length
}
