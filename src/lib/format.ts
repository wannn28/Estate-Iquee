import type { Listing } from '../data/listings'

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
export const usd = (n: number) => usd0.format(Math.round(n))
export const num = (n: number) => n.toLocaleString('en-US')

export function priceLabel(l: Listing) {
  return l.mode === 'rent' ? `${usd(l.price)}/mo` : usd(l.price)
}

export function shortPrice(l: Listing) {
  if (l.mode === 'rent') return `$${(l.price / 1000).toFixed(l.price % 1000 === 0 ? 0 : 1)}K/mo`
  return l.price >= 1_000_000 ? `$${(l.price / 1_000_000).toFixed(2).replace(/0$/, '')}M` : `$${Math.round(l.price / 1000)}K`
}

export const bathLabel = (b: number) => (Number.isInteger(b) ? String(b) : b.toFixed(1))

const ROOM: Record<string, string> = { ext: 'Exterior', liv: 'Living room', kit: 'Kitchen', bed: 'Bedroom', bath: 'Bathroom', loft: 'Interior', din: 'Dining room' }
export const roomOf = (photo: string) => ROOM[photo.split('-')[0]] ?? 'Photo'
