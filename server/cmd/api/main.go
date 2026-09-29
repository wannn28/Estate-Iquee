// Command api is the Hollis Row real-estate REST API.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
	_ "time/tzdata" // embedded zoneinfo: the final image is FROM scratch

	"github.com/iquee/estate/server/internal/api"
	"github.com/iquee/estate/server/internal/config"
	"github.com/iquee/estate/server/internal/db"
	"github.com/iquee/estate/server/internal/seed"
)

var version = "dev" // set with -ldflags "-X main.version=..."

func main() {
	// `api -healthcheck` is used by the Docker HEALTHCHECK (the scratch image has no curl/wget).
	if len(os.Args) > 1 && os.Args[1] == "-healthcheck" {
		os.Exit(healthcheck())
	}
	if err := run(); err != nil {
		slog.Error("fatal", "err", err.Error())
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	level := slog.LevelInfo
	if cfg != nil && strings.EqualFold(cfg.LogLevel, "debug") {
		level = slog.LevelDebug
	}
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})).With("service", "estate-api")
	slog.SetDefault(log)
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	conn, err := db.Open(ctx, cfg.DSN)
	if err != nil {
		return err
	}
	defer conn.Close()
	if err := db.Migrate(cfg.DSN); err != nil {
		return err
	}
	if empty, err := seed.IsEmpty(ctx, conn); err != nil {
		return err
	} else if empty {
		data, err := seed.Load()
		if err != nil {
			return err
		}
		if err := seed.Seed(ctx, conn, data); err != nil {
			return err
		}
		log.Info("catalogue seeded", "listings", len(data.Listings), "agents", len(data.Agents))
	}
	srv := api.New(conn, cfg, log, version)
	if err := srv.EnsureAdmin(ctx); err != nil {
		return err
	}

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		t := time.NewTicker(time.Hour)
		defer t.Stop()
		for {
			pctx, cancel := context.WithTimeout(ctx, 30*time.Second)
			if n, err := srv.Purge(pctx); err != nil && ctx.Err() == nil {
				log.Error("purge", "err", err.Error())
			} else if n > 0 {
				log.Info("purged old visitor data", "rows", n)
			}
			cancel()
			select {
			case <-ctx.Done():
				return
			case <-t.C:
			}
		}
	}()

	httpSrv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           srv.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       90 * time.Second,
	}
	errc := make(chan error, 1)
	go func() {
		log.Info("listening", "addr", httpSrv.Addr, "version", version)
		if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errc <- err
		}
		close(errc)
	}()
	select {
	case err := <-errc:
		return err
	case <-ctx.Done():
	}
	log.Info("shutting down")
	shCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := httpSrv.Shutdown(shCtx); err != nil {
		log.Error("http shutdown", "err", err.Error())
	}
	wg.Wait()
	log.Info("bye")
	return nil
}

func healthcheck() int {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	c := http.Client{Timeout: 3 * time.Second}
	res, err := c.Get("http://127.0.0.1:" + port + "/api/health")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		fmt.Fprintln(os.Stderr, "status", res.StatusCode)
		return 1
	}
	return 0
}
