import type { ReactNode } from 'react'

export default function Field({ id, label, error, hint, children, optional }: { id: string; label: string; error?: string; hint?: string; children: ReactNode; optional?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex justify-between text-[13px] font-medium">
        {label}
        {optional && <span className="font-normal text-graphite">Optional</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-graphite">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1.5 text-xs font-medium text-[#B3261E]">{error}</p>}
    </div>
  )
}
