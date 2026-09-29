import { useCallback, useEffect, useRef, useState } from 'react'
import { roomOf } from '../lib/format'
import { ArrowLeft, Arrow, Close } from './Icons'

interface Props {
  photos: string[]
  start: number
  title: string
  onClose: () => void
}

export default function Lightbox({ photos, start, title, onClose }: Props) {
  const [i, setI] = useState(start)
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const go = useCallback((d: number) => setI((x) => (x + d + photos.length) % photos.length), [photos.length])

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button')
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus() }
  }, [go, onClose])

  // swipe
  const touch = useRef<number | null>(null)
  const p = photos[i]
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={`${title} photo gallery`} className="fixed inset-0 z-[3000] flex flex-col bg-[#10100E] text-chalk"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null }}>
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <p className="text-sm"><span className="font-serif text-xl">{title}</span><span className="ml-3 tabular-nums text-chalk/60" aria-live="polite">{i + 1} / {photos.length} · {roomOf(p)}</span></p>
        <button ref={closeRef} type="button" onClick={onClose} className="flex items-center gap-2 border border-chalk/30 px-3 py-2 text-sm hover:border-chalk" aria-label="Close gallery">
          <Close size={18} /> <span className="hidden sm:inline">Close</span>
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20">
        <img key={p} src={`/images/${p}-1600.webp`} alt={`${title} — ${roomOf(p)} (photo ${i + 1} of ${photos.length})`} className="max-h-full max-w-full object-contain" />
        <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-chalk/10 hover:bg-chalk/20 sm:left-6"><ArrowLeft /></button>
        <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-chalk/10 hover:bg-chalk/20 sm:right-6"><Arrow /></button>
      </div>
      <div className="flex justify-center gap-2 overflow-x-auto px-5 py-4">
        {photos.map((ph, k) => (
          <button key={ph + k} type="button" onClick={() => setI(k)} aria-label={`Show photo ${k + 1}: ${roomOf(ph)}`} aria-current={k === i}
            className={`shrink-0 transition ${k === i ? 'opacity-100 outline outline-2 outline-offset-2 outline-chalk' : 'opacity-50 hover:opacity-90'}`}>
            <img src={`/images/${ph}-800.webp`} alt="" className="h-14 w-20 object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
