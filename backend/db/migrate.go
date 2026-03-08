package db

import (
	"database/sql"
	_ "embed"
	"fmt"
)

//go:embed migrations/001_initial_schema.sql
var initialSchema string

// Migrate runs database migrations idempotently.
func Migrate(database *sql.DB) error {
	if _, err := database.Exec(initialSchema); err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}
	return nil
}
