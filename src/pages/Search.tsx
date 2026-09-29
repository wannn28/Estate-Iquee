import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AMENITIES, type Amenity, type PropertyType } from '../data/listings'
import { neighborhoods } from '../data/neighborhoods'
import { agents, agentById } from '../data/agents'
import { activeCount, applyFilters, parseFilters, PRICE_STEPS, toParams, type Filters, type Sort, type View } from '../lib/filters'
import { usd } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import ListingCard from '../components/ListingCard'
import { Close, Grid, List, MapIcon, Sliders } from '../components/Icons'

const ListingMap = lazy(() => import('../components/ListingMap'))
const TYPES: PropertyType[] = ['House', 'Townhouse', 'Condo', 'Loft', 'Duplex']

function Chips<T extends string | number>({ name, options, value, onChange, fmt }: { name: string; options: T[]; value: T; onChange: (v: T) => void; fmt: (v: T) => string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-semibold uppercase tracking-label text-graphite">{name}</legend>
      <div className="flex border border-ink/20">
        {options.map((o) => (
          <label key={String(o)} className={`flex-1 cursor-pointer border-r border-ink/10 py-2 text-center text-sm tabular-nums transition last:border-r-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-ink ${value === o ? 'bg-ink text-chalk' : 'hover:bg-limestone'}`}>
            <input type="radio" name={name} className="sr-only" checked={value === o} onChange={() => onChange(o)} />{fmt(o)}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Check({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: () => void; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[15px]">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#1D5C3F]" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs tabular-nums text-graphite">{count}</span>}
    </label>
  )
}

function FilterPanel({ f, set, reset }: { f: Filters; set: (p: Partial<Filters>) => void; reset: () => void }) {
  const steps = PRICE_STEPS[f.mode]
  const sfx = f.mode === 'rent' ? '/mo' : ''
  const selCls = 'w-full border border-ink/20 bg-chalk px-3 py-2.5 text-[15px] outline-none focus:border-ink'
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const base = applyFilters({ ...f, types: [], amenities: [] })
  return (
    <div className="space-y-7">
      <div>
        <label htmlFor="f-area" className="mb-2 block text-[11px] font-semibold uppercase tracking-label text-graphite">Neighborhood</label>
        <select id="f-area" value={f.area} onChange={(e) => set({ area: e.target.value })} className={selCls}>
          <option value="">All of Austin</option>
          {neighborhoods.map((h) => <option key={h.slug} value={h.slug}>{h.name}</option>)}
        </select>
      </div>
      <fieldset>
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-label text-graphite">Price range</legend>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <select aria-label="Minimum price" value={f.min ?? ''} onChange={(e) => set({ min: e.target.value ? Number(e.target.value) : null })} className={selCls}>
            <option value="">No min</option>
            {steps.map((p) => <option key={p} value={p} disabled={!!f.max && p > f.max}>{usd(p)}{sfx}</option>)}
          </select>
          <span className="text-graphite" aria-hidden>–</span>
          <select aria-label="Maximum price" value={f.max ?? ''} onChange={(e) => set({ max: e.target.value ? Number(e.target.value) : null })} className={selCls}>
            <option value="">No max</option>
            {steps.map((p) => <option key={p} value={p} disabled={!!f.min && p < f.min}>{usd(p)}{sfx}</option>)}
          </select>
        </div>
      </fieldset>
      <Chips name="Bedrooms" options={[0, 1, 2, 3, 4, 5]} value={f.beds} onChange={(v) => set({ beds: v })} fmt={(v) => (v ? `${v}+` : 'Any')} />
      <Chips name="Bathrooms" options={[0, 1, 2, 3, 4]} value={f.baths} onChange={(v) => set({ baths: v })} fmt={(v) => (v ? `${v}+` : 'Any')} />
      <fieldset>
        <legend className="mb-1 text-[11px] font-semibold uppercase tracking-label text-graphite">Property type</legend>
        {TYPES.map((t) => <Check key={t} label={t} checked={f.types.includes(t)} onChange={() => set({ types: toggle(f.types, t) })} count={base.filter((l) => l.type === t).length} />)}
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-[11px] font-semibold uppercase tracking-label text-graphite">Amenities</legend>
        {AMENITIES.map((a) => <Check key={a} label={a} checked={f.amenities.includes(a)} onChange={() => set({ amenities: toggle(f.amenities, a as Amenity) })} count={base.filter((l) => l.amenities.includes(a)).length} />)}
      </fieldset>
      <div>
        <label htmlFor="f-agent" className="mb-2 block text-[11px] font-semibold uppercase tracking-label text-graphite">Listing agent</label>
        <select id="f-agent" value={f.agent} onChange={(e) => set({ agent: e.target.value })} className={selCls}>
          <option value="">Any agent</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <button type="button" onClick={reset} className="text-sm font-medium underline underline-offset-4 hover:text-oak">Reset all filters</button>
    </div>
  )
}

export default function Search() {
  const [sp, setSp] = useSearchParams()
  const f = useMemo(() => parseFilters(sp), [sp])
  const results = useMemo(() => applyFilters(f), [f])
  const [active, setActive] = useState<string | null>(null)
  const [drawer, setDrawer] = useState(false)
  const set = (p: Partial<Filters>) => setSp(toParams({ ...f, ...p }), { replace: true })
  const reset = () => setSp(toParams({ ...parseFilters(new URLSearchParams()), mode: f.mode, view: f.view, sort: f.sort }), { replace: true })
  const n = activeCount(f)
  const hood = neighborhoods.find((h) => h.slug === f.area)
  const agent = agentById(f.agent)
  const heading = `${f.mode === 'rent' ? 'Homes for rent' : 'Homes for sale'} in ${hood ? hood.name : 'Austin'}`
  useTitle(heading)
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [drawer])

  const chips: { label: string; clear: Partial<Filters> }[] = [
    ...(hood ? [{ label: hood.name, clear: { area: '' } }] : []),
    ...(f.min ? [{ label: `From ${usd(f.min)}`, clear: { min: null } }] : []),
    ...(f.max ? [{ label: `Up to ${usd(f.max)}`, clear: { max: null } }] : []),
    ...(f.beds ? [{ label: `${f.beds}+ beds`, clear: { beds: 0 } }] : []),
    ...(f.baths ? [{ label: `${f.baths}+ baths`, clear: { baths: 0 } }] : []),
    ...f.types.map((t) => ({ label: t, clear: { types: f.types.filter((x) => x !== t) } })),
    ...f.amenities.map((a) => ({ label: a, clear: { amenities: f.amenities.filter((x) => x !== a) } })),
    ...(agent ? [{ label: agent.name, clear: { agent: '' } }] : []),
  ]

  const views: { v: View; label: string; icon: JSX.Element }[] = [
    { v: 'grid', label: 'Grid', icon: <Grid size={17} /> },
    { v: 'list', label: 'List', icon: <List size={17} /> },
    { v: 'map', label: 'Map', icon: <MapIcon size={17} /> },
  ]
  const empty = (
    <div className="border border-dashed border-ink/25 px-6 py-16 text-center">
      <p className="font-serif text-3xl">Nothing matches — yet.</p>
      <p className="mt-2 text-graphite">Try widening the price range or removing an amenity.</p>
      <button type="button" onClick={reset} className="mt-6 bg-ink px-5 py-3 text-sm font-medium text-chalk">Reset filters</button>
    </div>
  )

  return (
    <div className="mx-auto max-w-page px-5 pb-8 pt-8 sm:px-8">
      <div className="flex flex-col gap-6 border-b border-ink pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 inline-flex border border-ink" role="radiogroup" aria-label="Buy or rent">
            {(['buy', 'rent'] as const).map((m) => (
              <label key={m} className={`cursor-pointer px-5 py-2 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-oak ${f.mode === m ? 'bg-ink text-chalk' : 'hover:bg-chalk'}`}>
                <input type="radio" name="mode" className="sr-only" checked={f.mode === m} onChange={() => set({ mode: m, min: null, max: null })} />{m === 'buy' ? 'Buy' : 'Rent'}
              </label>
            ))}
          </div>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl">{heading}</h1>
          <p className="mt-3 text-graphite" aria-live="polite"><span className="font-semibold tabular-nums text-ink" data-testid="result-count">{results.length}</span> {results.length === 1 ? 'home' : 'homes'} · demo listings</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setDrawer(true)} className="flex items-center gap-2 border border-ink/25 px-4 py-2.5 text-sm font-medium lg:hidden" aria-haspopup="dialog">
            <Sliders size={18} /> Filters {n > 0 && <span className="bg-oak px-1.5 text-xs tabular-nums text-chalk">{n}</span>}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-graphite">Sort</span>
            <select value={f.sort} onChange={(e) => set({ sort: e.target.value as Sort })} className="border border-ink/25 bg-chalk px-3 py-2.5 outline-none focus:border-ink">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="sqft-desc">Largest first</option>
            </select>
          </label>
          <div className="flex border border-ink/25" role="radiogroup" aria-label="Results view">
            {views.map(({ v, label, icon }) => (
              <label key={v} className={`flex cursor-pointer items-center gap-2 px-3.5 py-2.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-oak ${f.view === v ? 'bg-ink text-chalk' : 'hover:bg-chalk'}`}>
                <input type="radio" name="view" className="sr-only" checked={f.view === v} onChange={() => set({ view: v })} />{icon}<span className="hidden sm:inline">{label}</span><span className="sr-only sm:hidden">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <li key={c.label}>
              <button type="button" onClick={() => set(c.clear)} className="flex items-center gap-1.5 border border-ink/20 bg-chalk px-3 py-1.5 text-[13px] hover:border-ink" aria-label={`Remove filter: ${c.label}`}>{c.label}<Close size={14} /></button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[16.5rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="pb-6"><FilterPanel f={f} set={set} reset={reset} /></div>
        </aside>
        <section aria-label="Results" className="min-w-0">
          {f.view === 'map' ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
              <div className="order-2 xl:order-1">
                {results.length ? results.map((l) => <ListingCard key={l.id} l={l} layout="compact" onHover={setActive} active={active === l.id} />) : empty}
              </div>
              <div className="order-1 xl:order-2">
                <div className="h-[60vh] min-h-[22rem] border border-rule xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)]">
                  <Suspense fallback={<div className="grid h-full place-items-center bg-mist text-sm text-graphite">Loading map…</div>}>
                    <ListingMap items={results} activeId={active} onActive={setActive} label={`Map of ${results.length} listings`} />
                  </Suspense>
                </div>
              </div>
            </div>
          ) : !results.length ? empty : f.view === 'list' ? (
            <div className="border-b border-rule">{results.map((l) => <ListingCard key={l.id} l={l} layout="list" />)}</div>
          ) : (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => <ListingCard key={l.id} l={l} sizes="(min-width:1280px) 22vw, (min-width:640px) 45vw, 100vw" />)}
            </div>
          )}
          <p className="mt-12 text-sm text-graphite">Don’t see it? Half our sales never hit the portals. <Link to="/contact?topic=buying" className="font-medium text-ink underline underline-offset-4">Tell us what you’re looking for</Link>.</p>
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[2500] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} aria-hidden />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-limestone">
            <div className="flex items-center justify-between border-b border-rule px-5 py-4">
              <p className="font-serif text-3xl">Filters</p>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center" autoFocus><Close /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6"><FilterPanel f={f} set={set} reset={reset} /></div>
            <div className="border-t border-rule p-4"><button type="button" onClick={() => setDrawer(false)} className="w-full bg-oak py-3.5 font-medium text-chalk">Show {results.length} homes</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
