export interface Neighborhood {
  slug: string
  name: string
  covers: string[]
  photo: string
  blurb: string
  median: string
}

export const neighborhoods: Neighborhood[] = [
  { slug: 'downtown', name: 'Downtown & Rainey', covers: ['Downtown', 'Rainey Street'], photo: 'hood-273204', blurb: 'High-rise condos and warehouse lofts, a short walk from the lake trail and the Second Street district.', median: '$4,100/mo · rent' },
  { slug: 'zilker', name: 'Zilker & Barton Hills', covers: ['Zilker', 'Barton Hills'], photo: 'hood-38364701', blurb: 'Greenbelt access, Barton Springs in the summer and some of the city’s best mid-century modern stock.', median: '$1.9M median' },
  { slug: 'travis-heights', name: 'Travis Heights & Bouldin', covers: ['Travis Heights', 'Bouldin Creek'], photo: 'hood-28649004', blurb: 'Winding streets off South Congress, 1930s bungalows next to crisp new infill.', median: '$1.2M median' },
  { slug: 'hyde-park', name: 'Hyde Park & Allandale', covers: ['Hyde Park', 'Allandale'], photo: 'hood-5524164', blurb: 'Porches, pecan trees and a historic district just north of the university.', median: '$1.1M median' },
  { slug: 'east-austin', name: 'East Austin & Mueller', covers: ['East Austin', 'Cherrywood', 'Mueller'], photo: 'hood-17459206', blurb: 'Taquerías, studios and new townhomes; Mueller’s lake park and farmers market to the north.', median: '$780K median' },
  { slug: 'westlake', name: 'Westlake & Lake Austin', covers: ['Westlake', 'Lake Austin', 'Tarrytown', 'Clarksville'], photo: 'hood-18583622', blurb: 'Hill Country views, top-rated schools and private docks on the river.', median: '$2.8M median' },
]
