export interface Agent {
  id: string
  name: string
  title: string
  photo: string
  phone: string
  email: string
  areas: string[]
  languages: string[]
  since: number
  sold: number
  avgDays: number
  bio: string
  quote: string
}

// Fictional people. Phone numbers use the reserved 555-01xx range.
export const agents: Agent[] = [
  {
    id: 'marisol-vega',
    name: 'Marisol Vega',
    title: 'Principal Broker & Founder',
    photo: 'agent-30004323',
    phone: '(512) 555-0142',
    email: 'marisol@hollisrow.example',
    areas: ['East Austin', 'Cherrywood', 'Mueller'],
    languages: ['English', 'Spanish'],
    since: 2011,
    sold: 312,
    avgDays: 11,
    bio: 'Marisol opened Hollis Row in a converted bungalow on East 11th after a decade in commercial leasing. She still walks every listing before it goes live, tape measure in hand, and writes most of the copy herself.',
    quote: 'Price it honestly, photograph it properly, and the right buyer shows up.',
  },
  {
    id: 'darnell-brooks',
    name: 'Darnell Brooks',
    title: 'Senior Agent — Central Austin',
    photo: 'agent-12311572',
    phone: '(512) 555-0117',
    email: 'darnell@hollisrow.example',
    areas: ['Hyde Park', 'Allandale', 'Tarrytown'],
    languages: ['English'],
    since: 2014,
    sold: 204,
    avgDays: 14,
    bio: 'A former preservation contractor, Darnell knows which 1920s foundations have been done right and which were just painted over. Buyers of older homes ask for him by name.',
    quote: 'Old houses tell you everything, if you know where to look.',
  },
  {
    id: 'claire-whitaker',
    name: 'Claire Whitaker',
    title: 'Luxury & Waterfront',
    photo: 'agent-30468665',
    phone: '(512) 555-0163',
    email: 'claire@hollisrow.example',
    areas: ['Westlake', 'Lake Austin', 'Barton Hills'],
    languages: ['English', 'French'],
    since: 2016,
    sold: 97,
    avgDays: 23,
    bio: 'Claire handles the firm’s architect-designed and waterfront listings, many sold off-market. She coordinates with builders, stagers and dock inspectors so her clients don’t have to.',
    quote: 'At this level, discretion is part of the product.',
  },
  {
    id: 'tom-hadley',
    name: 'Tom Hadley',
    title: 'Agent — South Austin',
    photo: 'agent-37148308',
    phone: '(512) 555-0189',
    email: 'tom@hollisrow.example',
    areas: ['Zilker', 'Bouldin Creek', 'Travis Heights'],
    languages: ['English', 'German'],
    since: 2018,
    sold: 128,
    avgDays: 12,
    bio: 'Tom grew up two blocks from Barton Springs and has watched South Austin change lot by lot. He is especially good with new-construction contracts and builder warranties.',
    quote: 'I’d rather lose a deal than sell you the wrong house.',
  },
  {
    id: 'nadia-rahimi',
    name: 'Nadia Rahimi',
    title: 'Leasing Director',
    photo: 'agent-38197025',
    phone: '(512) 555-0126',
    email: 'nadia@hollisrow.example',
    areas: ['Downtown', 'Rainey Street', 'Clarksville'],
    languages: ['English', 'Farsi'],
    since: 2019,
    sold: 410,
    avgDays: 9,
    bio: 'Nadia runs the rentals side of Hollis Row: condos, lofts and single-family leases. Relocating to Austin for work? She can do the whole search over video and have keys waiting.',
    quote: 'A good lease is just a clear promise, written down.',
  },
  {
    id: 'keisha-monroe',
    name: 'Keisha Monroe',
    title: 'Buyer’s Agent — First Homes',
    photo: 'agent-30004325',
    phone: '(512) 555-0151',
    email: 'keisha@hollisrow.example',
    areas: ['Travis Heights', 'Cherrywood', 'Allandale'],
    languages: ['English'],
    since: 2020,
    sold: 86,
    avgDays: 16,
    bio: 'Keisha works almost exclusively with first-time buyers. She runs a free monthly evening class on down-payment assistance programs and what an option period actually is.',
    quote: 'Nobody should sign something they don’t understand.',
  },
]

export const agentById = (id: string) => agents.find((a) => a.id === id)
