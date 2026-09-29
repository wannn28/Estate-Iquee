import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Listing, Mode } from '../data/listings'
import type { Testimonial } from '../data/testimonials'
import { useApi } from '../lib/api'
import { useCatalog } from '../lib/catalog'
import { ErrorBox, Skeleton } from '../components/States'
import { PRICE_STEPS } from '../lib/filters'
import { bathLabel, num, priceLabel, shortPrice, usd } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import Img from '../components/Img'
import ListingCard, { Facts, Tag } from '../components/ListingCard'
import SaveButton from '../components/SaveButton'
import { Arrow, ArrowLeft } from '../components/Icons'

export function SectionHead({ n, title, kicker, action }: { n: string; title: string; kicker?: string; action?: { to: string; label: string } }) {
  return (
    <div className="flex flex-col gap-4 border-t border-ink pt-5 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-5">
        <span className="mt-2 text-sm font-medium tabular-nums text-oak">{n}</span>
        <div>
          <h2 className="font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl">{title}</h2>
          {kicker && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-graphite">{kicker}</p>}
        </div>
      </div>
      {action && <Link to={action.to} className="group inline-flex items-center gap-2 self-start text-sm font-medium md:self-auto">{action.label}<Arrow size={18} className="transition group-hover:translate-x-1" /></Link>}
    </div>
  )
}

interface HomeData { cover: Listing; featured: Listing[]; recent: Listing[]; counts: { buy: number; rent: number } }

function HeroSearch() {
  const nav = useNavigate()
  const { neighborhoods } = useCatalog()
  const [mode, setMode] = useState<Mode>('buy')
  const [area, setArea] = useState('')
  const [max, setMax] = useState('')
  const [beds, setBeds] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (mode === 'rent') p.set('mode', 'rent')
    if (area) p.set('area', area)
    if (max) p.set('max', max)
    if (beds) p.set('beds', beds)
    nav(`/search${p.size ? `?${p}` : ''}`)
  }
  const sel = 'w-full appearance-none bg-transparent py-1 text-[17px] outline-none'
  return (
    <form onSubmit={submit} role="search" aria-label="Search homes" className="bg-chalk text-ink shadow-[0_1px_0_rgba(0,0,0,.08)]">
      <div className="flex border-b border-rule" role="radiogroup" aria-label="Buy or rent">
        {(['buy', 'rent'] as Mode[]).map((m) => (
          <label key={m} className={`relative cursor-pointer px-6 py-3.5 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-ink ${mode === m ? 'text-ink after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:bg-oak' : 'text-graphite hover:text-ink'}`}>
            <input type="radio" name="hero-mode" className="sr-only" checked={mode === m} onChange={() => { setMode(m); setMax('') }} />
            {m === 'buy' ? 'Buy' : 'Rent'}
          </label>
        ))}
      </div>
      <div className="grid md:grid-cols-[1.4fr_1fr_0.8fr_auto]">
        <label className="block border-b border-rule px-6 py-3 md:border-b-0 md:border-r">
          <span className="block text-[11px] font-semibold uppercase tracking-label text-graphite">Neighborhood</span>
          <select value={area} onChange={(e) => setArea(e.target.value)} className={sel}>
            <option value="">All of Austin</option>
            {neighborhoods.map((h) => <option key={h.slug} value={h.slug}>{h.name}</option>)}
          </select>
        </label>
        <label className="block border-b border-rule px-6 py-3 md:border-b-0 md:border-r">
          <span className="block text-[11px] font-semibold uppercase tracking-label text-graphite">Max price</span>
          <select value={max} onChange={(e) => setMax(e.target.value)} className={sel}>
            <option value="">No limit</option>
            {PRICE_STEPS[mode].map((p) => <option key={p} value={p}>{usd(p)}{mode === 'rent' ? '/mo' : ''}</option>)}
          </select>
        </label>
        <label className="block border-b border-rule px-6 py-3 md:border-b-0 md:border-r">
          <span className="block text-[11px] font-semibold uppercase tracking-label text-graphite">Bedrooms</span>
          <select value={beds} onChange={(e) => setBeds(e.target.value)} className={sel}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((b) => <option key={b} value={b}>{b}+</option>)}
          </select>
        </label>
        <button type="submit" className="flex items-center justify-center gap-3 bg-oak px-8 py-4 font-medium text-chalk transition hover:bg-oak-dark">Search homes <Arrow size={18} /></button>
      </div>
    </form>
  )
}

function Testimonials() {
  const [i, setI] = useState(0)
  const { data } = useApi<Testimonial[]>('/testimonials')
  const testimonials = data ?? []
  const t = testimonials[i]
  if (!t) return null
  const go = (d: number) => setI((x) => (x + d + testimonials.length) % testimonials.length)
  return (
    <section className="mx-auto mt-28 max-w-page px-5 sm:px-8" aria-label="Client testimonials">
      <SectionHead n="04" title="In their words" />
      <figure className="mt-12 grid gap-10 md:grid-cols-[1fr_16rem]">
        <blockquote className="font-serif text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.08] tracking-tight" aria-live="polite">
          <span className="text-oak">“</span>{t.quote}<span className="text-oak">”</span>
        </blockquote>
        <div className="flex flex-col justify-between gap-8 border-t border-rule pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <figcaption>
            <p className="font-medium">{t.name}</p>
            <p className="text-sm text-graphite">{t.detail}</p>
          </figcaption>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial" className="grid h-11 w-11 place-items-center border border-ink/25 hover:border-ink"><ArrowLeft size={18} /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next testimonial" className="grid h-11 w-11 place-items-center border border-ink/25 hover:border-ink"><Arrow size={18} /></button>
            <span className="ml-2 text-sm tabular-nums text-graphite">{String(i + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}</span>
          </div>
        </div>
      </figure>
    </section>
  )
}

export default function Home() {
  useTitle('')
  const { data, error, reload } = useApi<HomeData>('/home')
  const { agents, neighborhoods } = useCatalog()
  const cover = data?.cover
  const [lead, ...rest] = (data?.featured ?? []).filter((l) => l.id !== cover?.id)
  const side = rest.slice(0, 2)
  const index = data?.recent ?? []

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[min(86vh,52rem)] min-h-[34rem] overflow-hidden">
          <Img name="hero" eager alt="Mid-century modern house with a long glass facade and lawn at dusk" sizes="100vw" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden />
          <div className="relative mx-auto flex h-full max-w-page flex-col justify-end px-5 pb-40 sm:px-8 md:pb-44">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-chalk/85">Independent brokerage · Austin, Texas</p>
            <h1 className="mt-4 max-w-4xl font-serif text-[clamp(3.2rem,8vw,7.5rem)] leading-[0.9] tracking-tight text-chalk">
              Austin homes, <em className="italic">considered.</em>
            </h1>
          </div>
          {cover && <Link to={`/listing/${cover.slug}`} className="group absolute right-5 top-6 hidden items-center gap-3 bg-chalk/90 py-2 pl-3 pr-4 text-[13px] text-ink backdrop-blur transition hover:bg-chalk sm:right-8 md:flex">
            <span className="text-[10px] font-semibold uppercase tracking-label text-oak">On the cover</span>
            <span className="font-serif text-lg leading-none">{cover.title}</span>
            <span className="tabular-nums text-graphite">{cover.neighborhood} · {priceLabel(cover)}</span>
            <Arrow size={16} className="transition group-hover:translate-x-0.5" />
          </Link>}
        </div>
        <div className="relative z-10 mx-auto -mt-28 max-w-page px-5 sm:px-8 md:-mt-24">
          <div className="max-w-5xl"><HeroSearch /></div>
          <p className="mt-4 min-h-5 text-sm text-graphite">{data && <>{data.counts.buy} homes for sale and {data.counts.rent} for rent, each walked by an agent before it’s listed.</>}</p>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto mt-24 max-w-page px-5 sm:px-8" aria-label="Featured homes">
        <SectionHead n="01" title="This week’s homes" kicker="Houses our agents would buy themselves. New listings appear here first, usually two days before the portals." action={{ to: '/search', label: 'All homes for sale' }} />
        {error && <ErrorBox error={error} retry={reload} className="mt-10" />}
        {!data && !error && (
          <div className="mt-10 grid gap-10 lg:grid-cols-12" aria-busy="true">
            <Skeleton className="aspect-[4/3] lg:col-span-7" />
            <div className="grid content-start gap-10 lg:col-span-5"><Skeleton className="aspect-[3/2]" /><Skeleton className="aspect-[3/2]" /></div>
          </div>
        )}
        {lead && <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <article className="group relative lg:col-span-7">
            <div className="relative overflow-hidden">
              <Img name={lead.photos[0]} alt={`${lead.title}, ${lead.address}`} sizes="(min-width:1024px) 55vw, 100vw" className="aspect-[4/3] w-full transition duration-700 group-hover:scale-[1.02]" />
              <div className="absolute left-4 top-4"><Tag l={lead} /></div>
              <div className="absolute right-4 top-4 z-10"><SaveButton id={lead.id} title={lead.title} /></div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-label text-oak">{lead.neighborhood} · Built {lead.year}</p>
                <h3 className="mt-1 font-serif text-5xl leading-[0.95] tracking-tight"><Link to={`/listing/${lead.slug}`} className="stretched">{lead.title}</Link></h3>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink/80">{lead.summary}</p>
              </div>
              <div className="md:text-right">
                <p className="text-2xl font-semibold tabular-nums">{priceLabel(lead)}</p>
                <Facts l={lead} className="mt-1" />
              </div>
            </div>
          </article>
          <div className="grid content-start gap-10 lg:col-span-5">
            {side.map((l) => <ListingCard key={l.id} l={l} sizes="(min-width:1024px) 38vw, 100vw" />)}
          </div>
        </div>}

        {/* Index table */}
        <div className="mt-16">
          <div className="flex items-baseline justify-between border-b border-ink pb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-label">Recently listed</h3>
            <Link to="/search?sort=newest" className="text-sm text-graphite hover:text-ink">View all</Link>
          </div>
          <ul>
            {index.map((l) => (
              <li key={l.id} className="group relative grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-rule py-3 transition hover:bg-chalk sm:grid-cols-[6rem_1.3fr_1fr_1fr_auto] sm:gap-6">
                <Img name={l.photos[0]} alt="" sizes="6rem" className="aspect-[3/2] w-full" />
                <div className="min-w-0">
                  <Link to={`/listing/${l.slug}`} className="stretched font-serif text-xl leading-tight sm:text-2xl">{l.title}</Link>
                  <p className="truncate text-xs text-graphite sm:hidden">{l.neighborhood} · {l.beds} bd · {bathLabel(l.baths)} ba</p>
                </div>
                <p className="hidden text-sm text-graphite sm:block">{l.neighborhood}</p>
                <p className="hidden text-sm tabular-nums text-graphite sm:block">{l.beds} bd · {bathLabel(l.baths)} ba · {num(l.sqft)} ft²</p>
                <p className="text-right font-semibold tabular-nums">{shortPrice(l)}<span className="block text-[11px] font-normal uppercase tracking-label text-graphite">{l.mode === 'rent' ? 'For rent' : 'For sale'}</span></p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Neighborhoods */}
      <section id="neighborhoods" className="mt-28 scroll-mt-24 bg-chalk py-20" aria-label="Neighborhoods">
        <div className="mx-auto max-w-page px-5 sm:px-8">
          <SectionHead n="02" title="Know the ground" kicker="Austin is a city of very different small places. Start with the one that fits how you want to spend a Saturday." />
          <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
            {neighborhoods.map((h, k) => (
              <li key={h.slug} className={`group relative ${k % 2 === 1 ? 'lg:mt-16' : ''}`}>
                <div className="overflow-hidden"><Img name={h.photo} alt="" sizes="(min-width:1024px) 16vw, 50vw" className="aspect-[4/5] w-full transition duration-700 group-hover:scale-[1.04]" /></div>
                <h3 className="mt-4 font-serif text-2xl leading-tight"><Link to={`/search?area=${h.slug}${h.slug === 'downtown' ? '&mode=rent' : ''}`} className="stretched">{h.name}</Link></h3>
                <p className="mt-1 text-xs font-medium tabular-nums text-oak">{h.median} · {h.listings} listings</p>
                <p className="mt-2 text-[13px] leading-relaxed text-graphite">{h.blurb}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Agents */}
      <section className="mx-auto mt-28 max-w-page px-5 sm:px-8" aria-label="Our agents">
        <SectionHead n="03" title="Six agents. No call center." kicker="Every client works with one person from first viewing to closing day. You’ll have their cell number." action={{ to: '/agents', label: 'Meet the team' }} />
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {agents.map((a) => (
            <li key={a.id} className="group relative">
              <div className="overflow-hidden bg-mist"><Img name={a.photo} alt={`Portrait of ${a.name}`} sizes="(min-width:1024px) 16vw, 45vw" className="aspect-[4/5] w-full grayscale transition duration-500 group-hover:grayscale-0" /></div>
              <h3 className="mt-3 font-serif text-2xl leading-tight"><Link to={`/agents#${a.id}`} className="stretched">{a.name}</Link></h3>
              <p className="text-[13px] text-graphite">{a.title}</p>
            </li>
          ))}
        </ul>
      </section>

      <Testimonials />

      {/* Sell CTA */}
      <section className="mx-auto mt-28 max-w-page px-5 sm:px-8">
        <div className="grid overflow-hidden bg-oak text-chalk md:grid-cols-2">
          <div className="flex flex-col justify-between gap-10 p-8 md:p-14">
            <p className="text-[11px] font-semibold uppercase tracking-label text-chalk/70">05 — Selling</p>
            <div>
              <h2 className="font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl">Thinking of selling this year?</h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-chalk/80">We’ll walk the house with you, tell you honestly what it’s worth, and show you three recent sales that prove it. No obligation, no automated “home value” email.</p>
            </div>
            <Link to="/contact?topic=selling" className="inline-flex items-center gap-3 self-start bg-chalk px-6 py-3.5 font-medium text-ink transition hover:bg-limestone">Book a valuation <Arrow size={18} /></Link>
          </div>
          <Img name="ext-5524166" alt="" sizes="(min-width:768px) 50vw, 100vw" className="h-full min-h-[18rem] w-full" />
        </div>
      </section>
    </>
  )
}
