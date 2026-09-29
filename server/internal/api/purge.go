package api

import (
	"context"
	"time"
)

// Purge deletes visitor submissions older than the retention window (default 14 days) and
// shortlists untouched for 180 days, so the public demo never accumulates personal data.
func (s *Server) Purge(ctx context.Context) (int64, error) {
	var total int64
	secs := int64(s.cfg.Retention / time.Second)
	for _, q := range []struct {
		sql string
		arg int64
	}{
		{`DELETE FROM tour_requests WHERE created_at < NOW() - INTERVAL ? SECOND`, secs},
		{`DELETE FROM contact_messages WHERE created_at < NOW() - INTERVAL ? SECOND`, secs},
		{`DELETE FROM saved_homes WHERE created_at < NOW() - INTERVAL ? SECOND`, int64(180 * 24 * 3600)},
	} {
		res, err := s.db.ExecContext(ctx, q.sql, q.arg)
		if err != nil {
			return total, err
		}
		n, _ := res.RowsAffected()
		total += n
	}
	return total, nil
}
