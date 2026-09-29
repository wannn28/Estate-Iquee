package api

import (
	"database/sql"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// The demo admin login is published on the site, so by default personal data from other visitors
// is masked in admin responses (ADMIN_MASK_PII=false shows it in full on a private deployment).
func (s *Server) maskEmail(e string) string {
	if !s.cfg.MaskPII {
		return e
	}
	at := strings.LastIndex(e, "@")
	if at < 1 {
		return "•••"
	}
	user, domain := e[:at], e[at+1:]
	dot := strings.LastIndex(domain, ".")
	tld := ""
	if dot > 0 {
		tld = domain[dot:]
		domain = domain[:dot]
	}
	return user[:1] + "•••@" + domain[:min(1, len(domain))] + "•••" + tld
}

func (s *Server) maskPhone(p sql.NullString) *string {
	if !p.Valid || p.String == "" {
		return nil
	}
	v := p.String
	if s.cfg.MaskPII {
		digits := 0
		out := []rune(v)
		for i := len(out) - 1; i >= 0; i-- {
			if out[i] >= '0' && out[i] <= '9' {
				digits++
				if digits > 2 {
					out[i] = '•'
				}
			}
		}
		v = string(out)
	}
	return &v
}

func (s *Server) maskName(n string) string {
	if !s.cfg.MaskPII {
		return n
	}
	parts := strings.Fields(n)
	if len(parts) == 0 {
		return n
	}
	out := parts[0]
	if len(parts) > 1 {
		out += " " + string([]rune(parts[len(parts)-1])[0]) + "."
	}
	return out
}

func pageParams(r *http.Request) (page, size int) {
	page, _ = strconv.Atoi(r.URL.Query().Get("page"))
	size, _ = strconv.Atoi(r.URL.Query().Get("size"))
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}
	return
}

func (s *Server) adminStats(w http.ResponseWriter, r *http.Request) {
	var tours, tours7, msgs, msgs7, savers int
	err := s.db.QueryRowContext(r.Context(), `SELECT
		(SELECT COUNT(*) FROM tour_requests), (SELECT COUNT(*) FROM tour_requests WHERE created_at >= NOW() - INTERVAL 7 DAY),
		(SELECT COUNT(*) FROM contact_messages), (SELECT COUNT(*) FROM contact_messages WHERE created_at >= NOW() - INTERVAL 7 DAY),
		(SELECT COUNT(DISTINCT client_id) FROM saved_homes)`).Scan(&tours, &tours7, &msgs, &msgs7, &savers)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"tourRequests": tours, "tourRequests7d": tours7, "contactMessages": msgs,
		"contactMessages7d": msgs7, "savingVisitors": savers, "retentionDays": int(s.cfg.Retention.Hours() / 24), "piiMasked": s.cfg.MaskPII})
}

func (s *Server) adminTours(w http.ResponseWriter, r *http.Request) {
	page, size := pageParams(r)
	var total int
	if err := s.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM tour_requests`).Scan(&total); err != nil {
		s.internal(w, r, err)
		return
	}
	rows, err := s.db.QueryContext(r.Context(), `SELECT t.id, t.listing_id, l.title, l.slug, DATE_FORMAT(t.tour_date, '%Y-%m-%d'), t.tour_time,
		t.kind, t.name, t.email, t.phone, t.note, t.created_at
		FROM tour_requests t JOIN listings l ON l.id = t.listing_id ORDER BY t.created_at DESC, t.id DESC LIMIT ? OFFSET ?`, size, (page-1)*size)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	defer rows.Close()
	type tour struct {
		ID           int64     `json:"id"`
		ListingID    string    `json:"listingId"`
		ListingTitle string    `json:"listingTitle"`
		ListingSlug  string    `json:"listingSlug"`
		Date         string    `json:"date"`
		Time         string    `json:"time"`
		Kind         string    `json:"kind"`
		Name         string    `json:"name"`
		Email        string    `json:"email"`
		Phone        *string   `json:"phone"`
		Note         *string   `json:"note"`
		CreatedAt    time.Time `json:"createdAt"`
	}
	out := []tour{}
	for rows.Next() {
		var t tour
		var phone, note sql.NullString
		if err := rows.Scan(&t.ID, &t.ListingID, &t.ListingTitle, &t.ListingSlug, &t.Date, &t.Time, &t.Kind, &t.Name, &t.Email, &phone, &note, &t.CreatedAt); err != nil {
			s.internal(w, r, err)
			return
		}
		t.Name, t.Email, t.Phone = s.maskName(t.Name), s.maskEmail(t.Email), s.maskPhone(phone)
		if note.Valid {
			t.Note = &note.String
		}
		out = append(out, t)
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": out, "total": total, "page": page, "size": size,
		"pages": int(math.Max(1, math.Ceil(float64(total)/float64(size))))})
}

func (s *Server) adminMessages(w http.ResponseWriter, r *http.Request) {
	page, size := pageParams(r)
	var total int
	if err := s.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM contact_messages`).Scan(&total); err != nil {
		s.internal(w, r, err)
		return
	}
	rows, err := s.db.QueryContext(r.Context(), `SELECT m.id, m.topic, m.name, m.email, m.phone, m.agent_id, a.name, m.message, m.created_at
		FROM contact_messages m LEFT JOIN agents a ON a.id = m.agent_id ORDER BY m.created_at DESC, m.id DESC LIMIT ? OFFSET ?`, size, (page-1)*size)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	defer rows.Close()
	type msg struct {
		ID        int64     `json:"id"`
		Topic     string    `json:"topic"`
		Name      string    `json:"name"`
		Email     string    `json:"email"`
		Phone     *string   `json:"phone"`
		AgentID   *string   `json:"agentId"`
		AgentName *string   `json:"agentName"`
		Message   string    `json:"message"`
		CreatedAt time.Time `json:"createdAt"`
	}
	out := []msg{}
	for rows.Next() {
		var m msg
		var phone, agentID, agentName sql.NullString
		if err := rows.Scan(&m.ID, &m.Topic, &m.Name, &m.Email, &phone, &agentID, &agentName, &m.Message, &m.CreatedAt); err != nil {
			s.internal(w, r, err)
			return
		}
		m.Name, m.Email, m.Phone = s.maskName(m.Name), s.maskEmail(m.Email), s.maskPhone(phone)
		if agentID.Valid {
			m.AgentID, m.AgentName = &agentID.String, &agentName.String
		}
		out = append(out, m)
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": out, "total": total, "page": page, "size": size,
		"pages": int(math.Max(1, math.Ceil(float64(total)/float64(size))))})
}
