// Package config reads runtime configuration from environment variables.
package config

import (
	"fmt"
	"os"
	"strings"
	"time"
)

type Config struct {
	Port          string
	DSN           string
	JWTSecret     string
	JWTTTL        time.Duration
	CORSOrigins   []string
	AdminEmail    string
	AdminPassword string
	Retention     time.Duration // visitor submissions older than this are purged
	MaskPII       bool          // mask emails/phones in admin responses (the demo admin login is public)
	LogLevel      string
}

func env(k, def string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return def
}

func Load() (*Config, error) {
	c := &Config{
		Port:          env("PORT", "8080"),
		DSN:           env("DATABASE_DSN", ""),
		JWTSecret:     env("JWT_SECRET", ""),
		AdminEmail:    strings.ToLower(env("ADMIN_EMAIL", "admin@hollisrow.example")),
		AdminPassword: env("ADMIN_PASSWORD", "hollis-demo"),
		MaskPII:       env("ADMIN_MASK_PII", "true") != "false",
		LogLevel:      env("LOG_LEVEL", "info"),
	}
	for _, o := range strings.Split(env("CORS_ORIGINS", "http://localhost:5173"), ",") {
		if o = strings.TrimSpace(o); o != "" {
			c.CORSOrigins = append(c.CORSOrigins, o)
		}
	}
	var err error
	if c.JWTTTL, err = time.ParseDuration(env("JWT_TTL", "8h")); err != nil {
		return nil, fmt.Errorf("JWT_TTL: %w", err)
	}
	if c.Retention, err = time.ParseDuration(env("RETENTION", "336h")); err != nil {
		return nil, fmt.Errorf("RETENTION: %w", err)
	}
	if c.DSN == "" {
		return nil, fmt.Errorf("DATABASE_DSN is required")
	}
	if len(c.JWTSecret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 32 characters")
	}
	return c, nil
}
