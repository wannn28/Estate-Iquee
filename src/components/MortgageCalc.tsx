import { useId, useMemo, useState } from 'react'
import { usd } from '../lib/format'

function Num({ id, label, value, onChange, prefix, suffix, step = 1, min = 0, max }: { id: string; label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number; min?: number; max?: number }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium">{label}</label>
      <div className="flex items-center border border-ink/20 bg-chalk focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
        {prefix && <span className="pl-3 text-graphite">{prefix}</span>}
        <input id={id} type="number" inputMode="decimal" step={step} min={min} max={max} value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value)))} className="w-full bg-transparent px-3 py-2.5 tabular-nums outline-none" />
        {suffix && <span className="pr-3 text-sm text-graphite">{suffix}</span>}
      </div>
    </div>
  )
}

export default function MortgageCalc({ price, hoa = 0 }: { price: number; hoa?: number }) {
  const uid = useId()
  const [home, setHome] = useState(price)
  const [downPct, setDownPct] = useState(20)
  const [rate, setRate] = useState(6.25)
  const [years, setYears] = useState(30)
  const [taxPct, setTaxPct] = useState(1.8)
  const [insYear, setInsYear] = useState(Math.round((price * 0.0045) / 100) * 100)
  const [hoaM, setHoaM] = useState(hoa)

  const r = useMemo(() => {
    const down = (home * downPct) / 100
    const loan = Math.max(0, home - down)
    const i = rate / 100 / 12
    const n = years * 12
    const pi = loan === 0 ? 0 : i === 0 ? loan / n : (loan * i * (1 + i) ** n) / ((1 + i) ** n - 1)
    const tax = (home * taxPct) / 100 / 12
    const ins = insYear / 12
    const pmi = downPct < 20 ? (loan * 0.006) / 12 : 0
    const total = pi + tax + ins + hoaM + pmi
    return { down, loan, pi, tax, ins, pmi, total, interest: pi * n - loan }
  }, [home, downPct, rate, years, taxPct, insYear, hoaM])

  const parts = [
    { k: 'Principal & interest', v: r.pi, c: 'bg-oak' },
    { k: 'Property tax', v: r.tax, c: 'bg-ink' },
    { k: 'Home insurance', v: r.ins, c: 'bg-graphite' },
    { k: 'HOA', v: hoaM, c: 'bg-mist' },
    { k: 'PMI', v: r.pmi, c: 'bg-oak-light' },
  ].filter((p) => p.v > 0)

  return (
    <div className="grid gap-10 border border-rule bg-chalk p-6 md:grid-cols-2 md:p-8" data-testid="mortgage">
      <div className="grid grid-cols-2 gap-4 self-start">
        <div className="col-span-2"><Num id={`${uid}h`} label="Home price" prefix="$" value={home} onChange={setHome} step={5000} /></div>
        <div className="col-span-2">
          <div className="mb-1.5 flex justify-between text-[13px] font-medium">
            <label htmlFor={`${uid}d`}>Down payment</label>
            <span className="tabular-nums text-graphite">{usd(r.down)} · {downPct}%</span>
          </div>
          <input id={`${uid}d`} type="range" min={3} max={60} step={1} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className="hr-range w-full" aria-valuetext={`${downPct} percent, ${usd(r.down)}`} />
        </div>
        <Num id={`${uid}r`} label="Interest rate" suffix="%" value={rate} onChange={setRate} step={0.05} max={20} />
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium">Loan term</legend>
          <div className="grid grid-cols-3 border border-ink/20">
            {[15, 20, 30].map((y) => (
              <label key={y} className={`cursor-pointer py-2.5 text-center text-sm tabular-nums transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${years === y ? 'bg-ink text-chalk' : 'hover:bg-limestone'}`}>
                <input type="radio" name={`${uid}t`} className="sr-only" checked={years === y} onChange={() => setYears(y)} />{y} yr
              </label>
            ))}
          </div>
        </fieldset>
        <Num id={`${uid}x`} label="Property tax" suffix="%/yr" value={taxPct} onChange={setTaxPct} step={0.05} max={5} />
        <Num id={`${uid}i`} label="Insurance" prefix="$" suffix="/yr" value={insYear} onChange={setInsYear} step={100} />
        <div className="col-span-2"><Num id={`${uid}o`} label="HOA dues" prefix="$" suffix="/mo" value={hoaM} onChange={setHoaM} step={10} /></div>
      </div>
      <div aria-live="polite">
        <p className="text-[11px] font-semibold uppercase tracking-label text-graphite">Estimated monthly payment</p>
        <p className="mt-2 font-serif text-6xl tabular-nums leading-none" data-testid="monthly">{usd(r.total)}</p>
        <div className="mt-6 flex h-3 w-full overflow-hidden" aria-hidden>
          {parts.map((p) => <span key={p.k} className={p.c} style={{ width: `${(p.v / r.total) * 100}%` }} />)}
        </div>
        <dl className="mt-5 divide-y divide-rule border-y border-rule text-[15px]">
          {parts.map((p) => (
            <div key={p.k} className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2.5"><span className={`h-2.5 w-2.5 ${p.c}`} aria-hidden />{p.k}</dt>
              <dd className="tabular-nums">{usd(p.v)}</dd>
            </div>
          ))}
        </dl>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-graphite">Loan amount</dt><dd className="mt-0.5 font-semibold tabular-nums">{usd(r.loan)}</dd></div>
          <div><dt className="text-graphite">Total interest</dt><dd className="mt-0.5 font-semibold tabular-nums">{usd(Math.max(0, r.interest))}</dd></div>
        </dl>
        <p className="mt-5 text-xs leading-relaxed text-graphite">Estimate only, for illustration. PMI is assumed at 0.6%/yr below 20% down. Rates and taxes vary; talk to a licensed lender.</p>
      </div>
    </div>
  )
}
