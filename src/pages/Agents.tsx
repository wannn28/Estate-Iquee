import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCatalog } from '../lib/catalog'
import { ErrorBox, Loading } from '../components/States'
import { useTitle } from '../lib/useTitle'
import Img from '../components/Img'
import { Mail, Phone } from '../components/Icons'

export default function Agents() {
  useTitle('Our agents')
  const { agents, loading, error, reload } = useCatalog()
  const { hash } = useLocation()
  useEffect(() => { // agents arrive async, so jump to /agents#id once they have rendered
    if (hash && agents.length) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [hash, agents.length])
  return (
    <div className="mx-auto max-w-page px-5 pt-10 sm:px-8">
      <header className="grid gap-8 border-b border-ink pb-10 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-oak">The team</p>
          <h1 className="mt-2 font-serif text-[clamp(3rem,7vw,6rem)] leading-[0.9] tracking-tight">Six people who <em>know the streets.</em></h1>
        </div>
        <p className="max-w-lg text-lg leading-relaxed text-graphite lg:justify-self-end">No teams of juniors, no hand-offs. Each agent below takes a limited number of clients a year, and works each of them personally from first viewing to closing.</p>
      </header>
      {error && !agents.length && <ErrorBox error={error} retry={reload} className="mt-10" />}
      {loading && !agents.length && <Loading label="Loading agents…" />}
      <ol>
        {agents.map((a, k) => {
          return (
            <li key={a.id} id={a.id} className="grid scroll-mt-24 gap-8 border-b border-rule py-12 md:grid-cols-[14rem_1fr] lg:grid-cols-[18rem_1fr_16rem]">
              <Img name={a.photo} alt={`Portrait of ${a.name}`} sizes="(min-width:1024px) 18rem, 14rem" className="aspect-[4/5] w-full max-w-[18rem]" />
              <div>
                <p className="text-sm tabular-nums text-oak">{String(k + 1).padStart(2, '0')}</p>
                <h2 className="mt-1 font-serif text-5xl leading-none tracking-tight">{a.name}</h2>
                <p className="mt-2 text-graphite">{a.title}</p>
                <p className="mt-6 max-w-prose text-[17px] leading-relaxed">{a.bio}</p>
                <blockquote className="mt-6 border-l-2 border-oak pl-4 font-serif text-2xl italic leading-snug">“{a.quote}”</blockquote>
                <div className="mt-6 flex flex-wrap gap-2">
                  {a.areas.map((x) => <span key={x} className="border border-ink/20 px-2.5 py-1 text-[13px]">{x}</span>)}
                </div>
              </div>
              <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-1">
                <dl className="grid grid-cols-3 border-y border-rule lg:grid-cols-1">
                  <div className="py-3"><dt className="text-[11px] font-semibold uppercase tracking-label text-graphite">Homes closed</dt><dd className="font-serif text-4xl tabular-nums">{a.sold}</dd></div>
                  <div className="py-3 lg:border-t lg:border-rule"><dt className="text-[11px] font-semibold uppercase tracking-label text-graphite">Avg. days to contract</dt><dd className="font-serif text-4xl tabular-nums">{a.avgDays}</dd></div>
                  <div className="py-3 lg:border-t lg:border-rule"><dt className="text-[11px] font-semibold uppercase tracking-label text-graphite">With Hollis Row since</dt><dd className="font-serif text-4xl tabular-nums">{a.since}</dd></div>
                </dl>
                <p className="text-[13px] text-graphite">Speaks {a.languages.join(', ')}</p>
                <div className="space-y-1.5 text-[15px]">
                  <a href={`tel:${a.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 hover:text-oak"><Phone size={16} />{a.phone}</a>
                  <a href={`mailto:${a.email}`} className="flex items-center gap-2 hover:text-oak"><Mail size={16} />{a.email}</a>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to={`/contact?agent=${a.id}`} className="bg-oak px-4 py-2.5 text-sm font-medium text-chalk hover:bg-oak-dark">Message {a.name.split(' ')[0]}</Link>
                  {a.activeListings > 0 && <Link to={`/search?agent=${a.id}${a.rentOnly ? '&mode=rent' : ''}`} className="border border-ink/25 px-4 py-2.5 text-sm hover:border-ink">{a.activeListings} active listings</Link>}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
