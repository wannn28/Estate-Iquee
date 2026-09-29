import { Link } from 'react-router-dom'
import { listings } from '../data/listings'
import { useFavorites } from '../lib/favorites'
import { priceLabel } from '../lib/format'
import { useTitle } from '../lib/useTitle'
import ListingCard from '../components/ListingCard'

export default function Saved() {
  useTitle('Saved homes')
  const { saved, clear } = useFavorites()
  const items = saved.map((id) => listings.find((l) => l.id === id)).filter((l): l is (typeof listings)[number] => !!l)
  const buy = items.filter((l) => l.mode === 'buy')
  const rent = items.filter((l) => l.mode === 'rent')
  return (
    <div className="mx-auto max-w-page px-5 pt-10 sm:px-8">
      <div className="flex flex-col gap-4 border-b border-ink pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-label text-oak">Your shortlist</p>
          <h1 className="mt-2 font-serif text-6xl leading-[0.92] tracking-tight">Saved homes</h1>
          <p className="mt-3 text-graphite">{items.length ? `${items.length} saved · stored in this browser only` : 'Nothing saved yet.'}</p>
        </div>
        {items.length > 0 && (
          <button type="button" onClick={() => { if (confirm('Remove all saved homes?')) clear() }} className="self-start border border-ink/25 px-4 py-2.5 text-sm hover:border-ink md:self-auto">Clear all</button>
        )}
      </div>
      {!items.length ? (
        <div className="grid gap-10 py-16 md:grid-cols-2">
          <p className="font-serif text-4xl leading-tight">Tap the heart on any listing to keep it here. We don’t ask you to sign up.</p>
          <div className="flex items-start gap-3 md:justify-end">
            <Link to="/search" className="bg-oak px-5 py-3 font-medium text-chalk">Browse homes for sale</Link>
            <Link to="/search?mode=rent" className="border border-ink px-5 py-3 font-medium">Rentals</Link>
          </div>
        </div>
      ) : (
        <>
          {[['For sale', buy], ['For rent', rent]].map(([label, arr]) => (arr as typeof items).length > 0 && (
            <section key={label as string} className="mt-10" aria-label={label as string}>
              <h2 className="text-[11px] font-semibold uppercase tracking-label text-graphite">{label as string} · {(arr as typeof items).length}</h2>
              <div className="mt-2 border-b border-rule">{(arr as typeof items).map((l) => <ListingCard key={l.id} l={l} layout="list" />)}</div>
            </section>
          ))}
          <div className="mt-12 border border-rule bg-chalk p-6">
            <p className="font-serif text-2xl">Compare at a glance</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead><tr className="border-b border-ink text-[11px] uppercase tracking-label text-graphite"><th className="py-2 pr-4 font-semibold">Home</th><th className="py-2 pr-4 font-semibold">Price</th><th className="py-2 pr-4 font-semibold">Beds</th><th className="py-2 pr-4 font-semibold">Baths</th><th className="py-2 pr-4 font-semibold">Sq ft</th><th className="py-2 font-semibold">Neighborhood</th></tr></thead>
                <tbody>
                  {items.map((l) => (
                    <tr key={l.id} className="border-b border-rule tabular-nums">
                      <td className="py-2.5 pr-4"><Link to={`/listing/${l.slug}`} className="font-medium hover:text-oak">{l.title}</Link></td>
                      <td className="py-2.5 pr-4">{priceLabel(l)}</td><td className="py-2.5 pr-4">{l.beds}</td><td className="py-2.5 pr-4">{l.baths}</td><td className="py-2.5 pr-4">{l.sqft.toLocaleString('en-US')}</td><td className="py-2.5">{l.neighborhood}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
