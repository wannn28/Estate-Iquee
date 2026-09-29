import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { adminToken, api, useApi } from '../lib/api'
import { useTitle } from '../lib/useTitle'
import { inputCls } from '../lib/forms'
import Field from '../components/Field'
import { ErrorBox, Loading } from '../components/States'

const DEMO = { email: 'admin@hollisrow.example', password: 'hollis-demo' }

interface Stats { tourRequests: number; tourRequests7d: number; contactMessages: number; contactMessages7d: number; savingVisitors: number; retentionDays: number; piiMasked: boolean }
interface Page<T> { items: T[]; total: number; page: number; pages: number; size: number }
interface Tour { id: number; listingId: string; listingTitle: string; listingSlug: string; date: string; time: string; kind: string; name: string; email: string; phone: string | null; note: string | null; createdAt: string }
interface Msg { id: number; topic: string; name: string; email: string; phone: string | null; agentId: string | null; agentName: string | null; message: string; createdAt: string }

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const day = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

function Login({ onDone }: { onDone: () => void }) {
  const [v, setV] = useState(DEMO)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const r = await api<{ token: string }>('/admin/login', { method: 'POST', body: v })
      adminToken.set(r.token)
      onDone()
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="mt-10 max-w-md space-y-5" data-testid="admin-login">
      <p className="border border-oak bg-oak-light/60 px-4 py-3 text-sm">Demo credentials are filled in for you: <strong>{DEMO.email}</strong> / <strong>{DEMO.password}</strong></p>
      <Field id="a-email" label="Email"><input id="a-email" type="email" autoComplete="username" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} className={inputCls()} /></Field>
      <Field id="a-pass" label="Password"><input id="a-pass" type="password" autoComplete="current-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} className={inputCls()} /></Field>
      {err && <p className="border-l-4 border-[#B3261E] bg-[#B3261E]/5 px-4 py-3 text-sm" role="alert">{err}</p>}
      <button type="submit" disabled={busy} className="bg-oak px-6 py-3.5 font-medium text-chalk hover:bg-oak-dark disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in to the inbox'}</button>
    </form>
  )
}

function Pager({ p, set }: { p: Page<unknown>; set: (n: number) => void }) {
  if (p.pages <= 1) return null
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <button type="button" disabled={p.page <= 1} onClick={() => set(p.page - 1)} className="border border-ink/25 px-3 py-1.5 disabled:opacity-40">Previous</button>
      <span className="tabular-nums text-graphite">Page {p.page} of {p.pages}</span>
      <button type="button" disabled={p.page >= p.pages} onClick={() => set(p.page + 1)} className="border border-ink/25 px-3 py-1.5 disabled:opacity-40">Next</button>
    </div>
  )
}

function Inbox({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'tours' | 'messages'>('tours')
  const [page, setPage] = useState(1)
  const stats = useApi<Stats>('/admin/stats', { auth: true })
  const tours = useApi<Page<Tour>>(tab === 'tours' ? `/admin/tour-requests?page=${page}&size=20` : null, { auth: true })
  const msgs = useApi<Page<Msg>>(tab === 'messages' ? `/admin/contact-messages?page=${page}&size=20` : null, { auth: true })
  const authErr = [stats.error, tours.error, msgs.error].find((e) => e?.status === 401)
  useEffect(() => { if (authErr) { adminToken.set(null); onLogout() } }, [authErr, onLogout])
  if (authErr) return null
  const s = stats.data
  const cur = tab === 'tours' ? tours : msgs
  const th = 'py-2 pr-4 font-semibold'
  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <dl className="grid flex-1 grid-cols-2 border-l border-t border-rule sm:grid-cols-4">
          {([['Tour requests', s?.tourRequests, s?.tourRequests7d], ['Messages', s?.contactMessages, s?.contactMessages7d], ['Visitors with saved homes', s?.savingVisitors, null], ['Retention', s ? `${s.retentionDays} days` : undefined, null]] as [string, number | string | undefined, number | null | undefined][]).map(([k, v, d]) => (
            <div key={k} className="border-b border-r border-rule px-4 py-4">
              <dt className="text-[11px] font-semibold uppercase tracking-label text-graphite">{k}</dt>
              <dd className="mt-1 font-serif text-4xl tabular-nums">{v ?? '–'}</dd>
              {d !== null && d !== undefined && <dd className="text-xs text-graphite">{d} in the last 7 days</dd>}
            </div>
          ))}
        </dl>
        <button type="button" onClick={() => { adminToken.set(null); onLogout() }} className="border border-ink/25 px-4 py-2.5 text-sm hover:border-ink">Sign out</button>
      </div>
      {s?.piiMasked && <p className="mt-4 text-sm text-graphite">Names, emails and phone numbers are masked because anyone can sign in to this demo. Submissions are purged automatically after {s.retentionDays} days.</p>}

      <div className="mt-10 flex border-b border-ink" role="tablist">
        {(['tours', 'messages'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setPage(1) }} className={`px-5 py-3 text-sm font-medium ${tab === t ? 'bg-ink text-chalk' : 'hover:bg-chalk'}`}>{t === 'tours' ? 'Tour requests' : 'Contact messages'}</button>
        ))}
        <button type="button" onClick={() => { stats.reload(); cur.reload() }} className="ml-auto px-3 text-sm text-graphite hover:text-ink">Refresh</button>
      </div>
      {cur.error && <ErrorBox error={cur.error} retry={cur.reload} className="mt-6" />}
      {cur.loading && !cur.data && <Loading />}
      {tab === 'tours' && tours.data && (
        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[48rem] text-left text-sm" data-testid="admin-tours">
            <thead><tr className="border-b border-rule text-[11px] uppercase tracking-label text-graphite"><th className={th}>#</th><th className={th}>Home</th><th className={th}>Tour</th><th className={th}>Visitor</th><th className={th}>Note</th><th className={th}>Received</th></tr></thead>
            <tbody>
              {tours.data.items.map((t) => (
                <tr key={t.id} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-4 tabular-nums text-graphite">{t.id}</td>
                  <td className="py-2.5 pr-4"><Link to={`/listing/${t.listingSlug}`} className="font-medium hover:text-oak">{t.listingTitle}</Link></td>
                  <td className="py-2.5 pr-4 tabular-nums">{day(t.date)} · {t.time}<span className="block text-xs text-graphite">{t.kind === 'video' ? 'Video call' : 'In person'}</span></td>
                  <td className="py-2.5 pr-4">{t.name}<span className="block text-xs text-graphite">{t.email}{t.phone ? ` · ${t.phone}` : ''}</span></td>
                  <td className="max-w-[16rem] py-2.5 pr-4 text-graphite">{t.note ?? '—'}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-graphite">{when(t.createdAt)}</td>
                </tr>
              ))}
              {!tours.data.items.length && <tr><td colSpan={6} className="py-10 text-center text-graphite">No tour requests yet. Book one from any listing page.</td></tr>}
            </tbody>
          </table>
          <Pager p={tours.data} set={setPage} />
        </div>
      )}
      {tab === 'messages' && msgs.data && (
        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[48rem] text-left text-sm" data-testid="admin-messages">
            <thead><tr className="border-b border-rule text-[11px] uppercase tracking-label text-graphite"><th className={th}>#</th><th className={th}>Topic</th><th className={th}>From</th><th className={th}>Agent</th><th className={th}>Message</th><th className={th}>Received</th></tr></thead>
            <tbody>
              {msgs.data.items.map((m) => (
                <tr key={m.id} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-4 tabular-nums text-graphite">{m.id}</td>
                  <td className="py-2.5 pr-4 capitalize">{m.topic}</td>
                  <td className="py-2.5 pr-4">{m.name}<span className="block text-xs text-graphite">{m.email}{m.phone ? ` · ${m.phone}` : ''}</span></td>
                  <td className="py-2.5 pr-4">{m.agentName ?? '—'}</td>
                  <td className="max-w-[22rem] py-2.5 pr-4 text-graphite">{m.message}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-graphite">{when(m.createdAt)}</td>
                </tr>
              ))}
              {!msgs.data.items.length && <tr><td colSpan={6} className="py-10 text-center text-graphite">No messages yet. Try the contact form.</td></tr>}
            </tbody>
          </table>
          <Pager p={msgs.data} set={setPage} />
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  useTitle('Inbox (demo admin)')
  const [signedIn, setSignedIn] = useState(() => !!adminToken.get())
  const logout = useCallback(() => setSignedIn(false), [])
  return (
    <div className="mx-auto max-w-page px-5 pt-10 sm:px-8">
      <header className="border-b border-ink pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-oak">Back office · demo</p>
        <h1 className="mt-2 font-serif text-[clamp(2.8rem,6vw,5rem)] leading-[0.92] tracking-tight">Tour requests &amp; <em>messages</em></h1>
        <p className="mt-3 max-w-2xl text-graphite">What the brokerage sees when a visitor books a tour or writes in. Data comes from MySQL through the Go API, behind a JWT sign-in.</p>
      </header>
      {signedIn ? <Inbox onLogout={logout} /> : <Login onDone={() => setSignedIn(true)} />}
    </div>
  )
}
