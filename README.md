# Hollis Row — real-estate listing website (demo by iQuee)

A full-stack property portal for **Hollis Row**, a fictional independent brokerage in Austin, Texas.
Editorial look (big photography, Instrument Serif headlines, one deep "live-oak" green accent, square corners and hairline rules),
seeded with 24 listings — 16 for sale, 8 for rent — six agents and six neighborhood guides.
A React SPA talks to a **Go REST API backed by MySQL 8**: search, filtering, sorting, pagination and facet counts run in SQL,
tour requests and contact messages are validated and stored server-side, saved homes sync to the database under an anonymous
browser id, and a small JWT-protected admin inbox lists what visitors submitted.
**Demo only — every listing, agent, price and address is fictional. Nothing is for sale; submissions are stored (PII masked in
the admin view, purged after 14 days) but never emailed or shared.**

- Live: https://estate.iquee.tech
- Repository: https://github.com/wannn28/Estate-Iquee

## Features

- **Home:** full-bleed hero with Buy/Rent search (neighborhood, max price, beds), editorial featured-homes layout,
  "recently listed" index table, neighborhood guides, agent strip, testimonial switcher, seller CTA.
- **Search** (`/search`): Buy/Rent toggle; filters for neighborhood, price range, beds, baths, property type, 14 amenities and
  listing agent (facet counts computed by the API); removable filter chips; sort (newest, price ↑/↓, largest); **grid / list / map** views.
  All state is in the URL, so every search is shareable; results page 12 at a time with "Show more". Mobile gets a slide-in filter drawer.
- **Map view:** Leaflet + OpenStreetMap tiles (no API key), price-label markers that highlight when you hover a result,
  popups with photo and link, auto-fit to the current results.
- **Property detail** (`/listing/:slug`): photo mosaic + keyboard/touch **lightbox** (←/→, Esc, swipe, thumbnails, focus trap),
  key-facts grid, description, amenities, **schematic floor plan** (SVG generated from room count and area), location map with
  nearby list, **mortgage calculator** (price, down-payment slider, rate, 15/20/30-yr term, tax, insurance, HOA, PMI, stacked
  breakdown) — rentals show move-in costs instead — agent card, **schedule-a-tour form** (client + server validation, stored in
  MySQL, rate-limited, honeypot) and similar listings ranked by the API.
- **Saved homes** (`/saved`): heart any listing; the shortlist is stored in MySQL under a random per-browser UUID (no sign-up),
  with optimistic updates and a compare table.
- **Agents** (`/agents`) and **Contact** (`/contact`, validated form with topic + preferred agent, stored server-side, office map).
- **Admin inbox** (`/admin`, demo login prefilled): stats, paginated tour requests and contact messages with masked PII.
- Accessibility: semantic landmarks, skip link, labelled controls, `aria-invalid`/`aria-describedby` on errors,
  visible focus rings, keyboard-operable radios/toggles, reduced-motion support. Responsive from 360 px up.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18.3, TypeScript 5.6 (strict), React Router 6.30, Tailwind CSS 3.4, Fontsource (Instrument Serif, Geist) |
| Maps | Leaflet 1.9 + React Leaflet 4.2, OpenStreetMap raster tiles (no API key) |
| Backend / API | **Go 1.26** (module targets Go ≥ 1.22 features), **chi v5** router, go-chi/cors, go-chi/httprate (form rate limiting), `log/slog` JSON logs, graceful shutdown |
| Database | **MySQL 8.0** via `database/sql` + **go-sql-driver/mysql**; schema managed with **golang-migrate** (embedded SQL migrations) |
| Auth | JWT (golang-jwt v5, HS256) for the demo admin; bcrypt password hash; anonymous UUID v4 client id for saved homes |
| Seed data | The original `src/data/*.ts` catalogue is exported to `server/internal/seed/seed.json` (`npm run seed:export`) and loaded into an empty database on first start |
| Containers | Multi-stage Dockerfile (golang:1.26-alpine → `scratch`, ~13 MB image, non-root, read-only FS); Docker Compose (api + db, named volume, DB not published) |
| Hosting | Nginx on an Ubuntu VPS serves the static `dist/` and reverse-proxies `/api/` to the API on `127.0.0.1:3006`; Cloudflare in front, Let's Encrypt SSL |
| Build / lint | Vite 5.4, ESLint 9 + typescript-eslint; `go vet` |
| Testing | Playwright (Python): `tools/e2e-api.py` runs the full flow against the real API (search, facets, paging, map, tour request, saved homes, contact, admin) and fails on any console error |

## Architecture

```
browser ──https──> Cloudflare ──> Nginx (VPS)
                                   ├─ /        → /var/www/iquee-estate (Vite build, SPA fallback)
                                   └─ /api/    → 127.0.0.1:3006 → [api container: Go + chi] ──> [db container: MySQL 8]
                                                                       (docker network only, volume mysqldata)
```

- `server/cmd/api` — entry point: config from env, waits for MySQL, runs migrations, seeds an empty DB, ensures the demo admin
  user, serves HTTP, purges old submissions hourly, shuts down gracefully on SIGTERM. `-healthcheck` flag for Docker.
- `server/internal/api` — handlers (`listings.go` search/detail/similar/home/agents/neighborhoods, `forms.go` tours/contact/saved/admin
  login, `admin.go` inbox), middleware (request id, structured access log, recoverer, CORS locked to `CORS_ORIGINS`, rate limits).
- `server/internal/db` — connection pool + golang-migrate with embedded migrations (`migrations/000001_init.*.sql`).
- `server/internal/seed` — embedded `seed.json` loader. `server/internal/auth` — JWT issue/verify middleware.
- Frontend: `src/lib/api.ts` (fetch wrapper + `useApi` hook with loading/error state), `src/lib/catalog.tsx` (agents and
  neighborhoods context), `src/lib/favorites.tsx` (server-synced shortlist). `src/data/*.ts` is now only the seed source + types.

### API (all under `/api`)

| Method & path | Purpose |
| --- | --- |
| `GET /health` | Liveness + DB ping |
| `GET /home` | Cover listing, featured, recently listed, buy/rent counts |
| `GET /listings` | Search. Query: `mode=buy|rent`, `area` (neighborhood slug), `min`, `max`, `beds`, `baths`, `type=House,Condo…`, `amenities=Pool,Garage…` (all must match), `agent`, `featured=true`, `bounds=south,west,north,east` (map viewport), `sort=newest|price-asc|price-desc|sqft-desc`, `page`, `size` (≤100). Returns `items`, `total`, `pages`, `facets` (type/amenity counts), `extent` (bounding box) |
| `GET /listings/{slug}` | Listing detail + agent |
| `GET /listings/{slug}/similar?n=3` | Similar homes scored in SQL (same mode, type, area, price band, beds) |
| `GET /agents`, `GET /agents/{id}` | Agents with active-listing counts |
| `GET /neighborhoods`, `GET /testimonials` | Guides with listing counts; testimonials |
| `POST /tour-requests` | Validated (listing exists, date within 3 weeks and not a Sunday in Austin time, time slot, email, consent), 5/min and 30/day per IP, honeypot |
| `POST /contact-messages` | Validated topic, name, email, phone, agent, message; same limits |
| `GET/DELETE /saved/{clientId}`, `POST /saved/{clientId}/merge`, `PUT/DELETE /saved/{clientId}/{listingId}` | Saved homes keyed by an anonymous UUID v4 (max 100) |
| `POST /admin/login` | Demo admin → JWT |
| `GET /admin/me`, `/admin/stats`, `/admin/tour-requests`, `/admin/contact-messages` | Bearer JWT; paginated, PII masked |

Demo admin: **admin@hollisrow.example / hollis-demo** (public on purpose, prefilled on `/admin`).

## Run it locally

Everything in Docker (API on http://127.0.0.1:3006):

```bash
cp .env.example .env               # set MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, JWT_SECRET (openssl rand -hex 32)
chmod 600 .env
docker compose up -d --build       # mysql:8.0 + the Go API; the DB is seeded on first start
curl http://127.0.0.1:3006/api/health
npm install
API_PROXY=http://127.0.0.1:3006 npm run dev   # Vite proxies /api to the API
```

Or run the API directly (Go 1.22+ and any MySQL 8 / MariaDB 10.6+):

```bash
cd server
DATABASE_DSN='estate:pass@tcp(127.0.0.1:3306)/estate?parseTime=true' JWT_SECRET=$(openssl rand -hex 32) \
  CORS_ORIGINS=http://localhost:5173 PORT=8080 go run ./cmd/api
go vet ./... && go build ./...
```

Frontend scripts: `npm run dev`, `npm run build` (→ `dist/`), `npm run lint`, `npm run seed:export` (regenerate `seed.json` from `src/data`).
End-to-end: `npx vite preview --port 4191 & python tools/e2e-api.py http://localhost:4191 shot-local` (`shots.py` / `flow.py` are
the older screenshot/flow scripts from the static version).

### Configuration (`.env`)

`MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `JWT_SECRET` (required); `API_PORT` (default 3006, bound to 127.0.0.1 only);
`CORS_ORIGINS` (default `https://estate.iquee.tech`); `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD`; `ADMIN_MASK_PII` (default true);
`RETENTION` (default `336h`); `LOG_LEVEL`.

### Nginx

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3006;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
location / { try_files $uri $uri/ /index.html; }
```

### What a production build would still add

MLS/IDX feed import, PostGIS or MySQL spatial indexes for radius search at scale, object storage + CDN for photos, real user
accounts, CRM/email delivery for tour requests, and a commercial tile provider instead of the public OSM tile servers.

## Screenshots

| Home | Search — grid |
| --- | --- |
| ![Home](docs/home.png) | ![Search results, grid view](docs/search-grid.png) |
| **Search — map** | **Property detail** |
| ![Search results, map view](docs/search-map.png) | ![Property detail page](docs/detail.png) |
| **Lightbox** | **Mortgage calculator** |
| ![Photo lightbox](docs/lightbox.png) | ![Mortgage calculator](docs/calculator.png) |
| **Mobile — home** | **Mobile — search** |
| ![Mobile home](docs/mobile-home.png) | ![Mobile search](docs/mobile-search.png) |

## Notes & caveats

- Photos are Pexels stock images (credits in [CREDITS.md](CREDITS.md)); one photo set is reused across a few listings' interiors.
- Map tiles are fetched live from `tile.openstreetmap.org`, which is fine for a low-traffic portfolio demo under the OSM tile
  usage policy but not for production traffic.
- Floor plans are schematic, generated from bedroom/bath count and area — not real measured plans.
- Street names are real Austin streets with invented house numbers; coordinates are approximate.
