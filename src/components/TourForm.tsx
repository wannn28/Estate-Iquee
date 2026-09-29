import { useMemo, useRef, useState, type FormEvent } from 'react'
import type { Listing } from '../data/listings'
import type { Agent } from '../data/agents'
import Field from './Field'
import { aria, EMAIL_RE, inputCls, PHONE_RE } from '../lib/forms'
import { Check } from './Icons'
import { api, ApiError } from '../lib/api'
import { useFavorites } from '../lib/favorites'

const TIMES = ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM', '6:00 PM']

interface State { date: string; time: string; kind: 'in-person' | 'video'; name: string; email: string; phone: string; note: string; consent: boolean }
type Errors = Partial<Record<keyof State, string>>

export default function TourForm({ l, agent }: { l: Listing; agent?: Agent }) {
  const days = useMemo(() => {
    const out: Date[] = []
    const d = new Date()
    for (let k = 1; out.length < 7; k++) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k); if (x.getDay() !== 0) out.push(x) }
    return out
  }, [])
  const [s, setS] = useState<State>({ date: '', time: '', kind: 'in-person', name: '', email: '', phone: '', note: '', consent: false })
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState<null | (State & { ref: number })>(null)
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const { clientId } = useFavorites()
  const summaryRef = useRef<HTMLDivElement>(null)
  const set = <K extends keyof State>(k: K, v: State[K]) => { setS((p) => ({ ...p, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })) }

  function validate(v: State): Errors {
    const e: Errors = {}
    if (!v.date) e.date = 'Choose a day for the tour.'
    if (!v.time) e.time = 'Choose a time.'
    if (v.name.trim().length < 2) e.name = 'Enter your full name.'
    if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email, like name@example.com.'
    if (v.phone.trim() && !PHONE_RE.test(v.phone.trim())) e.phone = 'Use digits, spaces, + ( ) or -.'
    if (!v.consent) e.consent = 'Please confirm you understand this is a demo.'
    return e
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    if (busy) return
    const e = validate(s)
    setErrors(e)
    setFormErr('')
    if (Object.keys(e).length) { requestAnimationFrame(() => summaryRef.current?.focus()); return }
    setBusy(true)
    try {
      const r = await api<{ id: number }>('/tour-requests', { method: 'POST', body: { listingId: l.id, ...s, clientId, website } })
      setSent({ ...s, ref: r.id })
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields as Errors)
        requestAnimationFrame(() => summaryRef.current?.focus())
      } else {
        setFormErr(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (sent)
    return (
      <div className="border border-oak bg-oak-light/60 p-6" role="status" data-testid="tour-success">
        <span className="grid h-10 w-10 place-items-center bg-oak text-chalk"><Check /></span>
        <h3 className="mt-4 font-serif text-3xl leading-tight">Tour requested</h3>
        <p className="mt-2 text-[15px] leading-relaxed">{sent.kind === 'video' ? 'Video tour' : 'In-person tour'} of <strong>{l.title}</strong> on {fmt(sent.date)} at {sent.time}. {agent ? `${agent.name.split(' ')[0]} would confirm by email within a few hours.` : ''}</p>
        <p className="mt-3 text-xs text-graphite">Saved to the Hollis Row database{sent.ref ? ` as request #${sent.ref}` : ''}. This is a demo, so no email goes out and no one will call; requests are deleted automatically after 14 days.</p>
        <button type="button" className="mt-5 text-sm font-medium underline underline-offset-4" onClick={() => { setSent(null); setS((p) => ({ ...p, date: '', time: '' })) }}>Book another time</button>
      </div>
    )

  const errList = Object.entries(errors).filter(([, v]) => v)
  return (
    <form onSubmit={submit} noValidate className="relative space-y-5" data-testid="tour-form" aria-labelledby="tour-h">
      {errList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} className="border-l-4 border-[#B3261E] bg-[#B3261E]/5 px-4 py-3 text-sm outline-none" role="alert">
          <p className="font-semibold">Please fix {errList.length === 1 ? '1 field' : `${errList.length} fields`}:</p>
          <ul className="mt-1 list-disc pl-5 text-[13px]">{errList.map(([k, v]) => <li key={k}>{v}</li>)}</ul>
        </div>
      )}
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Tour type</legend>
        <div className="grid grid-cols-2 border border-ink/20">
          {(['in-person', 'video'] as const).map((k) => (
            <label key={k} className={`cursor-pointer py-2.5 text-center text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${s.kind === k ? 'bg-ink text-chalk' : 'hover:bg-limestone'}`}>
              <input type="radio" name="kind" className="sr-only" checked={s.kind === k} onChange={() => set('kind', k)} />{k === 'video' ? 'Video call' : 'In person'}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0" aria-describedby={errors.date ? 'tour-date-err' : undefined}>
        <legend className="mb-2 text-[13px] font-medium">Day</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const on = s.date === iso
            return (
              <label key={iso} className={`flex min-w-0 cursor-pointer flex-col items-center border py-2 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${on ? 'border-oak bg-oak text-chalk' : errors.date ? 'border-[#B3261E]/60' : 'border-ink/20 hover:border-ink'}`}>
                <input type="radio" name="date" value={iso} className="sr-only" checked={on} onChange={() => set('date', iso)} />
                <span className="text-[10px] font-semibold uppercase tracking-label">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="font-serif text-2xl leading-tight">{d.getDate()}</span>
                <span className="text-[10px] uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
              </label>
            )
          })}
        </div>
        {errors.date && <p id="tour-date-err" className="mt-1.5 text-xs font-medium text-[#B3261E]">{errors.date}</p>}
      </fieldset>
      <Field id="tour-time" label="Time" error={errors.time}>
        <select {...aria('tour-time', errors.time)} value={s.time} onChange={(e) => set('time', e.target.value)} className={inputCls(errors.time)}>
          <option value="">Select a time</option>
          {TIMES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field id="tour-name" label="Full name" error={errors.name}>
        <input {...aria('tour-name', errors.name)} autoComplete="name" value={s.name} onChange={(e) => set('name', e.target.value)} className={inputCls(errors.name)} />
      </Field>
      <Field id="tour-email" label="Email" error={errors.email}>
        <input {...aria('tour-email', errors.email)} type="email" autoComplete="email" value={s.email} onChange={(e) => set('email', e.target.value)} className={inputCls(errors.email)} />
      </Field>
      <Field id="tour-phone" label="Phone" optional error={errors.phone}>
        <input {...aria('tour-phone', errors.phone)} type="tel" autoComplete="tel" value={s.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls(errors.phone)} />
      </Field>
      <Field id="tour-note" label="Anything we should know?" optional>
        <textarea id="tour-note" rows={3} value={s.note} onChange={(e) => set('note', e.target.value)} className={inputCls()} placeholder="Pre-approved, relocating, bringing a dog…" />
      </Field>
      <div>
        <label className="flex items-start gap-3 text-[13px] leading-snug">
          <input type="checkbox" checked={s.consent} onChange={(e) => set('consent', e.target.checked)} aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? 'tour-consent-err' : undefined} className="mt-0.5 h-4 w-4 accent-[#1D5C3F]" />
          I understand this is a demo site and no tour will actually be booked.
        </label>
        {errors.consent && <p id="tour-consent-err" className="mt-1.5 text-xs font-medium text-[#B3261E]">{errors.consent}</p>}
      </div>
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>Website <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" /></label>
      </div>
      {formErr && <p className="border-l-4 border-[#B3261E] bg-[#B3261E]/5 px-4 py-3 text-sm" role="alert">{formErr}</p>}
      <button type="submit" disabled={busy} className="w-full bg-oak px-5 py-3.5 font-medium text-chalk transition hover:bg-oak-dark disabled:opacity-60">{busy ? 'Sending…' : 'Request tour'}</button>
    </form>
  )
}
