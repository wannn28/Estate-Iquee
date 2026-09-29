import { Link } from 'react-router-dom'
import type { Listing } from '../data/listings'
import { useCatalog } from '../lib/catalog'
import { bathLabel, num, priceLabel } from '../lib/format'
import Img from './Img'
import SaveButton from './SaveButton'

export function Facts({ l, className = '' }: { l: Listing; className?: string }) {
  return (
    <p className={`text-sm tabular-nums text-graphite ${className}`}>
      {l.beds} bd <span aria-hidden className="mx-1 text-ink/25">/</span> {bathLabel(l.baths)} ba <span aria-hidden className="mx-1 text-ink/25">/</span> {num(l.sqft)} sq ft
    </p>
  )
}

export function Tag({ l }: { l: Listing }) {
  if (!l.tag) return null
  const cls = l.tag === 'New' ? 'bg-oak text-chalk' : l.tag === 'Price cut' ? 'bg-ink text-chalk' : 'bg-chalk text-ink'
  return <span className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-label ${cls}`}>{l.tag}</span>
}

interface Props {
  l: Listing
  layout?: 'grid' | 'list' | 'compact'
  sizes?: string
  onHover?: (id: string | null) => void
  active?: boolean
}

export default function ListingCard({ l, layout = 'grid', sizes, onHover, active }: Props) {
  const { agentById } = useCatalog()
  const hover = onHover ? { onMouseEnter: () => onHover(l.id), onMouseLeave: () => onHover(null), onFocus: () => onHover(l.id), onBlur: () => onHover(null) } : {}
  if (layout === 'list' || layout === 'compact') {
    const agent = agentById(l.agentId)
    const compact = layout === 'compact'
    return (
      <article {...hover} className={`group relative grid gap-5 border-t border-rule py-6 ${compact ? 'grid-cols-[9rem_1fr] sm:grid-cols-[12rem_1fr]' : 'sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'} ${active ? 'bg-oak-light/50' : ''}`}>
        <div className="relative overflow-hidden">
          <Img name={l.photos[0]} alt={`${l.title}, ${l.address}`} sizes={sizes ?? (compact ? '12rem' : '(min-width:1024px) 30vw, 100vw')} className="aspect-[3/2] w-full transition duration-700 group-hover:scale-[1.03]" />
          {!compact && <div className="absolute left-3 top-3"><Tag l={l} /></div>}
          {!compact && <div className="absolute right-3 top-3 z-10"><SaveButton id={l.id} title={l.title} /></div>}
        </div>
        <div className="flex min-w-0 flex-col">
          <p className="text-[11px] font-semibold uppercase tracking-label text-oak">{l.neighborhood} · {l.type}</p>
          <h3 className={`mt-1 font-serif leading-tight ${compact ? 'text-xl' : 'text-3xl'}`}>
            <Link to={`/listing/${l.slug}`} className="stretched">{l.title}</Link>
          </h3>
          <p className="mt-1 truncate text-sm text-graphite">{l.address}</p>
          <p className={`mt-3 font-semibold tabular-nums ${compact ? 'text-base' : 'text-xl'}`}>{priceLabel(l)}</p>
          <Facts l={l} className="mt-1" />
          {!compact && <p className="mt-4 hidden max-w-prose text-[15px] leading-relaxed text-ink/80 md:block">{l.summary}</p>}
          {!compact && agent && <p className="mt-auto hidden pt-4 text-xs text-graphite md:block">Listed by {agent.name} · {l.daysListed === 1 ? '1 day' : `${l.daysListed} days`} on Hollis Row</p>}
        </div>
      </article>
    )
  }
  return (
    <article {...hover} className={`group relative ${active ? 'outline outline-2 outline-offset-4 outline-oak' : ''}`}>
      <div className="relative overflow-hidden">
        <Img name={l.photos[0]} alt={`${l.title}, ${l.address}`} sizes={sizes} className="aspect-[3/2] w-full transition duration-700 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3"><Tag l={l} /></div>
      </div>
      <div className="absolute right-3 top-3 z-10"><SaveButton id={l.id} title={l.title} /></div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-label text-oak">{l.neighborhood}</p>
        <p className="text-lg font-semibold tabular-nums">{priceLabel(l)}</p>
      </div>
      <h3 className="mt-1 font-serif text-2xl leading-tight">
        <Link to={`/listing/${l.slug}`} className="stretched">{l.title}</Link>
      </h3>
      <Facts l={l} className="mt-1.5" />
    </article>
  )
}
