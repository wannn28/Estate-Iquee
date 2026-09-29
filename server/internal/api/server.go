// Package api implements the Hollis Row REST API (chi router, JSON over HTTP, MySQL).
package api

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"

	"github.com/iquee/estate/server/internal/auth"
	"github.com/iquee/estate/server/internal/config"
)

type Server struct {
	db      *sql.DB
	cfg     *config.Config
	jwt     *auth.Issuer
	log     *slog.Logger
	started time.Time
	version string
}

func New(db *sql.DB, cfg *config.Config, log *slog.Logger, version string) *Server {
	return &Server{db: db, cfg: cfg, jwt: auth.NewIssuer(cfg.JWTSecret, cfg.JWTTTL), log: log, started: time.Now(), version: version}
}

func (s *Server) DB() *sql.DB { return s.db }

// clientIP prefers Cloudflare's header, then nginx's X-Real-IP. The API is bound to 127.0.0.1
// behind nginx, so these headers are set by our own proxy chain.
func clientIP(r *http.Request) string {
	for _, h := range []string{"CF-Connecting-IP", "X-Real-IP"} {
		if v := strings.TrimSpace(r.Header.Get(h)); v != "" {
			return v
		}
	}
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// ipHash stores a salted, truncated hash instead of the visitor's IP address.
func (s *Server) ipHash(r *http.Request) string {
	sum := sha256.Sum256([]byte(s.cfg.JWTSecret + "|" + clientIP(r)))
	return hex.EncodeToString(sum[:8])
}

func rateLimit(n int, per time.Duration) func(http.Handler) http.Handler {
	return httprate.Limit(n, per,
		httprate.WithKeyFuncs(func(r *http.Request) (string, error) { return clientIP(r), nil }),
		httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
			writeErr(w, http.StatusTooManyRequests, "rate_limited", "Too many requests from your network. Please wait a minute and try again.", nil)
		}))
}

func (s *Server) requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		t0 := time.Now()
		next.ServeHTTP(ww, r)
		lvl := slog.LevelInfo
		if ww.Status() >= 500 {
			lvl = slog.LevelError
		}
		if r.URL.Path == "/api/health" && ww.Status() == 200 {
			lvl = slog.LevelDebug
		}
		s.log.Log(r.Context(), lvl, "http", "method", r.Method, "path", r.URL.Path, "status", ww.Status(),
			"bytes", ww.BytesWritten(), "dur_ms", time.Since(t0).Milliseconds(), "req_id", middleware.GetReqID(r.Context()))
	})
}

func (s *Server) Routes() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID, s.requestLogger, middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: s.cfg.CORSOrigins,
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Authorization", "Content-Type"},
		MaxAge:         600,
	}))
	r.Use(middleware.Timeout(15 * time.Second))
	r.Use(rateLimit(600, time.Minute))

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", s.health)

		r.Get("/home", s.home)
		r.Get("/listings", s.listListings)
		r.Get("/listings/{slug}", s.getListing)
		r.Get("/listings/{slug}/similar", s.similarListings)
		r.Get("/agents", s.listAgents)
		r.Get("/agents/{id}", s.getAgent)
		r.Get("/neighborhoods", s.listNeighborhoods)
		r.Get("/testimonials", s.listTestimonials)

		r.Group(func(r chi.Router) {
			r.Use(rateLimit(5, time.Minute), rateLimit(30, 24*time.Hour))
			r.Post("/tour-requests", s.createTourRequest)
			r.Post("/contact-messages", s.createContactMessage)
		})

		r.Route("/saved/{clientID}", func(r chi.Router) {
			r.Use(rateLimit(120, time.Minute))
			r.Get("/", s.getSaved)
			r.Post("/merge", s.mergeSaved)
			r.Delete("/", s.clearSaved)
			r.Put("/{listingID}", s.addSaved)
			r.Delete("/{listingID}", s.removeSaved)
		})

		r.With(rateLimit(10, time.Minute)).Post("/admin/login", s.adminLogin)
		r.Group(func(r chi.Router) {
			r.Use(s.jwt.Middleware(func(w http.ResponseWriter, r *http.Request) {
				writeErr(w, http.StatusUnauthorized, "unauthorized", "Sign in to the admin area.", nil)
			}))
			r.Get("/admin/me", s.adminMe)
			r.Get("/admin/stats", s.adminStats)
			r.Get("/admin/tour-requests", s.adminTours)
			r.Get("/admin/contact-messages", s.adminMessages)
		})

		r.NotFound(func(w http.ResponseWriter, r *http.Request) {
			writeErr(w, http.StatusNotFound, "not_found", "No such endpoint.", nil)
		})
	})
	return r
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	ok := s.db.PingContext(ctx) == nil
	code, status := http.StatusOK, "ok"
	if !ok {
		code, status = http.StatusServiceUnavailable, "degraded"
	}
	writeJSON(w, code, map[string]any{"status": status, "service": "estate-api", "version": s.version,
		"database": map[bool]string{true: "up", false: "down"}[ok], "uptime_s": int(time.Since(s.started).Seconds()), "time": time.Now().UTC()})
}

type apiError struct {
	Error   string            `json:"error"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, errCode, msg string, fields map[string]string) {
	writeJSON(w, code, apiError{Error: errCode, Message: msg, Fields: fields})
}

func (s *Server) internal(w http.ResponseWriter, r *http.Request, err error) {
	if errors.Is(err, context.Canceled) {
		return
	}
	s.log.Error("internal error", "err", err.Error(), "path", r.URL.Path, "req_id", middleware.GetReqID(r.Context()))
	writeErr(w, http.StatusInternalServerError, "internal", "Something went wrong on our side.", nil)
}

func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 32<<10)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil {
		writeErr(w, http.StatusBadRequest, "bad_request", "Malformed JSON body.", nil)
		return false
	}
	return true
}

// cacheable marks public catalogue responses as briefly cacheable by browsers.
func cacheable(w http.ResponseWriter) { w.Header().Set("Cache-Control", "public, max-age=60") }
