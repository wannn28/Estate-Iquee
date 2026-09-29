import type { Listing } from '../data/listings'

interface Room { label: string; x: number; y: number; w: number; h: number }

/** Schematic, auto-generated floor plan. Illustrative only. */
export default function FloorPlan({ l }: { l: Listing }) {
  const W = 640, H = 400, pad = 8
  const ftW = Math.sqrt(l.sqft * 1.55)
  const ftH = l.sqft / ftW
  const sx = ftW / (W - pad * 2), sy = ftH / (H - pad * 2)
  const top = (H - pad * 2) * 0.52, hall = 34
  const rooms: Room[] = []
  const x0 = pad, y0 = pad, iw = W - pad * 2
  const loftish = l.type === 'Loft' || l.type === 'Condo'
  const topParts: [string, number][] = loftish ? [['Living', 0.5], ['Kitchen', 0.3], ['Entry', 0.2]] : [['Living', 0.42], ['Kitchen / Dining', 0.38], ['Entry', 0.2]]
  let x = x0
  for (const [label, f] of topParts) { rooms.push({ label, x, y: y0, w: iw * f, h: top }); x += iw * f }
  const baths = Math.ceil(l.baths)
  const cells: [string, number][] = []
  for (let b = 0; b < l.beds; b++) cells.push([b === 0 ? 'Primary' : `Bed ${b + 1}`, b === 0 ? 2.6 : 2])
  for (let b = 0; b < baths; b++) cells.splice(Math.min(cells.length, b * 2 + 1), 0, [Number.isInteger(l.baths) || b < baths - 1 ? 'Bath' : '½ Bath', 0.95])
  const total = cells.reduce((s, c) => s + c[1], 0)
  x = x0
  const by = y0 + top + hall, bh = H - pad - by
  for (const [label, wgt] of cells) { const w = (iw * wgt) / total; rooms.push({ label, x, y: by, w, h: bh }); x += w }
  const dim = (r: Room) => `${Math.round(r.w * sx)}′ × ${Math.round(r.h * sy)}′`
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-chalk" role="img" aria-label={`Schematic floor plan: ${l.beds} bedrooms, ${l.baths} bathrooms, about ${l.sqft} square feet`}>
        <defs>
          <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#151513" strokeOpacity=".12" strokeWidth="2" /></pattern>
        </defs>
        <rect x={x0} y={y0 + top} width={iw} height={hall} fill="url(#hatch)" />
        <text x={W / 2} y={y0 + top + hall / 2 + 4} textAnchor="middle" className="fill-graphite" style={{ font: '500 10px "Geist Variable", sans-serif', letterSpacing: '.18em' }}>HALL</text>
        {rooms.map((r) => (
          <g key={r.label + r.x}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#151513" strokeWidth={2} />
            {r.w > 60 && (
              <>
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 2} textAnchor="middle" style={{ font: `${r.w < 90 ? 15 : 19}px "Instrument Serif", serif` }} fill="#151513">{r.label}</text>
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 15} textAnchor="middle" style={{ font: '10.5px "Geist Variable", sans-serif' }} fill="#5C5B55">{dim(r)}</text>
              </>
            )}
            {r.w <= 60 && <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 4} textAnchor="middle" style={{ font: '13px "Instrument Serif", serif' }} fill="#151513">{r.label.replace(' Bath', 'Ba').replace('Bath', 'Ba')}</text>}
          </g>
        ))}
        {/* door gaps */}
        {rooms.slice(3).map((r) => <line key={'d' + r.x} x1={r.x + r.w / 2 - 10} x2={r.x + r.w / 2 + 10} y1={r.y} y2={r.y} stroke="#FAFAF7" strokeWidth={4} />)}
        <rect x={x0} y={y0} width={iw} height={H - pad * 2} fill="none" stroke="#151513" strokeWidth={5} />
      </svg>
      <figcaption className="mt-2 text-xs text-graphite">Schematic layout generated from the listing’s room count and area — for orientation only, not to scale. Request the measured plan from the agent.</figcaption>
    </figure>
  )
}
