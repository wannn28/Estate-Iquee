import { lazy, Suspense, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { agents, agentById } from '../data/agents'
import type { Listing } from '../data/listings'
import { useTitle } from '../lib/useTitle'
import Field from '../components/Field'
import { aria, EMAIL_RE, inputCls, PHONE_RE } from '../lib/forms'
import { Check } from '../components/Icons'

const ListingMap = lazy(() => import('../components/ListingMap'))
const TOPICS = [['buying', 'Buying a home'], ['selling', 'Selling a home'], ['renting', 'Renting'], ['other', 'Something else']] as const
type Topic = (typeof TOPICS)[number][0]

const OFFICE = { id: 'office', slug: '', title: 'Hollis Row office', lat: 30.2689, lng: -97.7277 } as unknown as Listing

export default function Contact() {
  useTitle('Contact')
  const [sp] = useSearchParams()
  const initTopic = (TOPICS.find(([k]) => k === sp.get('topic'))?.[0] ?? 'buying') as Topic
  const [v, setV] = useState({ name: '', email: '', phone: '', topic: initTopic, agent: agentById(sp.get('agent') ?? '')?.id ?? '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const firstErr = useRef<HTMLDivElement>(null)
  const set = (k: keyof typeof v, val: string) => { setV((p) => ({ ...p, [k]: val })); if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n }) }

  function submit(e: FormEvent) {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (v.name.trim().length < 2) er.name = 'Enter your name.'
    if (!EMAIL_RE.test(v.email.trim())) er.email = 'Enter a valid email address.'
    if (v.phone.trim() && !PHONE_RE.test(v.phone.trim())) er.phone = 'That doesn’t look like a phone number.'
    if (v.message.trim().length < 10) er.message = 'Tell us a little more (at least 10 characters).'
    setErrors(er)
    if (Object.keys(er).length) { requestAnimationFrame(() => firstErr.current?.focus()); return }
    setDone(true)
  }

  return (
    <div className="mx-auto max-w-page px-5 pt-10 sm:px-8">
      <header className="border-b border-ink pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-label text-oak">Contact</p>
        <h1 className="mt-2 max-w-4xl font-serif text-[clamp(3rem,7vw,6rem)] leading-[0.9] tracking-tight">Come by the bungalow, or <em>just write.</em></h1>
      </header>
      <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section aria-label="Contact form">
          {done ? (
            <div className="border border-oak bg-oak-light/60 p-8" role="status">
              <span className="grid h-10 w-10 place-items-center bg-oak text-chalk"><Check /></span>
              <h2 className="mt-4 font-serif text-4xl">Thanks, {v.name.split(' ')[0]}.</h2>
              <p className="mt-2 text-[15px]">In real life, {v.agent ? agentById(v.agent)?.name : 'someone from the team'} would reply within one business day.</p>
              <p className="mt-3 text-xs text-graphite">Demo only — this message was not sent anywhere.</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
              {Object.keys(errors).length > 0 && (
                <div ref={firstErr} tabIndex={-1} role="alert" className="border-l-4 border-[#B3261E] bg-[#B3261E]/5 px-4 py-3 text-sm outline-none sm:col-span-2">
                  Please check the highlighted {Object.keys(errors).length === 1 ? 'field' : 'fields'}.
                </div>
              )}
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-[13px] font-medium">I’m interested in</legend>
                <div className="grid grid-cols-2 border border-ink/20 md:grid-cols-4">
                  {TOPICS.map(([k, label]) => (
                    <label key={k} className={`cursor-pointer border-ink/10 py-3 text-center text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-ink [&:not(:last-child)]:border-r ${v.topic === k ? 'bg-ink text-chalk' : 'hover:bg-chalk'}`}>
                      <input type="radio" name="topic" className="sr-only" checked={v.topic === k} onChange={() => set('topic', k)} />{label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field id="c-name" label="Name" error={errors.name}><input {...aria('c-name', errors.name)} autoComplete="name" value={v.name} onChange={(e) => set('name', e.target.value)} className={inputCls(errors.name)} /></Field>
              <Field id="c-email" label="Email" error={errors.email}><input {...aria('c-email', errors.email)} type="email" autoComplete="email" value={v.email} onChange={(e) => set('email', e.target.value)} className={inputCls(errors.email)} /></Field>
              <Field id="c-phone" label="Phone" optional error={errors.phone}><input {...aria('c-phone', errors.phone)} type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls(errors.phone)} /></Field>
              <Field id="c-agent" label="Preferred agent" optional>
                <select id="c-agent" value={v.agent} onChange={(e) => set('agent', e.target.value)} className={inputCls()}>
                  <option value="">Whoever’s best placed</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field id="c-msg" label="Message" error={errors.message} hint={v.topic === 'selling' ? 'Address, rough timing, and anything you’ve already done to the house.' : 'Neighborhoods, budget, timing — whatever you know so far.'}>
                  <textarea {...aria('c-msg', errors.message, true)} rows={6} value={v.message} onChange={(e) => set('message', e.target.value)} className={inputCls(errors.message)} />
                </Field>
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
                <button type="submit" className="bg-oak px-6 py-3.5 font-medium text-chalk hover:bg-oak-dark">Send message</button>
                <p className="text-xs text-graphite">Demo form — nothing is sent or stored on a server.</p>
              </div>
            </form>
          )}
        </section>
        <aside className="space-y-8" aria-label="Office details">
          <div className="h-72 border border-rule">
            <Suspense fallback={<div className="grid h-full place-items-center bg-mist text-sm text-graphite">Loading map…</div>}>
              <ListingMap items={[OFFICE]} single label="Map of the Hollis Row office on East 11th Street" />
            </Suspense>
          </div>
          <dl className="grid grid-cols-2 gap-6 text-[15px]">
            <div><dt className="text-[11px] font-semibold uppercase tracking-label text-graphite">Office</dt><dd className="mt-1.5 leading-relaxed">1109 E 11th St<br />Austin, TX 78702</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-label text-graphite">Hours</dt><dd className="mt-1.5 leading-relaxed">Mon–Fri 9–6<br />Sat 10–4 · Sun by appt.</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-label text-graphite">Phone</dt><dd className="mt-1.5 tabular-nums">(512) 555-0100</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-label text-graphite">Email</dt><dd className="mt-1.5">hello@hollisrow.example</dd></div>
          </dl>
          <p className="border-t border-rule pt-6 text-sm leading-relaxed text-graphite">Parking on the street or behind the building off Waller. We’re a two-minute walk from the 11th &amp; Waller bus stop (routes 2 and 4).</p>
        </aside>
      </div>
    </div>
  )
}
