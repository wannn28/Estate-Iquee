package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

var (
	Types     = []string{"House", "Townhouse", "Condo", "Loft", "Duplex"}
	Amenities = []string{"Pool", "Garage", "Private yard", "Home office", "Pet friendly", "EV charger", "Fireplace", "In-unit laundry",
		"Gym", "Balcony or deck", "Solar panels", "Guest house / ADU", "Water view", "Concierge"}
)

type Listing struct {
	ID           string   `json:"id"`
	Slug         string   `json:"slug"`
	Title        string   `json:"title"`
	Address      string   `json:"address"`
	Neighborhood string   `json:"neighborhood"`
	Zip          string   `json:"zip"`
	Mode         string   `json:"mode"`
	Type         string   `json:"type"`
	Price        int      `json:"price"`
	Beds         int      `json:"beds"`
	Baths        float64  `json:"baths"`
	Sqft         int      `json:"sqft"`
	LotAcres     *float64 `json:"lotAcres,omitempty"`
	Year         int      `json:"year"`
	Parking      string   `json:"parking"`
	HOA          *int     `json:"hoa,omitempty"`
	Lat          float64  `json:"lat"`
	Lng          float64  `json:"lng"`
	Photos       []string `json:"photos"`
	AgentID      string   `json:"agentId"`
	Amenities    []string `json:"amenities"`
	Tag          *string  `json:"tag,omitempty"`
	DaysListed   int      `json:"daysListed"`
	Featured     bool     `json:"featured,omitempty"`
	Summary      string   `json:"summary"`
	Description  []string `json:"description"`
	Available    *string  `json:"available,omitempty"`
}

const listingCols = `l.id, l.slug, l.title, l.address, l.neighborhood, l.zip, l.mode, l.type, l.price, l.beds, l.baths, l.sqft,
	l.lot_acres, l.year_built, l.parking, l.hoa, l.lat, l.lng, l.agent_id, l.tag, l.days_listed, l.featured, l.summary,
	l.description, l.available`

type scanner interface{ Scan(dest ...any) error }

func scanListing(row scanner) (Listing, error) {
	var l Listing
	var desc []byte
	var lot sql.NullFloat64
	var hoa sql.NullInt64
	var tag, avail sql.NullString
	err := row.Scan(&l.ID, &l.Slug, &l.Title, &l.Address, &l.Neighborhood, &l.Zip, &l.Mode, &l.Type, &l.Price, &l.Beds, &l.Baths,
		&l.Sqft, &lot, &l.Year, &l.Parking, &hoa, &l.Lat, &l.Lng, &l.AgentID, &tag, &l.DaysListed, &l.Featured, &l.Summary, &desc, &avail)
	if err != nil {
		return l, err
	}
	if lot.Valid {
		l.LotAcres = &lot.Float64
	}
	if hoa.Valid {
		v := int(hoa.Int64)
		l.HOA = &v
	}
	if tag.Valid {
		l.Tag = &tag.String
	}
	if avail.Valid {
		l.Available = &avail.String
	}
	_ = json.Unmarshal(desc, &l.Description)
	l.Photos, l.Amenities = []string{}, []string{}
	return l, nil
}

// hydrate loads photos and amenities for a page of listings with two IN (...) queries.
func (s *Server) hydrate(ctx context.Context, items []Listing) error {
	if len(items) == 0 {
		return nil
	}
	idx := map[string]int{}
	ph := make([]string, len(items))
	args := make([]any, len(items))
	for i, l := range items {
		idx[l.ID] = i
		ph[i] = "?"
		args[i] = l.ID
	}
	in := strings.Join(ph, ",")
	for _, q := range []struct {
		sql string
		set func(i int, v string)
	}{
		{`SELECT listing_id, photo FROM listing_photos WHERE listing_id IN (` + in + `) ORDER BY listing_id, seq`,
			func(i int, v string) { items[i].Photos = append(items[i].Photos, v) }},
		{`SELECT listing_id, amenity FROM listing_amenities WHERE listing_id IN (` + in + `) ORDER BY listing_id, seq`,
			func(i int, v string) { items[i].Amenities = append(items[i].Amenities, v) }},
	} {
		rows, err := s.db.QueryContext(ctx, q.sql, args...)
		if err != nil {
			return err
		}
		for rows.Next() {
			var id, v string
			if err := rows.Scan(&id, &v); err != nil {
				rows.Close()
				return err
			}
			q.set(idx[id], v)
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return err
		}
	}
	return nil
}

func (s *Server) queryListings(ctx context.Context, q string, args ...any) ([]Listing, error) {
	rows, err := s.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Listing{}
	for rows.Next() {
		l, err := scanListing(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, s.hydrate(ctx, out)
}

// ---------- search ----------

type where struct {
	conds []string
	args  []any
}

func (w *where) add(cond string, args ...any) {
	w.conds = append(w.conds, cond)
	w.args = append(w.args, args...)
}
func (w *where) sql() string {
	if len(w.conds) == 0 {
		return ""
	}
	return " WHERE " + strings.Join(w.conds, " AND ")
}

func splitList(v string, allowed []string) []string {
	var out []string
	for _, x := range strings.Split(v, ",") {
		x = strings.TrimSpace(x)
		for _, a := range allowed {
			if x == a {
				out = append(out, x)
				break
			}
		}
	}
	return out
}

func placeholders(n int) string { return strings.TrimSuffix(strings.Repeat("?,", n), ",") }

// buildWhere mirrors every filter of the search page. withFacetFilters=false leaves out type and
// amenities so the sidebar can show "how many homes you'd get" counts next to each checkbox.
func buildWhere(r *http.Request, withFacetFilters bool) (*where, error) {
	q := r.URL.Query()
	w := &where{}
	mode := q.Get("mode")
	if mode != "rent" {
		mode = "buy"
	}
	w.add("l.mode = ?", mode)
	if area := q.Get("area"); area != "" {
		w.add("l.neighborhood IN (SELECT area FROM neighborhood_areas WHERE neighborhood_slug = ?)", area)
	}
	num := func(k string) (int, bool) {
		v, err := strconv.Atoi(q.Get(k))
		return v, err == nil && v > 0
	}
	if v, ok := num("min"); ok {
		w.add("l.price >= ?", v)
	}
	if v, ok := num("max"); ok {
		w.add("l.price <= ?", v)
	}
	if v, ok := num("beds"); ok {
		w.add("l.beds >= ?", v)
	}
	if v, ok := num("baths"); ok {
		w.add("l.baths >= ?", v)
	}
	if a := q.Get("agent"); a != "" {
		w.add("l.agent_id = ?", a)
	}
	if q.Get("featured") == "true" {
		w.add("l.featured = TRUE")
	}
	if b := q.Get("bounds"); b != "" { // south,west,north,east (map viewport)
		p := strings.Split(b, ",")
		if len(p) != 4 {
			return nil, errors.New("bounds must be south,west,north,east")
		}
		f := make([]float64, 4)
		for i := range p {
			v, err := strconv.ParseFloat(strings.TrimSpace(p[i]), 64)
			if err != nil || math.IsNaN(v) {
				return nil, errors.New("bounds must be four numbers")
			}
			f[i] = v
		}
		w.add("l.lat BETWEEN ? AND ? AND l.lng BETWEEN ? AND ?", f[0], f[2], f[1], f[3])
	}
	if withFacetFilters {
		if t := splitList(q.Get("type"), Types); len(t) > 0 {
			args := make([]any, len(t))
			for i := range t {
				args[i] = t[i]
			}
			w.add("l.type IN ("+placeholders(len(t))+")", args...)
		}
		if am := splitList(q.Get("amenities"), Amenities); len(am) > 0 {
			args := make([]any, 0, len(am)+1)
			for _, a := range am {
				args = append(args, a)
			}
			args = append(args, len(am))
			w.add(`l.id IN (SELECT listing_id FROM listing_amenities WHERE amenity IN (`+placeholders(len(am))+`)
				GROUP BY listing_id HAVING COUNT(DISTINCT amenity) = ?)`, args...)
		}
	}
	return w, nil
}

var sortSQL = map[string]string{
	"newest":     "l.days_listed ASC, l.sort_order ASC",
	"price-asc":  "l.price ASC, l.sort_order ASC",
	"price-desc": "l.price DESC, l.sort_order ASC",
	"sqft-desc":  "l.sqft DESC, l.sort_order ASC",
}

func (s *Server) listListings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()
	wh, err := buildWhere(r, true)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "bad_request", err.Error(), nil)
		return
	}
	order, ok := sortSQL[q.Get("sort")]
	if !ok {
		order = sortSQL["newest"]
	}
	size, _ := strconv.Atoi(q.Get("size"))
	if size < 1 || size > 100 {
		size = 24
	}
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	var total int
	var south, west, north, east sql.NullFloat64
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*), MIN(l.lat), MIN(l.lng), MAX(l.lat), MAX(l.lng) FROM listings l`+wh.sql(), wh.args...).
		Scan(&total, &south, &west, &north, &east); err != nil {
		s.internal(w, r, err)
		return
	}
	items, err := s.queryListings(ctx, `SELECT `+listingCols+` FROM listings l`+wh.sql()+` ORDER BY `+order+` LIMIT ? OFFSET ?`,
		append(wh.args, size, (page-1)*size)...)
	if err != nil {
		s.internal(w, r, err)
		return
	}

	// facet counts on the base filter (without type/amenity selections)
	base, _ := buildWhere(r, false)
	types := map[string]int{}
	for _, t := range Types {
		types[t] = 0
	}
	amen := map[string]int{}
	for _, a := range Amenities {
		amen[a] = 0
	}
	if err := s.countInto(ctx, types, `SELECT l.type, COUNT(*) FROM listings l`+base.sql()+` GROUP BY l.type`, base.args...); err != nil {
		s.internal(w, r, err)
		return
	}
	if err := s.countInto(ctx, amen, `SELECT a.amenity, COUNT(*) FROM listing_amenities a JOIN listings l ON l.id = a.listing_id`+
		base.sql()+` GROUP BY a.amenity`, base.args...); err != nil {
		s.internal(w, r, err)
		return
	}
	var extent any
	if south.Valid {
		extent = map[string]float64{"south": south.Float64, "west": west.Float64, "north": north.Float64, "east": east.Float64}
	}
	cacheable(w)
	writeJSON(w, http.StatusOK, map[string]any{
		"items": items, "total": total, "page": page, "size": size, "pages": int(math.Max(1, math.Ceil(float64(total)/float64(size)))),
		"facets": map[string]any{"types": types, "amenities": amen}, "extent": extent,
	})
}

func (s *Server) countInto(ctx context.Context, m map[string]int, q string, args ...any) error {
	rows, err := s.db.QueryContext(ctx, q, args...)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var k string
		var n int
		if err := rows.Scan(&k, &n); err != nil {
			return err
		}
		m[k] = n
	}
	return rows.Err()
}

// ---------- detail / similar / home ----------

func (s *Server) listingBySlug(ctx context.Context, slug string) (*Listing, error) {
	items, err := s.queryListings(ctx, `SELECT `+listingCols+` FROM listings l WHERE l.slug = ?`, slug)
	if err != nil || len(items) == 0 {
		return nil, err
	}
	return &items[0], nil
}

func (s *Server) getListing(w http.ResponseWriter, r *http.Request) {
	l, err := s.listingBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		s.internal(w, r, err)
		return
	}
	if l == nil {
		writeErr(w, http.StatusNotFound, "not_found", "Listing not found.", nil)
		return
	}
	a, err := s.agentByID(r.Context(), l.AgentID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		s.internal(w, r, err)
		return
	}
	cacheable(w)
	writeJSON(w, http.StatusOK, map[string]any{"listing": l, "agent": a})
}

// similarListings ranks same-mode homes by price ratio, bedroom gap and type in SQL.
func (s *Server) similarListings(w http.ResponseWriter, r *http.Request) {
	n, _ := strconv.Atoi(r.URL.Query().Get("n"))
	if n < 1 || n > 12 {
		n = 3
	}
	items, err := s.queryListings(r.Context(), `SELECT `+listingCols+` FROM listings l JOIN listings ref ON ref.slug = ?
		WHERE l.id <> ref.id AND l.mode = ref.mode
		ORDER BY ABS(LN(l.price / ref.price)) * 3 + ABS(CAST(l.beds AS SIGNED) - CAST(ref.beds AS SIGNED)) * 0.4
		         + IF(l.type = ref.type, 0, 0.6), l.sort_order
		LIMIT ?`, chi.URLParam(r, "slug"), n)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	cacheable(w)
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) home(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	featured, err := s.queryListings(ctx, `SELECT `+listingCols+` FROM listings l WHERE l.featured = TRUE ORDER BY l.sort_order`)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	recent, err := s.queryListings(ctx, `SELECT `+listingCols+` FROM listings l WHERE l.featured = FALSE ORDER BY l.days_listed, l.sort_order LIMIT 6`)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	counts := map[string]int{"buy": 0, "rent": 0}
	if err := s.countInto(ctx, counts, `SELECT mode, COUNT(*) FROM listings GROUP BY mode`); err != nil {
		s.internal(w, r, err)
		return
	}
	var cover any
	if len(featured) > 0 {
		cover = featured[0]
		featured = featured[1:]
	}
	cacheable(w)
	writeJSON(w, http.StatusOK, map[string]any{"cover": cover, "featured": featured, "recent": recent, "counts": counts})
}

// ---------- agents / neighborhoods / testimonials ----------

type Agent struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Title          string   `json:"title"`
	Photo          string   `json:"photo"`
	Phone          string   `json:"phone"`
	Email          string   `json:"email"`
	Areas          []string `json:"areas"`
	Languages      []string `json:"languages"`
	Since          int      `json:"since"`
	Sold           int      `json:"sold"`
	AvgDays        int      `json:"avgDays"`
	Bio            string   `json:"bio"`
	Quote          string   `json:"quote"`
	ActiveListings int      `json:"activeListings"`
	RentOnly       bool     `json:"rentOnly"`
}

const agentSQL = `SELECT a.id, a.name, a.title, a.photo, a.phone, a.email, a.areas, a.languages, a.since, a.sold, a.avg_days, a.bio, a.quote,
	COUNT(l.id), COALESCE(SUM(l.mode = 'buy'), 0) = 0 AND COUNT(l.id) > 0
	FROM agents a LEFT JOIN listings l ON l.agent_id = a.id`

func scanAgent(row scanner) (Agent, error) {
	var a Agent
	var areas, langs []byte
	err := row.Scan(&a.ID, &a.Name, &a.Title, &a.Photo, &a.Phone, &a.Email, &areas, &langs, &a.Since, &a.Sold, &a.AvgDays, &a.Bio,
		&a.Quote, &a.ActiveListings, &a.RentOnly)
	_ = json.Unmarshal(areas, &a.Areas)
	_ = json.Unmarshal(langs, &a.Languages)
	return a, err
}

func (s *Server) agentByID(ctx context.Context, id string) (*Agent, error) {
	a, err := scanAgent(s.db.QueryRowContext(ctx, agentSQL+` WHERE a.id = ? GROUP BY a.id`, id))
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *Server) listAgents(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.QueryContext(r.Context(), agentSQL+` GROUP BY a.id ORDER BY a.sort_order`)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	defer rows.Close()
	out := []Agent{}
	for rows.Next() {
		a, err := scanAgent(rows)
		if err != nil {
			s.internal(w, r, err)
			return
		}
		out = append(out, a)
	}
	cacheable(w)
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) getAgent(w http.ResponseWriter, r *http.Request) {
	a, err := s.agentByID(r.Context(), chi.URLParam(r, "id"))
	if errors.Is(err, sql.ErrNoRows) {
		writeErr(w, http.StatusNotFound, "not_found", "Agent not found.", nil)
		return
	}
	if err != nil {
		s.internal(w, r, err)
		return
	}
	cacheable(w)
	writeJSON(w, http.StatusOK, a)
}

func (s *Server) listNeighborhoods(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.QueryContext(r.Context(), `SELECT n.slug, n.name, n.photo, n.blurb, n.median,
		(SELECT COUNT(*) FROM listings l JOIN neighborhood_areas na ON na.area = l.neighborhood WHERE na.neighborhood_slug = n.slug)
		FROM neighborhoods n ORDER BY n.sort_order`)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	type hood struct {
		Slug     string   `json:"slug"`
		Name     string   `json:"name"`
		Covers   []string `json:"covers"`
		Photo    string   `json:"photo"`
		Blurb    string   `json:"blurb"`
		Median   string   `json:"median"`
		Listings int      `json:"listings"`
	}
	out := []hood{}
	for rows.Next() {
		var h hood
		if err := rows.Scan(&h.Slug, &h.Name, &h.Photo, &h.Blurb, &h.Median, &h.Listings); err != nil {
			rows.Close()
			s.internal(w, r, err)
			return
		}
		h.Covers = []string{}
		out = append(out, h)
	}
	rows.Close()
	crows, err := s.db.QueryContext(r.Context(), `SELECT neighborhood_slug, area FROM neighborhood_areas ORDER BY neighborhood_slug, area`)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	defer crows.Close()
	for crows.Next() {
		var slug, area string
		if err := crows.Scan(&slug, &area); err != nil {
			s.internal(w, r, err)
			return
		}
		for i := range out {
			if out[i].Slug == slug {
				out[i].Covers = append(out[i].Covers, area)
			}
		}
	}
	cacheable(w)
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) listTestimonials(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.QueryContext(r.Context(), `SELECT quote, name, detail FROM testimonials ORDER BY sort_order, id`)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	defer rows.Close()
	type t struct {
		Quote  string `json:"quote"`
		Name   string `json:"name"`
		Detail string `json:"detail"`
	}
	out := []t{}
	for rows.Next() {
		var x t
		if err := rows.Scan(&x.Quote, &x.Name, &x.Detail); err != nil {
			s.internal(w, r, err)
			return
		}
		out = append(out, x)
	}
	cacheable(w)
	writeJSON(w, http.StatusOK, out)
}
