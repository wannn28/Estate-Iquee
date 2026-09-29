import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (size = 20) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true })

export const Heart = ({ size, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size)} {...p} fill={filled ? 'currentColor' : 'none'}><path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.2 3.9 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.3 0 5.6 3.2 4.4 6.6C19.5 15.4 12 20 12 20Z" /></svg>
)
export const Arrow = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 12h15M13 6l6 6-6 6" /></svg>)
export const ArrowLeft = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M20 12H5M11 6l-6 6 6 6" /></svg>)
export const Close = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 5l14 14M19 5 5 19" /></svg>)
export const Grid = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>)
export const List = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 5h6v5H4zM4 14h6v5H4zM13 7h7M13 16h7" /></svg>)
export const MapIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" /></svg>)
export const Sliders = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6" /></svg>)
export const Check = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m5 12.5 4.5 4.5L19 7" /></svg>)
export const Pin = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>)
export const Phone = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>)
export const Mail = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M3 6h18v12H3z" /><path d="m3 7 9 6 9-6" /></svg>)
export const Expand = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>)
export const Menu = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>)
