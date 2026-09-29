import type { ImgHTMLAttributes } from 'react'

const WIDTHS: Record<string, [number, number]> = { hood: [600, 1000], agent: [480, 800], hero: [1200, 2000] }

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  name: string
  alt: string
  sizes?: string
  eager?: boolean
}

/** Local responsive WebP image: /images/{name}-{w}.webp */
export default function Img({ name, alt, sizes = '(min-width: 1024px) 33vw, 100vw', eager, className = '', ...rest }: Props) {
  const [s, l] = WIDTHS[name.split('-')[0]] ?? [800, 1600]
  return (
    <img
      src={`/images/${name}-${s}.webp`}
      srcSet={`/images/${name}-${s}.webp ${s}w, /images/${name}-${l}.webp ${l}w`}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`bg-mist object-cover ${className}`}
      {...rest}
    />
  )
}
