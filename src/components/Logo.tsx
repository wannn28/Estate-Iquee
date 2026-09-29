export function Mark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" fill="#1D5C3F" />
      <path d="M6.5 14.5 16 6.5l9.5 8M10.5 13v12.5M21.5 13v12.5M10.5 19.5h11" fill="none" stroke="#FAFAF7" strokeWidth="2.2" strokeLinecap="square" />
    </svg>
  )
}

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      <span className="flex flex-col leading-none">
        <span className={`font-serif text-[1.65rem] tracking-tight ${light ? 'text-chalk' : 'text-ink'}`}>Hollis Row</span>
        <span className={`mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.28em] ${light ? 'text-chalk/70' : 'text-graphite'}`}>Austin · Real Estate</span>
      </span>
    </span>
  )
}
