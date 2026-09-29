import { useEffect, useMemo } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Link } from 'react-router-dom'
import type { Listing } from '../data/listings'
import { bathLabel, priceLabel, shortPrice } from '../lib/format'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function priceIcon(label: string, active: boolean) {
  return L.divIcon({
    className: 'hr-marker-wrap',
    html: `<span class="hr-marker${active ? ' is-active' : ''}">${esc(label)}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

const pinIcon = L.divIcon({ className: 'hr-marker-wrap', html: '<span class="hr-pin" aria-hidden="true"></span>', iconSize: [0, 0] })

function Fit({ items }: { items: Listing[] }) {
  const map = useMap()
  const key = items.map((i) => i.id).join()
  useEffect(() => {
    if (!items.length) return
    if (items.length === 1) { map.setView([items[0].lat, items[0].lng], 14); return }
    map.fitBounds(L.latLngBounds(items.map((i) => [i.lat, i.lng] as [number, number])), { padding: [48, 48], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return null
}

function InvalidateOnResize() {
  const map = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  return null
}

interface Props {
  items: Listing[]
  activeId?: string | null
  onActive?: (id: string | null) => void
  single?: boolean
  className?: string
  label?: string
}

export default function ListingMap({ items, activeId, onActive, single, className = '', label = 'Map of listings' }: Props) {
  const center = useMemo<[number, number]>(() => (items[0] ? [items[0].lat, items[0].lng] : [30.2672, -97.7431]), [items])
  return (
    <div className={`hr-map relative h-full w-full ${className}`} role="region" aria-label={label}>
      <MapContainer center={center} zoom={single ? 15 : 12} scrollWheelZoom={!single} className="h-full w-full" attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <InvalidateOnResize />
        {single && items[0] ? (
          <>
            <Circle center={[items[0].lat, items[0].lng]} radius={260} pathOptions={{ color: '#1D5C3F', weight: 1, fillColor: '#1D5C3F', fillOpacity: 0.12 }} />
            <Marker position={[items[0].lat, items[0].lng]} icon={pinIcon} keyboard={false} />
          </>
        ) : (
          <>
            <Fit items={items} />
            {items.map((l) => (
              <Marker key={l.id} position={[l.lat, l.lng]} icon={priceIcon(shortPrice(l), l.id === activeId)} zIndexOffset={l.id === activeId ? 1000 : 0}
                title={`${l.title}, ${priceLabel(l)}`} alt={`${l.title}, ${priceLabel(l)}`}
                eventHandlers={{ mouseover: () => onActive?.(l.id), mouseout: () => onActive?.(null) }}>
                <Popup closeButton={false} offset={[0, -6]}>
                  <Link to={`/listing/${l.slug}`} className="block w-56 text-ink no-underline">
                    <img src={`/images/${l.photos[0]}-800.webp`} alt="" className="aspect-[3/2] w-full object-cover" />
                    <span className="block px-3 pb-3 pt-2">
                      <span className="block text-[15px] font-semibold tabular-nums">{priceLabel(l)}</span>
                      <span className="block font-serif text-lg leading-tight">{l.title}</span>
                      <span className="block text-xs text-graphite">{l.beds} bd · {bathLabel(l.baths)} ba · {l.neighborhood}</span>
                    </span>
                  </Link>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  )
}
