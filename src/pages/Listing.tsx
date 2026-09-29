import { lazy, Suspense, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listingBySlug, similarTo } from '../data/listings'
import { agentById } from '../data/agents'
import { bathLabel, num, priceLabel, roomOf, usd } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import Img from '../components/Img'
import ListingCard, { Tag } from '../components/ListingCard'
import SaveButton from '../components/SaveButton'
import Lightbox from '../components/Lightbox'
import FloorPlan from '../components/FloorPlan'
import MortgageCalc from '../components/MortgageCalc'
import TourForm from '../components/TourForm'
import { Check, Expand, Mail, Phone } from '../components/Icons'
import NotFound from './NotFound'

const ListingMap = lazy(() => import('../components/ListingMap'))

const NEARBY: Record<string, [string, string][]> = {
  default: [['Grocery', '6 min walk'], ['Coffee', '4 min walk'], ['Park or trail', '8 min walk'], ['Downtown', '12 min drive'], ['Airport (AUS)', '20 min drive']],
}

function H2({ children, id }: { children: string; id?: string }) {
  return <h2 id={id} className="border-t border-ink pt-4 font-serif text-4xl leading-none tracking-tight">{children}</h2>
}

export default function Listing() {
  const { slug = '' } = useParams()
  const l = listingBySlug(slug)
  const [lb, setLb] = useState<number | null>(null)
  useTitle(l ? `${l.title}, ${l.address}` : 'Listing not found')
  if (!l) return <NotFound />
  const agent = agentById(l.agentId)
  const similar = similarTo(l)
  const ppsf = l.mode === 'buy' ? usd(l.price / l.sqft) : `$${(l.price / l.sqft).toFixed(2)}`
  const facts: [string, string][] = [
    ['Bedrooms', String(l.beds)],
    ['Bathrooms', bathLabel(l.baths)],
    ['Interior', `${num(l.sqft)} sq ft`],
    ['Lot', l.lotAcres ? `${l.lotAcres} acres` : '—'],
    ['Type', l.type],
    ['Built', String(l.year)],
    ['Parking', l.parking],
    [l.mode === 'buy' ? 'Price / sq ft' : 'Rent / sq ft', ppsf],
    ...(l.mode === 'rent' ? ([['Available', l.available ?? 'Now']] as [string, string][]) : ([['HOA', l.hoa ? `${usd(l.hoa)}/mo` : 'None']] as [string, string][])),
    ['On Hollis Row', l.daysListed === 1 ? '1 day' : `${l.daysListed} days`],
  ]
  const shown = l.photos.slice(0, 5)

  return (
    <article className="mx-auto max-w-page px-5 pt-6 sm:px-8">
      <nav aria-label="Breadcrumb" className="text-[13px] text-graphite">
        <ol className="flex flex-wrap gap-2">
          <li><Link to="/" className="hover:text-ink">Home</Link> /</li>
          <li><Link to={`/search${l.mode === 'rent' ? '?mode=rent' : ''}`} className="hover:text-ink">{l.mode === 'rent' ? 'For rent' : 'For sale'}</Link> /</li>
          <li aria-current="page" className="text-ink">{l.title}</li>
        </ol>
      </nav>

      <header className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Tag l={l} />
            <p className="text-[11px] font-semibold uppercase tracking-label text-oak">{l.neighborhood} · {l.type} · {l.mode === 'rent' ? 'For rent' : 'For sale'}</p>
          </div>
          <h1 className="mt-3 font-serif text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] tracking-tight">{l.title}</h1>
          <p className="mt-3 text-lg text-graphite">{l.address}, Austin, TX {l.zip}</p>
        </div>
        <div className="flex flex-col gap-4 lg:items-end">
          <p className="text-4xl font-semibold tabular-nums">{priceLabel(l)}</p>
          <div className="flex gap-3">
            <SaveButton id={l.id} title={l.title} variant="inline" />
            <a href="#tour" className="bg-oak px-5 py-2.5 text-sm font-medium text-chalk hover:bg-oak-dark">Schedule a tour</a>
          </div>
        </div>
      </header>

      {/* Gallery */}
      <div className="relative mt-8 grid gap-2 md:grid-cols-4 md:grid-rows-2" data-testid="gallery">
        {shown.map((p, k) => (
          <button key={p} type="button" onClick={() => setLb(k)} aria-label={`Open photo ${k + 1}: ${roomOf(p)}`}
            className={`group relative overflow-hidden ${k === 0 ? 'md:col-span-2 md:row-span-2' : 'hidden md:block'}`}>
            <Img name={p} eager={k === 0} alt={`${l.title} — ${roomOf(p)}`} sizes={k === 0 ? '(min-width:768px) 50vw, 100vw' : '25vw'} className={`h-full w-full transition duration-700 group-hover:scale-[1.03] ${k === 0 ? 'aspect-[3/2]' : 'aspect-[3/2] md:aspect-auto'}`} />
          </button>
        ))}
        <button type="button" onClick={() => setLb(0)} className="absolute bottom-4 right-4 flex items-center gap-2 bg-chalk px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-limestone" data-testid="open-lightbox">
          <Expand size={17} /> View all {l.photos.length} photos
        </button>
      </div>

      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-16">
          <section aria-labelledby="facts-h">
            <h2 id="facts-h" className="sr-only">Key facts</h2>
            <dl className="grid grid-cols-2 border-l border-t border-rule sm:grid-cols-3 xl:grid-cols-5">
              {facts.map(([k, v]) => (
                <div key={k} className="border-b border-r border-rule px-4 py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-label text-graphite">{k}</dt>
                  <dd className="mt-1.5 text-lg tabular-nums leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="about-h">
            <H2 id="about-h">About the home</H2>
            <p className="mt-6 font-serif text-3xl leading-tight">{l.summary}</p>
            {l.description.map((p, k) => <p key={k} className="mt-5 max-w-prose text-[17px] leading-relaxed text-ink/85">{p}</p>)}
          </section>

          <section aria-labelledby="amen-h">
            <H2 id="amen-h">Features & amenities</H2>
            <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
              {l.amenities.map((a) => <li key={a} className="flex items-center gap-3 border-b border-rule py-3 text-[15px]"><Check size={18} className="text-oak" />{a}</li>)}
              <li className="flex items-center gap-3 border-b border-rule py-3 text-[15px]"><Check size={18} className="text-oak" />Central air & heating</li>
            </ul>
          </section>

          <section aria-labelledby="plan-h">
            <H2 id="plan-h">Floor plan</H2>
            <div className="mt-6"><FloorPlan l={l} /></div>
          </section>

          <section aria-labelledby="loc-h">
            <H2 id="loc-h">Location</H2>
            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_15rem]">
              <div className="h-80 border border-rule">
                <Suspense fallback={<div className="grid h-full place-items-center bg-mist text-sm text-graphite">Loading map…</div>}>
                  <ListingMap items={[l]} single label={`Map showing the approximate location of ${l.title}`} />
                </Suspense>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-label text-graphite">Nearby</p>
                <dl className="mt-2 text-[15px]">
                  {NEARBY.default.map(([k, v]) => <div key={k} className="flex justify-between border-b border-rule py-2.5"><dt>{k}</dt><dd className="text-graphite">{v}</dd></div>)}
                </dl>
                <p className="mt-3 text-xs text-graphite">Approximate location shown. Demo data.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="calc-h">
            <H2 id="calc-h">{l.mode === 'buy' ? 'Monthly cost calculator' : 'Move-in costs'}</H2>
            <div className="mt-6">
              {l.mode === 'buy' ? <MortgageCalc price={l.price} hoa={l.hoa ?? 0} /> : (
                <div className="border border-rule bg-chalk p-6 md:p-8">
                  <dl className="divide-y divide-rule text-[15px]">
                    {([['First month’s rent', l.price], ['Security deposit (1 month)', l.price], ['Application fee (per adult)', 65], ['Pet deposit, if applicable', 400]] as [string, number][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-3"><dt>{k}</dt><dd className="tabular-nums">{usd(v)}</dd></div>
                    ))}
                  </dl>
                  <p className="mt-4 flex justify-between border-t border-ink pt-4 text-lg"><span>Due at signing</span><span className="font-serif text-4xl tabular-nums">{usd(l.price * 2 + 65)}</span></p>
                  <p className="mt-3 text-xs text-graphite">Typical Austin terms, shown for illustration. Recommended income: {usd(l.price * 3)}/mo (3× rent).</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Agent and tour booking">
          {agent && (
            <div className="flex gap-4 border-b border-rule pb-6">
              <Img name={agent.photo} alt={`Portrait of ${agent.name}`} sizes="6rem" className="aspect-[4/5] w-24 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-label text-graphite">Listed by</p>
                <p className="font-serif text-2xl leading-tight"><Link to={`/agents#${agent.id}`} className="hover:text-oak">{agent.name}</Link></p>
                <p className="text-[13px] text-graphite">{agent.title}</p>
                <div className="mt-2 space-y-1 text-[13px]">
                  <a href={`tel:${agent.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 hover:text-oak"><Phone size={15} />{agent.phone}</a>
                  <a href={`mailto:${agent.email}`} className="flex items-center gap-2 truncate hover:text-oak"><Mail size={15} />{agent.email}</a>
                </div>
              </div>
            </div>
          )}
          <div id="tour" className="scroll-mt-24 pt-6">
            <h2 id="tour-h" className="font-serif text-3xl leading-none">Schedule a tour</h2>
            <p className="mb-5 mt-2 text-sm text-graphite">Pick a day and time; {agent?.name.split(' ')[0] ?? 'we'} will confirm.</p>
            <TourForm l={l} agent={agent} />
          </div>
        </aside>
      </div>

      <section className="mt-24" aria-labelledby="sim-h">
        <div className="flex items-end justify-between border-t border-ink pt-4">
          <h2 id="sim-h" className="font-serif text-4xl leading-none tracking-tight">Similar {l.mode === 'rent' ? 'rentals' : 'homes'}</h2>
          <Link to={`/search${l.mode === 'rent' ? '?mode=rent' : ''}`} className="text-sm font-medium hover:text-oak">See all</Link>
        </div>
        <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((s) => <ListingCard key={s.id} l={s} sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw" />)}
        </div>
      </section>

      <p className="mt-16 text-xs text-graphite">Listing {l.id}. Demo content: this property, its price and description are fictional; photos are stock images from Pexels and do not show a real listing.</p>

      {lb !== null && <Lightbox photos={l.photos} start={lb} title={l.title} onClose={() => setLb(null)} />}
    </article>
  )
}
