/**
 * Exports the hand-written demo content in src/data/ (24 listings, 6 agents, neighborhoods, testimonials)
 * to server/internal/seed/seed.json. The Go API embeds the file and loads it into MySQL on first start.
 *   npm run seed:export   (run from the project root)
 */
import { writeFileSync } from 'node:fs'
import { listings } from '../src/data/listings'
import { agents } from '../src/data/agents'
import { neighborhoods } from '../src/data/neighborhoods'
import { testimonials } from '../src/data/testimonials'

const out = { listings, agents, neighborhoods, testimonials }
writeFileSync('server/internal/seed/seed.json', JSON.stringify(out, null, 1))
console.log(`seed.json: ${listings.length} listings, ${agents.length} agents, ${neighborhoods.length} neighborhoods, ${testimonials.length} testimonials`)
