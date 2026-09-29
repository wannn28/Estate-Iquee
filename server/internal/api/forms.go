package api

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"

	"github.com/iquee/estate/server/internal/auth"
)

var (
	emailRe  = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`)
	phoneRe  = regexp.MustCompile(`^[+()\-.\s\d]{7,20}$`)
	uuidRe   = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	tourTime = map[string]bool{"9:00 AM": true, "10:30 AM": true, "12:00 PM": true, "1:30 PM": true, "3:00 PM": true, "4:30 PM": true, "6:00 PM": true}
	topics   = map[string]bool{"buying": true, "selling": true, "renting": true, "other": true}
	officeTZ = func() *time.Location {
		l, err := time.LoadLocation("America/Chicago")
		if err != nil {
			return time.UTC
		}
		return l
	}()
)

func runeLen(s string) int { return utf8.RuneCountInString(s) }

func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// ---------- tour requests ----------

type tourInput struct {
	ListingID string `json:"listingId"`
	Date      string `json:"date"` // YYYY-MM-DD, office-local
	Time      string `json:"time"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Note      string `json:"note"`
	Consent   bool   `json:"consent"`
	ClientID  string `json:"clientId"`
	Website   string `json:"website"` // honeypot: real visitors never fill this
}

func (s *Server) createTourRequest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var in tourInput
	if !decode(w, r, &in) {
		return
	}
	in.Name, in.Email, in.Phone, in.Note = strings.TrimSpace(in.Name), strings.TrimSpace(in.Email), strings.TrimSpace(in.Phone), strings.TrimSpace(in.Note)
	e := map[string]string{}
	var listingTitle string
	if err := s.db.QueryRowContext(ctx, `SELECT title FROM listings WHERE id = ?`, in.ListingID).Scan(&listingTitle); errors.Is(err, sql.ErrNoRows) {
		e["listingId"] = "Unknown listing."
	} else if err != nil {
		s.internal(w, r, err)
		return
	}
	d, err := time.ParseInLocation("2006-01-02", in.Date, officeTZ)
	now := time.Now().In(officeTZ)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, officeTZ)
	switch {
	case in.Date == "" || err != nil:
		e["date"] = "Choose a day for the tour."
	case d.Before(today) || d.After(today.AddDate(0, 0, 22)):
		e["date"] = "Pick a day within the next three weeks."
	case d.Weekday() == time.Sunday:
		e["date"] = "We don’t tour on Sundays."
	}
	if !tourTime[in.Time] {
		e["time"] = "Choose a time."
	}
	if in.Kind != "in-person" && in.Kind != "video" {
		e["kind"] = "Choose in-person or video."
	}
	if n := runeLen(in.Name); n < 2 || n > 100 {
		e["name"] = "Enter your full name."
	}
	if !emailRe.MatchString(in.Email) || len(in.Email) > 160 {
		e["email"] = "Enter a valid email, like name@example.com."
	}
	if in.Phone != "" && !phoneRe.MatchString(in.Phone) {
		e["phone"] = "Use digits, spaces, + ( ) or -."
	}
	if runeLen(in.Note) > 1000 {
		e["note"] = "Keep the note under 1,000 characters."
	}
	if !in.Consent {
		e["consent"] = "Please confirm you understand this is a demo."
	}
	if in.ClientID != "" && !uuidRe.MatchString(in.ClientID) {
		in.ClientID = ""
	}
	if len(e) > 0 {
		writeErr(w, http.StatusUnprocessableEntity, "validation", "Please fix the highlighted fields.", e)
		return
	}
	created := time.Now().UTC()
	if in.Website != "" { // bot: pretend success, store nothing
		s.log.Warn("honeypot tripped", "form", "tour")
		writeJSON(w, http.StatusCreated, map[string]any{"id": 0, "listingId": in.ListingID, "date": in.Date, "time": in.Time, "kind": in.Kind, "createdAt": created})
		return
	}
	res, err := s.db.ExecContext(ctx, `INSERT INTO tour_requests (listing_id, tour_date, tour_time, kind, name, email, phone, note, client_id, ip_hash)
		VALUES (?,?,?,?,?,?,?,?,?,?)`, in.ListingID, in.Date, in.Time, in.Kind, in.Name, in.Email, nullIfEmpty(in.Phone), nullIfEmpty(in.Note),
		nullIfEmpty(in.ClientID), s.ipHash(r))
	if err != nil {
		s.internal(w, r, err)
		return
	}
	id, _ := res.LastInsertId()
	s.log.Info("tour request stored", "id", id, "listing", in.ListingID)
	writeJSON(w, http.StatusCreated, map[string]any{"id": id, "listingId": in.ListingID, "listingTitle": listingTitle, "date": in.Date,
		"time": in.Time, "kind": in.Kind, "createdAt": created})
}

// ---------- contact messages ----------

type contactInput struct {
	Topic    string `json:"topic"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	AgentID  string `json:"agentId"`
	Message  string `json:"message"`
	ClientID string `json:"clientId"`
	Website  string `json:"website"`
}

func (s *Server) createContactMessage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var in contactInput
	if !decode(w, r, &in) {
		return
	}
	in.Name, in.Email, in.Phone, in.Message = strings.TrimSpace(in.Name), strings.TrimSpace(in.Email), strings.TrimSpace(in.Phone), strings.TrimSpace(in.Message)
	e := map[string]string{}
	if !topics[in.Topic] {
		e["topic"] = "Choose a topic."
	}
	if n := runeLen(in.Name); n < 2 || n > 100 {
		e["name"] = "Enter your name."
	}
	if !emailRe.MatchString(in.Email) || len(in.Email) > 160 {
		e["email"] = "Enter a valid email address."
	}
	if in.Phone != "" && !phoneRe.MatchString(in.Phone) {
		e["phone"] = "That doesn’t look like a phone number."
	}
	if n := runeLen(in.Message); n < 10 {
		e["message"] = "Tell us a little more (at least 10 characters)."
	} else if n > 4000 {
		e["message"] = "Please keep it under 4,000 characters."
	}
	if in.AgentID != "" {
		var ok bool
		if err := s.db.QueryRowContext(ctx, `SELECT EXISTS (SELECT 1 FROM agents WHERE id = ?)`, in.AgentID).Scan(&ok); err != nil {
			s.internal(w, r, err)
			return
		}
		if !ok {
			e["agentId"] = "Unknown agent."
		}
	}
	if in.ClientID != "" && !uuidRe.MatchString(in.ClientID) {
		in.ClientID = ""
	}
	if len(e) > 0 {
		writeErr(w, http.StatusUnprocessableEntity, "validation", "Please check the highlighted fields.", e)
		return
	}
	created := time.Now().UTC()
	if in.Website != "" {
		s.log.Warn("honeypot tripped", "form", "contact")
		writeJSON(w, http.StatusCreated, map[string]any{"id": 0, "createdAt": created})
		return
	}
	res, err := s.db.ExecContext(ctx, `INSERT INTO contact_messages (topic, name, email, phone, agent_id, message, client_id, ip_hash)
		VALUES (?,?,?,?,?,?,?,?)`, in.Topic, in.Name, in.Email, nullIfEmpty(in.Phone), nullIfEmpty(in.AgentID), in.Message,
		nullIfEmpty(in.ClientID), s.ipHash(r))
	if err != nil {
		s.internal(w, r, err)
		return
	}
	id, _ := res.LastInsertId()
	s.log.Info("contact message stored", "id", id, "topic", in.Topic)
	writeJSON(w, http.StatusCreated, map[string]any{"id": id, "createdAt": created})
}

// ---------- saved homes (anonymous client id) ----------

func (s *Server) clientID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id := strings.ToLower(chi.URLParam(r, "clientID"))
	if !uuidRe.MatchString(id) {
		writeErr(w, http.StatusBadRequest, "bad_request", "clientId must be a UUID v4.", nil)
		return "", false
	}
	return id, true
}

func (s *Server) savedPayload(ctx context.Context, cid string) (map[string]any, error) {
	items, err := s.queryListings(ctx, `SELECT `+listingCols+` FROM saved_homes sh JOIN listings l ON l.id = sh.listing_id
		WHERE sh.client_id = ? ORDER BY sh.created_at DESC, l.sort_order`, cid)
	if err != nil {
		return nil, err
	}
	ids := make([]string, len(items))
	for i, l := range items {
		ids[i] = l.ID
	}
	return map[string]any{"ids": ids, "items": items}, nil
}

func (s *Server) getSaved(w http.ResponseWriter, r *http.Request) {
	cid, ok := s.clientID(w, r)
	if !ok {
		return
	}
	p, err := s.savedPayload(r.Context(), cid)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, p)
}

const maxSaved = 100

func (s *Server) insertSaved(ctx context.Context, cid string, ids []string) error {
	for _, id := range ids {
		_, err := s.db.ExecContext(ctx, `INSERT IGNORE INTO saved_homes (client_id, listing_id)
			SELECT ?, id FROM listings WHERE id = ? AND (SELECT COUNT(*) FROM saved_homes WHERE client_id = ?) < ?`, cid, id, cid, maxSaved)
		if err != nil {
			var me *mysql.MySQLError
			if errors.As(err, &me) && me.Number == 1452 { // unknown listing
				continue
			}
			return err
		}
	}
	return nil
}

func (s *Server) addSaved(w http.ResponseWriter, r *http.Request) {
	cid, ok := s.clientID(w, r)
	if !ok {
		return
	}
	if err := s.insertSaved(r.Context(), cid, []string{chi.URLParam(r, "listingID")}); err != nil {
		s.internal(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) removeSaved(w http.ResponseWriter, r *http.Request) {
	cid, ok := s.clientID(w, r)
	if !ok {
		return
	}
	if _, err := s.db.ExecContext(r.Context(), `DELETE FROM saved_homes WHERE client_id = ? AND listing_id = ?`, cid, chi.URLParam(r, "listingID")); err != nil {
		s.internal(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) clearSaved(w http.ResponseWriter, r *http.Request) {
	cid, ok := s.clientID(w, r)
	if !ok {
		return
	}
	if _, err := s.db.ExecContext(r.Context(), `DELETE FROM saved_homes WHERE client_id = ?`, cid); err != nil {
		s.internal(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// mergeSaved uploads ids saved while offline / before the API existed and returns the union.
func (s *Server) mergeSaved(w http.ResponseWriter, r *http.Request) {
	cid, ok := s.clientID(w, r)
	if !ok {
		return
	}
	var in struct {
		IDs []string `json:"ids"`
	}
	if !decode(w, r, &in) {
		return
	}
	if len(in.IDs) > maxSaved {
		in.IDs = in.IDs[:maxSaved]
	}
	if err := s.insertSaved(r.Context(), cid, in.IDs); err != nil {
		s.internal(w, r, err)
		return
	}
	p, err := s.savedPayload(r.Context(), cid)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

// ---------- admin (demo login) ----------

func (s *Server) EnsureAdmin(ctx context.Context) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(s.cfg.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx, `INSERT INTO admin_users (email, name, password_hash) VALUES (?, 'Demo admin', ?)
		ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`, s.cfg.AdminEmail, string(hash))
	return err
}

func (s *Server) adminLogin(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &in) {
		return
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	var id int
	var name, hash string
	err := s.db.QueryRowContext(r.Context(), `SELECT id, name, password_hash FROM admin_users WHERE email = ?`, in.Email).Scan(&id, &name, &hash)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil) {
		writeErr(w, http.StatusUnauthorized, "invalid_credentials", "Email or password is incorrect.", nil)
		return
	}
	if err != nil {
		s.internal(w, r, err)
		return
	}
	tok, exp, err := s.jwt.Issue(id, in.Email, name)
	if err != nil {
		s.internal(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": tok, "expiresAt": exp.UTC(), "user": map[string]any{"id": id, "email": in.Email, "name": name}})
}

func (s *Server) adminMe(w http.ResponseWriter, r *http.Request) {
	uid, _ := auth.UserID(r.Context())
	var email, name string
	if err := s.db.QueryRowContext(r.Context(), `SELECT email, name FROM admin_users WHERE id = ?`, uid).Scan(&email, &name); err != nil {
		writeErr(w, http.StatusUnauthorized, "unauthorized", "Account no longer exists.", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"id": uid, "email": email, "name": name, "piiMasked": s.cfg.MaskPII})
}
