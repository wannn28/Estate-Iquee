export type Mode = 'buy' | 'rent'
export type PropertyType = 'House' | 'Condo' | 'Townhouse' | 'Loft' | 'Duplex'

export const AMENITIES = [
  'Pool',
  'Garage',
  'Private yard',
  'Home office',
  'Pet friendly',
  'EV charger',
  'Fireplace',
  'In-unit laundry',
  'Gym',
  'Balcony or deck',
  'Solar panels',
  'Guest house / ADU',
  'Water view',
  'Concierge',
] as const
export type Amenity = (typeof AMENITIES)[number]

export interface Listing {
  id: string
  slug: string
  title: string
  address: string
  neighborhood: string
  zip: string
  mode: Mode
  type: PropertyType
  price: number
  beds: number
  baths: number
  sqft: number
  lotAcres?: number
  year: number
  parking: string
  hoa?: number
  lat: number
  lng: number
  photos: string[]
  agentId: string
  amenities: Amenity[]
  tag?: 'New' | 'Price cut' | 'Open Sat' | 'Off-market'
  daysListed: number
  featured?: boolean
  summary: string
  description: string[]
  available?: string
}

const L: Listing[] = [
  {
    id: 'HR-2401', slug: 'ledge-house-barton-hills', title: 'The Ledge House',
    address: '2207 Rabb Glen St', neighborhood: 'Barton Hills', zip: '78704',
    mode: 'buy', type: 'House', price: 1685000, beds: 4, baths: 3, sqft: 3120, lotAcres: 0.41, year: 1961, parking: '2-car carport',
    lat: 30.2552, lng: -97.7868, agentId: 'claire-whitaker', tag: 'New', daysListed: 3, featured: true,
    photos: ['ext-35361412', 'liv-18657168', 'liv-18657162', 'kit-18657161', 'bed-18657166', 'bath-7031840'],
    amenities: ['Private yard', 'Home office', 'Fireplace', 'Pet friendly', 'In-unit laundry', 'Balcony or deck'],
    summary: 'A 1961 post-and-beam house on a limestone shelf above the greenbelt, restored rather than flipped.',
    description: [
      'Designed by a student of O’Neil Ford and owned by the same family for forty years, the Ledge House sits on a natural limestone shelf with the Barton Creek greenbelt falling away behind it. The 2022 restoration kept the tongue-and-groove ceilings, the walnut built-ins and the original clerestory glass, and quietly replaced everything you can’t see: roof, wiring, plumbing and a high-efficiency heat pump.',
      'The living wing opens onto a deep covered terrace under two heritage live oaks. Four bedrooms sit in a separate wing, including a primary suite with a walk-in shower and garden view. A detached studio off the carport works as an office or music room.',
    ],
  },
  {
    id: 'HR-2402', slug: 'cedar-modern-zilker', title: 'Cedar & Glass on Kinney',
    address: '1804 Kinney Ave', neighborhood: 'Zilker', zip: '78704',
    mode: 'buy', type: 'House', price: 2150000, beds: 4, baths: 3.5, sqft: 3480, lotAcres: 0.19, year: 2019, parking: '2-car garage',
    lat: 30.2605, lng: -97.7702, agentId: 'tom-hadley', tag: 'Open Sat', daysListed: 9, featured: true,
    photos: ['ext-323781', 'liv-8089172', 'kit-6265836', 'din-7534295', 'bed-6782479', 'bath-35747331'],
    amenities: ['Garage', 'Private yard', 'Home office', 'EV charger', 'Solar panels', 'Balcony or deck', 'In-unit laundry'],
    summary: 'Architect-built modern with cedar cladding, a roof deck and a ten-minute walk to Barton Springs.',
    description: [
      'Clad in thermally modified cedar and stacked stone, this four-bedroom modern was built in 2019 for the architect’s own family. Floor-to-ceiling glazing on the north side floods the double-height living room with even light, and the kitchen runs the full width of the house with a 12-foot quartzite island.',
      'Upstairs, three bedrooms share a sitting landing while the primary suite opens to a planted roof deck with downtown views. Owned solar with battery backup, EV charger in the garage, and a low-water native garden.',
    ],
  },
  {
    id: 'HR-2403', slug: 'poolside-westlake', title: 'Courtyard Pool House',
    address: '3510 Toro Canyon Rd', neighborhood: 'Westlake', zip: '78746',
    mode: 'buy', type: 'House', price: 3295000, beds: 5, baths: 4.5, sqft: 4650, lotAcres: 0.88, year: 2021, parking: '3-car garage',
    lat: 30.2921, lng: -97.8118, agentId: 'claire-whitaker', daysListed: 21, featured: true,
    photos: ['ext-2155202', 'liv-36353282', 'kit-15409513', 'din-24461264', 'bed-8135118', 'bath-7005268'],
    amenities: ['Pool', 'Garage', 'Private yard', 'Home office', 'Gym', 'EV charger', 'Fireplace', 'In-unit laundry'],
    summary: 'Single-level living wrapped around a 50-foot lap pool, in the Eanes school district.',
    description: [
      'Every principal room opens directly to the central courtyard and its 50-foot saltwater lap pool, so the house lives as one long indoor–outdoor room from March to November. Pocketing glass walls disappear into the structure; the covered loggia has a summer kitchen and a wood-burning fireplace.',
      'Five bedrooms, a gym with rubber flooring and a separate guest suite with its own entrance. Zoned to Eanes ISD, eight minutes to downtown via Loop 360.',
    ],
  },
  {
    id: 'HR-2404', slug: 'red-ranch-allandale', title: 'The Red Ranch',
    address: '2811 W Koenig Ln', neighborhood: 'Allandale', zip: '78756',
    mode: 'buy', type: 'House', price: 915000, beds: 3, baths: 2, sqft: 1840, lotAcres: 0.24, year: 1958, parking: '1-car garage + driveway',
    lat: 30.3372, lng: -97.7431, agentId: 'keisha-monroe', tag: 'Price cut', daysListed: 34,
    photos: ['ext-31353860', 'liv-280239', 'kit-4221389', 'bed-7147299', 'bath-8082195'],
    amenities: ['Garage', 'Private yard', 'Pet friendly', 'Fireplace', 'In-unit laundry'],
    summary: 'Classic 1958 Allandale ranch on a quarter acre, with a brick fireplace and a big backyard.',
    description: [
      'A well-kept original: board-and-batten siding, a brick fireplace, oak floors under the carpet in two bedrooms (we checked) and a quarter-acre lot with a mature pecan. The kitchen was updated in 2015 with gas range and solid-surface counters.',
      'Walk to Northwest District Park and the pool, and to Gullett Elementary. A straightforward house in a neighborhood where straightforward houses rarely come up.',
    ],
  },
  {
    id: 'HR-2405', slug: 'lamplight-craftsman-hyde-park', title: 'Lamplight Craftsman',
    address: '4306 Avenue F', neighborhood: 'Hyde Park', zip: '78751',
    mode: 'buy', type: 'House', price: 1245000, beds: 3, baths: 2, sqft: 2060, lotAcres: 0.18, year: 1922, parking: 'Driveway',
    lat: 30.3068, lng: -97.7291, agentId: 'darnell-brooks', daysListed: 6, featured: true,
    photos: ['ext-5524164', 'liv-11296142', 'din-3935326', 'kit-13009887', 'bed-6934170', 'bath-6890406'],
    amenities: ['Private yard', 'Fireplace', 'Home office', 'Pet friendly', 'In-unit laundry', 'Balcony or deck'],
    summary: 'A contributing 1922 home in the Hyde Park historic district, fully re-leveled and rewired.',
    description: [
      'Deep eaves, tapered porch columns and a front porch you will actually use. Inside: original heart-pine floors, a tiled fireplace, leaded-glass bookcases and nine-and-a-half-foot ceilings. The foundation was re-leveled in 2021 with a transferable warranty, and the house was completely rewired and replumbed the same year.',
      'The rear addition (2019, permitted) holds a bright kitchen and a back deck under the pecans. Three blocks to Avenue B Grocery, Quack’s and the Shipe Park pool.',
    ],
  },
  {
    id: 'HR-2406', slug: 'blue-bungalow-travis-heights', title: 'Blue Bungalow on Kenwood',
    address: '1407 Kenwood Ave', neighborhood: 'Travis Heights', zip: '78704',
    mode: 'rent', type: 'House', price: 4200, beds: 2, baths: 1, sqft: 1150, lotAcres: 0.15, year: 1938, parking: 'Driveway, 2 cars',
    lat: 30.2466, lng: -97.7407, agentId: 'nadia-rahimi', tag: 'New', daysListed: 2, available: 'Nov 1',
    photos: ['ext-24245769', 'liv-6980724', 'kit-7195739', 'bed-6903157', 'bath-8082195'],
    amenities: ['Private yard', 'Pet friendly', 'In-unit laundry', 'Balcony or deck'],
    summary: 'A painted 1938 cottage two blocks from South Congress, with a fenced yard for the dog.',
    description: [
      'Soft blue cottage with a deep front porch, refinished oak floors and a renovated kitchen with gas range. Two real bedrooms, a tiled bath with a clawfoot tub, and a stacked washer/dryer.',
      'Fenced backyard with a pecan tree and a small studio shed. Pets considered (two max). 12- or 18-month lease; lawn care included.',
    ],
  },
  {
    id: 'HR-2407', slug: 'gabled-craftsman-hyde-park', title: 'Gabled House on 45th',
    address: '309 E 45th St', neighborhood: 'Hyde Park', zip: '78751',
    mode: 'buy', type: 'House', price: 1090000, beds: 3, baths: 2.5, sqft: 2240, lotAcres: 0.16, year: 1926, parking: 'Detached garage',
    lat: 30.3049, lng: -97.7262, agentId: 'darnell-brooks', daysListed: 12,
    photos: ['ext-5524205', 'liv-7546648', 'kit-10117730', 'bed-15456211', 'bath-7031840'],
    amenities: ['Garage', 'Private yard', 'Fireplace', 'Pet friendly', 'In-unit laundry'],
    summary: 'Twin-gabled 1926 home on a corner lot, with a converted garage studio.',
    description: [
      'Two front gables, a wraparound lawn and a porch swing. The main floor has a formal living room with fireplace, a dining room with the original built-in buffet, and a kitchen opened up in 2017 with an island and pantry.',
      'Three bedrooms upstairs under the eaves, plus a half bath down. The detached garage was finished as a heated and cooled studio with its own mini-split.',
    ],
  },
  {
    id: 'HR-2408', slug: 'maple-house-tarrytown', title: 'Japanese Maple House',
    address: '2503 Winsted Ln', neighborhood: 'Tarrytown', zip: '78703',
    mode: 'buy', type: 'House', price: 1875000, beds: 4, baths: 3, sqft: 2980, lotAcres: 0.3, year: 1940, parking: '2-car garage',
    lat: 30.2958, lng: -97.7652, agentId: 'darnell-brooks', tag: 'Open Sat', daysListed: 15,
    photos: ['ext-5524166', 'liv-29012619', 'din-6908357', 'kit-6908565', 'bed-6782479', 'bath-35747331'],
    amenities: ['Garage', 'Private yard', 'Fireplace', 'Home office', 'Pet friendly', 'In-unit laundry'],
    summary: 'A 1940 Tudor-craftsman behind a crimson Japanese maple, walking distance to Lake Austin Blvd.',
    description: [
      'Set back behind a sixty-year-old Japanese maple, this storybook house has been expanded twice with unusual care. The original stone fireplace anchors the living room; a 2018 rear addition added a family kitchen, mudroom and primary suite overlooking the garden.',
      'Casis Elementary, O. Henry and Austin High. Five minutes to Mozart’s and the Lions Municipal golf course.',
    ],
  },
  {
    id: 'HR-2409', slug: 'white-farmhouse-mueller', title: 'Mueller Park Farmhouse',
    address: '4702 Berkman Dr', neighborhood: 'Mueller', zip: '78723',
    mode: 'buy', type: 'House', price: 1120000, beds: 4, baths: 3, sqft: 2650, lotAcres: 0.14, year: 2016, parking: '2-car garage (alley)',
    lat: 30.2991, lng: -97.7018, agentId: 'marisol-vega', daysListed: 18,
    photos: ['ext-7601163', 'liv-27164969', 'kit-15409513', 'din-4119832', 'bed-7147299', 'bath-7005268'],
    amenities: ['Garage', 'Private yard', 'Home office', 'Solar panels', 'EV charger', 'Pet friendly', 'In-unit laundry'],
    summary: 'A 2016 green-built farmhouse facing the park, with owned solar and a first-floor office.',
    description: [
      'Austin Energy Green Building 4-star rated, with owned solar that covered 80% of last year’s electric bill. The front porch looks straight onto a pocket park; the alley-loaded garage keeps the street quiet.',
      'Open kitchen and family room, a first-floor office with glass doors, and four bedrooms upstairs. Walk to the Mueller lake, the Thinkery and the Sunday farmers market.',
    ],
  },
  {
    id: 'HR-2410', slug: 'terrace-pool-westlake', title: 'Terraces at Bee Cave',
    address: '1200 Wild Cat Hollow', neighborhood: 'Westlake', zip: '78746',
    mode: 'buy', type: 'House', price: 2690000, beds: 4, baths: 4, sqft: 3900, lotAcres: 0.62, year: 2022, parking: '3-car garage',
    lat: 30.2852, lng: -97.8195, agentId: 'claire-whitaker', daysListed: 27,
    photos: ['ext-8134745', 'liv-36353282', 'kit-6265836', 'bed-8135118', 'bath-35747331'],
    amenities: ['Pool', 'Garage', 'Private yard', 'Gym', 'EV charger', 'Solar panels', 'Balcony or deck', 'In-unit laundry'],
    summary: 'A 2022 modern with a stepped pool terrace and sunset views over the hills.',
    description: [
      'Clean white volumes and warm wood soffits, set into the slope so every level has its own terrace. The pool deck steps down to a lawn edged in native grasses.',
      'Four suites, a flex room fitted as a home gym and a three-car garage with EV charging. Smart-home lighting, shades and irrigation.',
    ],
  },
  {
    id: 'HR-2411', slug: 'palm-court-lake-austin', title: 'Palm Court on the River',
    address: '4115 Mount Bonnell Rd', neighborhood: 'Lake Austin', zip: '78731',
    mode: 'buy', type: 'House', price: 3850000, beds: 5, baths: 5, sqft: 5100, lotAcres: 1.1, year: 2018, parking: '3-car garage',
    lat: 30.3218, lng: -97.7745, agentId: 'claire-whitaker', tag: 'Off-market', daysListed: 40, featured: true,
    photos: ['ext-10647324', 'liv-8089172', 'din-24461264', 'kit-18657161', 'bed-6903157', 'bath-7005268'],
    amenities: ['Pool', 'Garage', 'Private yard', 'Water view', 'Gym', 'Home office', 'Guest house / ADU', 'EV charger', 'Fireplace'],
    summary: 'Over an acre above Lake Austin, with a zero-edge pool and a separate guest house.',
    description: [
      'Glass, teak and limestone arranged around a palm-lined pool court. The main house has five suites and a library; the guest house over the garage has its own kitchen and deck.',
      'Shown by appointment only to pre-qualified buyers. Deeded access to a shared boat dock is available by separate negotiation.',
    ],
  },
  {
    id: 'HR-2412', slug: 'brick-duplex-clarksville', title: 'Clarksville Duplex, Upper Unit',
    address: '1011 W Lynn St, Unit B', neighborhood: 'Clarksville', zip: '78703',
    mode: 'rent', type: 'Duplex', price: 3650, beds: 2, baths: 2, sqft: 1300, year: 1948, parking: '1 covered space',
    lat: 30.2796, lng: -97.7597, agentId: 'nadia-rahimi', daysListed: 7, available: 'Oct 15',
    photos: ['ext-14930288', 'liv-280239', 'kit-4221389', 'bed-6934170', 'bath-6890406'],
    amenities: ['In-unit laundry', 'Balcony or deck', 'Pet friendly', 'Private yard'],
    summary: 'Upper floor of a 1948 brick duplex, tree-house views, walk to Jeffrey’s and the Whole Foods flagship.',
    description: [
      'Top-floor unit in a two-unit brick building with a shared garden. Two bedrooms at opposite ends, both with en-suite baths; the living room opens to a screened porch in the treetops.',
      'Water and trash included. Cats welcome, dogs under 30 lb considered. 12-month minimum.',
    ],
  },
  {
    id: 'HR-2413', slug: 'lakefront-lake-austin', title: 'Lakefront with Boathouse',
    address: '3214 Pecos St', neighborhood: 'Lake Austin', zip: '78703',
    mode: 'buy', type: 'House', price: 2475000, beds: 4, baths: 3.5, sqft: 3300, lotAcres: 0.52, year: 2004, parking: '2-car garage',
    lat: 30.3055, lng: -97.7866, agentId: 'claire-whitaker', tag: 'Price cut', daysListed: 48,
    photos: ['ext-1438832', 'liv-29012619', 'kit-7195739', 'din-15668080', 'bed-15456211', 'bath-7031840'],
    amenities: ['Water view', 'Garage', 'Private yard', 'Balcony or deck', 'Fireplace', 'Home office', 'Pet friendly'],
    summary: 'Shingle-style home on 110 feet of calm-water frontage with a two-slip boathouse.',
    description: [
      'Rare no-wake frontage on Lake Austin, with a covered two-slip boathouse and swim ladder. Every main room looks down the lawn to the water.',
      'Four bedrooms including a lake-facing primary with a balcony. Upgraded in 2023 with new HVAC and a standing-seam roof.',
    ],
  },
  {
    id: 'HR-2414', slug: 'row-townhome-cherrywood', title: 'Cherrywood Row, No. 3',
    address: '3106 Manor Rd, Unit 3', neighborhood: 'Cherrywood', zip: '78723',
    mode: 'rent', type: 'Townhouse', price: 3400, beds: 3, baths: 2.5, sqft: 1780, year: 2020, parking: '2-car garage', hoa: 0,
    lat: 30.2870, lng: -97.7129, agentId: 'nadia-rahimi', daysListed: 11, available: 'Now',
    photos: ['ext-10628470', 'liv-7546648', 'kit-10758468', 'bed-7147299', 'bath-8082195'],
    amenities: ['Garage', 'In-unit laundry', 'Balcony or deck', 'Pet friendly', 'EV charger'],
    summary: 'Three-story townhome with a garage and a rooftop deck, near the Manor Road restaurants.',
    description: [
      'Built in 2020: garage and flex room on the ground floor, open living and kitchen on the second, three bedrooms on the third. A private rooftop deck looks toward downtown.',
      'Walk to Dai Due, Contigo and the Cherrywood coffee shops. Includes Level 2 EV charger in the garage.',
    ],
  },
  {
    id: 'HR-2415', slug: 'saltillo-loft-east-austin', title: 'Saltillo Loft 4C',
    address: '1011 E 5th St, #4C', neighborhood: 'East Austin', zip: '78702',
    mode: 'rent', type: 'Loft', price: 2350, beds: 1, baths: 1, sqft: 780, year: 2019, parking: '1 garage space',
    lat: 30.2640, lng: -97.7322, agentId: 'nadia-rahimi', tag: 'New', daysListed: 1, available: 'Oct 1',
    photos: ['ext-9308434', 'loft-29252605', 'loft-7045939', 'loft-29252608', 'bath-35747331'],
    amenities: ['In-unit laundry', 'Gym', 'Pet friendly', 'Balcony or deck', 'Concierge'],
    summary: 'A one-bed loft with 14-foot ceilings, steps from the Saltillo rail station.',
    description: [
      'Concrete floors, exposed ductwork and a full wall of factory-style windows. The sleeping loft sits above the kitchen; a Juliet balcony faces west over East 5th.',
      'Building gym, package room and a rooftop pool. One garage space included. Pets welcome.',
    ],
  },
  {
    id: 'HR-2416', slug: 'rainey-corner-condo', title: 'Rainey Street Corner Condo',
    address: '70 Rainey St, #1208', neighborhood: 'Rainey Street', zip: '78701',
    mode: 'rent', type: 'Condo', price: 2950, beds: 2, baths: 2, sqft: 1080, year: 2017, parking: '1 garage space',
    lat: 30.2588, lng: -97.7383, agentId: 'nadia-rahimi', daysListed: 13, available: 'Nov 1',
    photos: ['ext-35707771', 'loft-7031834', 'kit-6265836', 'bed-6782479', 'bath-7005268'],
    amenities: ['Gym', 'Concierge', 'Pool', 'Balcony or deck', 'In-unit laundry', 'Water view'],
    summary: 'Corner 2/2 on the 12th floor with lake views and a wraparound balcony.',
    description: [
      'Split-bedroom corner unit with a wraparound balcony looking south over Lady Bird Lake. Quartz kitchen, wide-plank floors and custom closets.',
      'Full-service building: 24-hour concierge, pool terrace, gym and dog run. One reserved garage space.',
    ],
  },
  {
    id: 'HR-2417', slug: 'new-craftsman-bouldin', title: 'Bouldin Porch House',
    address: '906 Christopher St', neighborhood: 'Bouldin Creek', zip: '78704',
    mode: 'buy', type: 'House', price: 1395000, beds: 3, baths: 3, sqft: 2180, lotAcres: 0.13, year: 2012, parking: 'Driveway, 2 cars',
    lat: 30.2517, lng: -97.7584, agentId: 'tom-hadley', daysListed: 8,
    photos: ['ext-5587932', 'liv-11296142', 'kit-13009887', 'din-3935326', 'bed-6934170', 'bath-6890406'],
    amenities: ['Private yard', 'Home office', 'Fireplace', 'Pet friendly', 'In-unit laundry', 'Balcony or deck'],
    summary: 'A 2012 craftsman built with old-house proportions, two blocks from the Bouldin coffee shops.',
    description: [
      'A newer house that looks like it has always been there: full-width porch, picket fence, deep window casings. Inside, an open kitchen and dining room with a gas fireplace, and a downstairs guest suite.',
      'Two bedrooms up, each with its own bath, and a study nook at the top of the stairs. Walk to Bouldin Creek Café, Juan in a Million and the South First food trucks.',
    ],
  },
  {
    id: 'HR-2418', slug: 'shingle-cottage-travis-heights', title: 'Shingle Cottage on Alta Vista',
    address: '1203 Alta Vista Ave', neighborhood: 'Travis Heights', zip: '78704',
    mode: 'buy', type: 'House', price: 1180000, beds: 3, baths: 2, sqft: 1720, lotAcres: 0.17, year: 1932, parking: 'Driveway',
    lat: 30.2491, lng: -97.7379, agentId: 'keisha-monroe', tag: 'New', daysListed: 4,
    photos: ['ext-12119561', 'liv-6980724', 'kit-4221389', 'bed-6903157', 'bath-8082195'],
    amenities: ['Private yard', 'Fireplace', 'Pet friendly', 'In-unit laundry'],
    summary: 'Cedar-shingled 1932 cottage on a sloping lot, walkable to South Congress and Stacy Park.',
    description: [
      'Brick steps up to a shingle-style cottage with its original divided-light windows. The living room has a brick fireplace and built-in bookshelves; the kitchen was renovated with open shelving and a farmhouse sink.',
      'Three bedrooms on one level. The terraced backyard steps down to a flagstone patio and a garden shed.',
    ],
  },
  {
    id: 'HR-2419', slug: 'porch-house-cherrywood', title: 'Cherrywood Porch House',
    address: '2909 Cherrywood Rd', neighborhood: 'Cherrywood', zip: '78722',
    mode: 'buy', type: 'House', price: 835000, beds: 3, baths: 2, sqft: 1560, lotAcres: 0.15, year: 1946, parking: 'Driveway',
    lat: 30.2905, lng: -97.7104, agentId: 'keisha-monroe', daysListed: 19,
    photos: ['ext-39447777', 'liv-280239', 'kit-10117730', 'bed-15456211', 'bath-6890406'],
    amenities: ['Private yard', 'Pet friendly', 'In-unit laundry', 'Home office', 'Balcony or deck'],
    summary: 'Updated 1946 house with a deep porch and a detached office in the backyard.',
    description: [
      'Sage-grey siding, white porch rails and a front door you can leave open in October. Renovated in 2020 with a new kitchen, second bath and mini-split in the detached backyard office.',
      'Walk to Patterson Park and the Cherrywood coffee shops. A good first house that you won’t outgrow in two years.',
    ],
  },
  {
    id: 'HR-2420', slug: 'glass-pool-barton-hills', title: 'Glass House over the Greenbelt',
    address: '2605 Barton Hills Dr', neighborhood: 'Barton Hills', zip: '78704',
    mode: 'buy', type: 'House', price: 2340000, beds: 4, baths: 3.5, sqft: 3350, lotAcres: 0.35, year: 2020, parking: '2-car garage',
    lat: 30.2582, lng: -97.7925, agentId: 'tom-hadley', daysListed: 25,
    photos: ['ext-34378030', 'liv-36353282', 'kit-15409513', 'din-7534295', 'bed-8135118', 'bath-35747331'],
    amenities: ['Pool', 'Garage', 'Private yard', 'Home office', 'EV charger', 'Solar panels', 'Balcony or deck'],
    summary: 'A 2020 minimalist house with a plunge pool and a private gate to the greenbelt trail.',
    description: [
      'Two white boxes joined by a glass bridge, with the pool slotted between them. Clean, quiet and very bright; the kitchen and living room open fully to the pool terrace.',
      'A private back gate leads onto the Barton Creek greenbelt. Owned solar, EV charger, and a studio over the garage.',
    ],
  },
  {
    id: 'HR-2421', slug: 'white-modern-zilker-lease', title: 'Zilker Modern, Furnished',
    address: '2111 Ford St', neighborhood: 'Zilker', zip: '78704',
    mode: 'rent', type: 'House', price: 8900, beds: 3, baths: 3, sqft: 2400, lotAcres: 0.16, year: 2021, parking: '2-car garage',
    lat: 30.2572, lng: -97.7734, agentId: 'nadia-rahimi', tag: 'Open Sat', daysListed: 5, available: 'Dec 1',
    photos: ['ext-13203179', 'liv-27164969', 'kit-6908565', 'din-24461264', 'bed-8135118', 'bath-7005268'],
    amenities: ['Pool', 'Garage', 'Private yard', 'Home office', 'EV charger', 'In-unit laundry', 'Pet friendly'],
    summary: 'Fully furnished executive lease, with a plunge pool, five minutes from downtown.',
    description: [
      'Offered furnished to a design standard: Danish dining set, linen, kitchenware and a fitted home office. Plunge pool and outdoor shower behind a board-formed concrete wall.',
      '6- to 12-month terms. Utilities, internet, pool service and bi-weekly cleaning included.',
    ],
  },
  {
    id: 'HR-2422', slug: 'craftsman-lease-allandale', title: 'Allandale Family House',
    address: '6204 Shoal Creek Blvd', neighborhood: 'Allandale', zip: '78757',
    mode: 'rent', type: 'House', price: 3900, beds: 3, baths: 2, sqft: 1900, lotAcres: 0.26, year: 1978, parking: '2-car garage',
    lat: 30.3431, lng: -97.7470, agentId: 'nadia-rahimi', daysListed: 16, available: 'Now',
    photos: ['ext-221024', 'liv-11296142', 'kit-7195739', 'bed-6934170', 'bath-7031840'],
    amenities: ['Garage', 'Private yard', 'Pet friendly', 'In-unit laundry', 'Fireplace', 'Balcony or deck'],
    summary: 'Roomy three-bedroom with a big fenced yard, near Shoal Creek trail and top-rated schools.',
    description: [
      'Two-story home with a wraparound porch, a large living room with fireplace and an eat-in kitchen. Fenced quarter-acre yard with a swing set that can stay.',
      'Zoned to Highland Park Elementary. Dogs welcome with deposit. Lawn service included.',
    ],
  },
  {
    id: 'HR-2423', slug: 'sawtooth-townhomes-east', title: 'Sawtooth Townhome, End Unit',
    address: '2400 E Cesar Chavez St, #6', neighborhood: 'East Austin', zip: '78702',
    mode: 'buy', type: 'Townhouse', price: 689000, beds: 2, baths: 2.5, sqft: 1420, year: 2023, parking: '1-car garage', hoa: 185,
    lat: 30.2560, lng: -97.7215, agentId: 'marisol-vega', tag: 'New', daysListed: 5,
    photos: ['ext-32115995', 'liv-7546648', 'kit-10758468', 'bed-7147299', 'bath-35747331'],
    amenities: ['Garage', 'In-unit laundry', 'Balcony or deck', 'Solar panels', 'Pet friendly'],
    summary: 'A 2023 end-unit townhome with a sawtooth roof, solar-ready, near Lady Bird Lake.',
    description: [
      'Part of a twelve-home row designed by a local studio; the end unit gets windows on three sides. Double-height living room, a quiet kitchen with concealed appliances, two en-suite bedrooms upstairs.',
      'Low HOA covers exterior insurance and landscaping. Bike five minutes to the lake trail and Holly Shores.',
    ],
  },
  {
    id: 'HR-2424', slug: 'skyline-loft-downtown', title: 'Second Street Skyline Loft',
    address: '222 West Ave, #2105', neighborhood: 'Downtown', zip: '78701',
    mode: 'rent', type: 'Condo', price: 4600, beds: 2, baths: 2, sqft: 1210, year: 2016, parking: '2 garage spaces',
    lat: 30.2668, lng: -97.7507, agentId: 'nadia-rahimi', daysListed: 10, available: 'Oct 20',
    photos: ['ext-11643330', 'loft-7045921', 'loft-7045941', 'loft-7031409', 'bed-6782479', 'bath-7005268'],
    amenities: ['Gym', 'Concierge', 'Pool', 'Balcony or deck', 'In-unit laundry', 'Pet friendly', 'EV charger'],
    summary: 'Twenty-first-floor loft-style condo above the Second Street district, with two parking spaces.',
    description: [
      'Soaring 12-foot ceilings, polished concrete floors and a wall of glass facing the Capitol. The kitchen has a gas range and a walk-in pantry; both bedrooms have walk-in closets.',
      'Resort-style amenity deck with pool, fitness center and co-working lounge. Two garage spaces, one with EV charger.',
    ],
  },
]

export const listings = L

export const listingBySlug = (slug: string) => L.find((l) => l.slug === slug)

export const NEIGHBORHOOD_NAMES = Array.from(new Set(L.map((l) => l.neighborhood))).sort()

export function similarTo(l: Listing, n = 3) {
  return L.filter((x) => x.id !== l.id && x.mode === l.mode)
    .map((x) => ({ x, score: Math.abs(Math.log(x.price / l.price)) * 3 + Math.abs(x.beds - l.beds) * 0.4 + (x.type === l.type ? 0 : 0.6) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
    .map((s) => s.x)
}
