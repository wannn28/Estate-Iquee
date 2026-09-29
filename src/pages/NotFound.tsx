import { Link } from 'react-router-dom'
import { useTitle } from '../lib/useTitle'

export default function NotFound() {
  useTitle('Page not found')
  return (
    <div className="mx-auto max-w-page px-5 py-28 sm:px-8">
      <p className="text-sm font-medium text-oak">404</p>
      <h1 className="mt-3 max-w-3xl font-serif text-7xl leading-[0.9] tracking-tight">This address isn’t on our books.</h1>
      <p className="mt-5 text-lg text-graphite">The page may have moved, or the home has already sold.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/search" className="bg-oak px-5 py-3 font-medium text-chalk">Browse homes</Link>
        <Link to="/" className="border border-ink px-5 py-3 font-medium">Home</Link>
      </div>
    </div>
  )
}
