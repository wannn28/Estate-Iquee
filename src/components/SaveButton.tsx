import { useFavorites } from '../lib/favorites'
import { Heart } from './Icons'

export default function SaveButton({ id, title, variant = 'overlay' }: { id: string; title: string; variant?: 'overlay' | 'inline' }) {
  const { isSaved, toggle } = useFavorites()
  const on = isSaved(id)
  const label = on ? `Remove ${title} from saved homes` : `Save ${title}`
  if (variant === 'inline')
    return (
      <button type="button" onClick={() => toggle(id)} aria-pressed={on} aria-label={label}
        className={`inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-medium transition ${on ? 'border-oak bg-oak text-chalk' : 'border-ink/25 hover:border-ink'}`}>
        <Heart size={18} filled={on} /> {on ? 'Saved' : 'Save'}
      </button>
    )
  return (
    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id) }} aria-pressed={on} aria-label={label}
      className={`grid h-10 w-10 place-items-center transition ${on ? 'bg-oak text-chalk' : 'bg-chalk/90 text-ink hover:bg-chalk'}`}>
      <Heart size={19} filled={on} />
    </button>
  )
}
