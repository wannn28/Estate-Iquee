// Package seed loads the Hollis Row catalogue (listings, agents, neighborhoods, testimonials) into MySQL.
//
// seed.json is exported from the frontend's original src/data/*.ts with `npm run seed:export`.
package seed

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"fmt"
)

//go:embed seed.json
var raw []byte

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
	LotAcres     *float64 `json:"lotAcres"`
	Year         int      `json:"year"`
	Parking      string   `json:"parking"`
	HOA          *int     `json:"hoa"`
	Lat          float64  `json:"lat"`
	Lng          float64  `json:"lng"`
	Photos       []string `json:"photos"`
	AgentID      string   `json:"agentId"`
	Amenities    []string `json:"amenities"`
	Tag          *string  `json:"tag"`
	DaysListed   int      `json:"daysListed"`
	Featured     bool     `json:"featured"`
	Summary      string   `json:"summary"`
	Description  []string `json:"description"`
	Available    *string  `json:"available"`
}

type Agent struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Title     string   `json:"title"`
	Photo     string   `json:"photo"`
	Phone     string   `json:"phone"`
	Email     string   `json:"email"`
	Areas     []string `json:"areas"`
	Languages []string `json:"languages"`
	Since     int      `json:"since"`
	Sold      int      `json:"sold"`
	AvgDays   int      `json:"avgDays"`
	Bio       string   `json:"bio"`
	Quote     string   `json:"quote"`
}

type Data struct {
	Listings      []Listing `json:"listings"`
	Agents        []Agent   `json:"agents"`
	Neighborhoods []struct {
		Slug   string   `json:"slug"`
		Name   string   `json:"name"`
		Covers []string `json:"covers"`
		Photo  string   `json:"photo"`
		Blurb  string   `json:"blurb"`
		Median string   `json:"median"`
	} `json:"neighborhoods"`
	Testimonials []struct {
		Quote  string `json:"quote"`
		Name   string `json:"name"`
		Detail string `json:"detail"`
	} `json:"testimonials"`
}

func Load() (*Data, error) {
	var d Data
	if err := json.Unmarshal(raw, &d); err != nil {
		return nil, fmt.Errorf("seed.json: %w", err)
	}
	return &d, nil
}

// IsEmpty reports whether the catalogue has not been loaded yet.
func IsEmpty(ctx context.Context, db *sql.DB) (bool, error) {
	var n int
	err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM listings`).Scan(&n)
	return n == 0, err
}

func mustJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}

// Load inserts the whole catalogue in one transaction. Visitor data (tours, messages, saved homes) is untouched.
func Seed(ctx context.Context, db *sql.DB, d *Data) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck
	exec := func(q string, args ...any) error {
		_, err := tx.ExecContext(ctx, q, args...)
		return err
	}
	for i, a := range d.Agents {
		if err := exec(`INSERT INTO agents (id, name, title, photo, phone, email, areas, languages, since, sold, avg_days, bio, quote, sort_order)
			VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, a.ID, a.Name, a.Title, a.Photo, a.Phone, a.Email, mustJSON(a.Areas), mustJSON(a.Languages),
			a.Since, a.Sold, a.AvgDays, a.Bio, a.Quote, i); err != nil {
			return fmt.Errorf("agent %s: %w", a.ID, err)
		}
	}
	for i, h := range d.Neighborhoods {
		if err := exec(`INSERT INTO neighborhoods (slug, name, photo, blurb, median, sort_order) VALUES (?,?,?,?,?,?)`,
			h.Slug, h.Name, h.Photo, h.Blurb, h.Median, i); err != nil {
			return err
		}
		for _, c := range h.Covers {
			if err := exec(`INSERT INTO neighborhood_areas (neighborhood_slug, area) VALUES (?,?)`, h.Slug, c); err != nil {
				return err
			}
		}
	}
	for i, l := range d.Listings {
		if err := exec(`INSERT INTO listings (id, slug, title, address, neighborhood, zip, mode, type, price, beds, baths, sqft, lot_acres,
			year_built, parking, hoa, lat, lng, agent_id, tag, days_listed, featured, summary, description, available, sort_order)
			VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
			l.ID, l.Slug, l.Title, l.Address, l.Neighborhood, l.Zip, l.Mode, l.Type, l.Price, l.Beds, l.Baths, l.Sqft, l.LotAcres,
			l.Year, l.Parking, l.HOA, l.Lat, l.Lng, l.AgentID, l.Tag, l.DaysListed, l.Featured, l.Summary, mustJSON(l.Description),
			l.Available, i); err != nil {
			return fmt.Errorf("listing %s: %w", l.ID, err)
		}
		for k, p := range l.Photos {
			if err := exec(`INSERT INTO listing_photos (listing_id, seq, photo) VALUES (?,?,?)`, l.ID, k, p); err != nil {
				return err
			}
		}
		for k, a := range l.Amenities {
			if err := exec(`INSERT INTO listing_amenities (listing_id, amenity, seq) VALUES (?,?,?)`, l.ID, a, k); err != nil {
				return err
			}
		}
	}
	for i, t := range d.Testimonials {
		if err := exec(`INSERT INTO testimonials (quote, name, detail, sort_order) VALUES (?,?,?,?)`, t.Quote, t.Name, t.Detail, i); err != nil {
			return err
		}
	}
	return tx.Commit()
}
