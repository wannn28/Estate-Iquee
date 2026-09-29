import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { useFavorites } from '../lib/favorites'
import Logo from './Logo'
import { Close, Heart, Menu } from './Icons'

const NAV = [
  { to: '/search', label: 'Buy', match: (p: string, m: string | null) => p === '/search' && m !== 'rent' },
  { to: '/search?mode=rent', label: 'Rent', match: (p: string, m: string | null) => p === '/search' && m === 'rent' },
  { to: '/#neighborhoods', label: 'Neighborhoods', match: () => false },
  { to: '/agents', label: 'Agents', match: (p: string) => p === '/agents' },
  { to: '/contact', label: 'Contact', match: (p: string) => p === '/contact' },
]

function DemoBar() {
  return (
    <div className="bg-ink text-chalk">
      <p className="mx-auto max-w-page px-5 py-2 text-center text-[12px] tracking-wide sm:px-8">
        <span className="mr-2 bg-oak px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-label">Demo</span>
        Portfolio project by <a href="https://iquee.tech" className="underline decoration-chalk/40 underline-offset-2 hover:decoration-chalk">iQuee</a>. Listings, agents and prices are fictional.
      </p>
    </div>
  )
}

function Header() {
  const { pathname, hash } = useLocation()
  const [sp] = useSearchParams()
  const { saved } = useFavorites()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname, sp, hash])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])
  const mode = sp.get('mode')
  const link = (n: (typeof NAV)[number]) => (
    <Link key={n.label} to={n.to} aria-current={n.match(pathname, mode) ? 'page' : undefined}
      className={`relative py-1 text-[15px] transition hover:text-oak ${n.match(pathname, mode) ? 'text-ink after:absolute after:-bottom-[1.2rem] after:left-0 after:right-0 after:h-[2px] after:bg-oak' : 'text-ink/75'}`}>
      {n.label}
    </Link>
  )
  return (
    <header className="sticky top-0 z-[1000] border-b border-rule bg-limestone/95 backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-page items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" aria-label="Hollis Row home"><Logo /></Link>
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">{NAV.map(link)}</nav>
        <div className="flex items-center gap-2">
          <NavLink to="/saved" aria-label={`Saved homes (${saved.length})`}
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2 text-[15px] transition hover:text-oak ${isActive ? 'text-oak' : ''}`}>
            <Heart size={19} filled={saved.length > 0} className={saved.length ? 'text-oak' : ''} />
            <span className="hidden sm:inline">Saved</span>
            <span className="min-w-[1.25rem] bg-ink px-1 text-center text-[11px] font-semibold tabular-nums text-chalk">{saved.length}</span>
          </NavLink>
          <Link to="/contact?topic=selling" className="hidden border border-ink px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-chalk md:inline-block">Sell with us</Link>
          <button type="button" className="grid h-10 w-10 place-items-center lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="fixed inset-x-0 bottom-0 top-[4.5rem] overflow-y-auto border-t border-rule bg-limestone px-5 pb-10 pt-4 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.label} to={n.to} className="flex items-center justify-between border-b border-rule py-4 font-serif text-3xl">{n.label}<span aria-hidden className="text-base text-graphite">→</span></Link>
          ))}
          <Link to="/saved" className="flex items-center justify-between border-b border-rule py-4 font-serif text-3xl">Saved homes <span className="font-sans text-base tabular-nums text-graphite">{saved.length}</span></Link>
          <Link to="/contact?topic=selling" className="mt-8 block bg-oak px-5 py-4 text-center font-medium text-chalk">Sell with us</Link>
        </nav>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-rule bg-limestone">
      <div className="mx-auto max-w-page px-5 pt-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-graphite">An independent Austin brokerage since 2011. Six agents, one office on East 11th, and a habit of writing honest listings.</p>
          </div>
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-label text-graphite">Search</h2>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              <li><Link className="hover:text-oak" to="/search">Homes for sale</Link></li>
              <li><Link className="hover:text-oak" to="/search?mode=rent">Homes for rent</Link></li>
              <li><Link className="hover:text-oak" to="/search?view=map">Map search</Link></li>
              <li><Link className="hover:text-oak" to="/saved">Saved homes</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-label text-graphite">Company</h2>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              <li><Link className="hover:text-oak" to="/agents">Our agents</Link></li>
              <li><Link className="hover:text-oak" to="/contact?topic=selling">Sell with us</Link></li>
              <li><Link className="hover:text-oak" to="/contact">Contact</Link></li>
            </ul>
          </div>
          <address className="not-italic">
            <h2 className="text-[11px] font-semibold uppercase tracking-label text-graphite">Office</h2>
            <p className="mt-4 text-[15px] leading-relaxed">1109 E 11th St<br />Austin, TX 78702<br /><span className="tabular-nums">(512) 555-0100</span></p>
          </address>
        </div>
        <p className="mt-16 select-none font-serif text-[clamp(4rem,15vw,13rem)] leading-[0.8] tracking-tight text-ink" aria-hidden>Hollis Row</p>
        <div className="mt-8 flex flex-col gap-3 border-t border-rule py-6 text-[13px] text-graphite md:flex-row md:justify-between">
          <p><strong className="font-semibold text-ink">Demo website.</strong> Hollis Row is a fictional brokerage; listings, people, prices and addresses are invented. Nothing is for sale.</p>
          <p>Design &amp; build by <a className="underline underline-offset-2 hover:text-oak" href="https://iquee.tech">iQuee</a> · Photos: Pexels · Maps © OpenStreetMap</p>
        </div>
      </div>
    </footer>
  )
}

export default function Layout() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) { el.scrollIntoView(); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:bg-ink focus:px-4 focus:py-2 focus:text-chalk">Skip to content</a>
      <DemoBar />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
