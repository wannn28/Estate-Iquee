import type { ApiError } from '../lib/api'

export function Loading({ label = 'Loading…', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 py-16 text-sm text-graphite ${className}`} role="status" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-oak border-t-transparent" aria-hidden />
      {label}
    </div>
  )
}

export function ErrorBox({ error, retry, className = '' }: { error: ApiError | Error; retry?: () => void; className?: string }) {
  return (
    <div className={`border-l-4 border-[#B3261E] bg-[#B3261E]/5 px-5 py-4 text-sm ${className}`} role="alert">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 text-ink/80">{error.message}</p>
      {retry && <button type="button" onClick={retry} className="mt-3 font-medium underline underline-offset-4">Try again</button>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-mist ${className}`} aria-hidden />
}
