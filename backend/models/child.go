package models

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Child struct {
	ID        string    `json:"id"`
	DeviceID  string    `json:"device_id"`
	Name      string    `json:"name"`
	Birthdate *string   `json:"birthdate,omitempty"`
	Allergies *string   `json:"allergies,omitempty"`
	Notes     *string   `json:"notes,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func scanChild(row interface {
	Scan(...interface{}) error
}) (*Child, error) {
	c := &Child{}
	var bd, al, no sql.NullString
	if err := row.Scan(&c.ID, &c.DeviceID, &c.Name, &bd, &al, &no, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	if bd.Valid {
		c.Birthdate = &bd.String
	}
	if al.Valid {
		c.Allergies = &al.String
	}
	if no.Valid {
		c.Notes = &no.String
	}
	return c, nil
}

func ListChildren(database *sql.DB, deviceID string) ([]Child, error) {
	rows, err := database.Query(`
		SELECT id, device_id, name, birthdate, allergies, notes, created_at, updated_at
		FROM children
		WHERE device_id = $1
		ORDER BY created_at`,
		deviceID,
	)
	if err != nil {
		return nil, fmt.Errorf("list children: %w", err)
	}
	defer rows.Close()

	var children []Child
	for rows.Next() {
		c, err := scanChild(rows)
		if err != nil {
			return nil, err
		}
		children = append(children, *c)
	}
	if children == nil {
		children = []Child{}
	}
	return children, rows.Err()
}

func CreateChild(database *sql.DB, deviceID, name string, birthdate, allergies, notes *string) (*Child, error) {
	row := database.QueryRow(`
		INSERT INTO children (id, device_id, name, birthdate, allergies, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, device_id, name, birthdate, allergies, notes, created_at, updated_at`,
		uuid.New().String(), deviceID, name, birthdate, allergies, notes,
	)
	c, err := scanChild(row)
	if err != nil {
		return nil, fmt.Errorf("create child: %w", err)
	}
	return c, nil
}

func UpdateChild(database *sql.DB, childID, deviceID, name string, birthdate, allergies, notes *string) (*Child, error) {
	row := database.QueryRow(`
		UPDATE children
		SET name = $3, birthdate = COALESCE($4, birthdate), allergies = COALESCE($5, allergies), notes = COALESCE($6, notes), updated_at = NOW()
		WHERE id = $1 AND device_id = $2
		RETURNING id, device_id, name, birthdate, allergies, notes, created_at, updated_at`,
		childID, deviceID, name, birthdate, allergies, notes,
	)
	c, err := scanChild(row)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("update child: %w", err)
	}
	return c, nil
}

func DeleteChild(database *sql.DB, childID, deviceID string) error {
	result, err := database.Exec(`
		DELETE FROM children WHERE id = $1 AND device_id = $2`,
		childID, deviceID,
	)
	if err != nil {
		return fmt.Errorf("delete child: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}
