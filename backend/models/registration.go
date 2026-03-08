package models

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var ErrChildNotOwned = errors.New("child does not belong to this device")
var ErrRegistrationForbidden = errors.New("registration belongs to another device")

type Registration struct {
	ID           string    `json:"id"`
	EventID      string    `json:"event_id"`
	ChildID      string    `json:"child_id"`
	DeviceID     string    `json:"device_id"`
	InfoUpdated  bool      `json:"info_updated"`
	RegisteredAt time.Time `json:"registered_at"`
}

type RegistrationWithChild struct {
	Registration
	Child *Child `json:"child,omitempty"`
}

func RegisterChild(database *sql.DB, eventID, childID, deviceID string, infoUpdated bool) (*Registration, error) {
	// Verify the child belongs to the calling device.
	var ownerDeviceID string
	err := database.QueryRow(`SELECT device_id FROM children WHERE id = $1`, childID).Scan(&ownerDeviceID)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("verify child owner: %w", err)
	}
	if ownerDeviceID != deviceID {
		return nil, ErrChildNotOwned
	}

	r := &Registration{}
	err = database.QueryRow(`
		INSERT INTO registrations (id, event_id, child_id, device_id, info_updated, registered_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (event_id, child_id) DO UPDATE
		SET info_updated = EXCLUDED.info_updated, device_id = EXCLUDED.device_id
		RETURNING id, event_id, child_id, device_id, info_updated, registered_at`,
		uuid.New().String(), eventID, childID, deviceID, infoUpdated,
	).Scan(&r.ID, &r.EventID, &r.ChildID, &r.DeviceID, &r.InfoUpdated, &r.RegisteredAt)
	if err != nil {
		return nil, fmt.Errorf("register child: %w", err)
	}
	return r, nil
}

func UnregisterChild(database *sql.DB, eventID, childID, deviceID string) error {
	// Check if the registration exists and who owns it.
	var ownerDeviceID string
	err := database.QueryRow(`SELECT device_id FROM registrations WHERE event_id = $1 AND child_id = $2`, eventID, childID).Scan(&ownerDeviceID)
	if err == sql.ErrNoRows {
		return sql.ErrNoRows
	}
	if err != nil {
		return fmt.Errorf("check registration owner: %w", err)
	}
	if ownerDeviceID != deviceID {
		return ErrRegistrationForbidden
	}
	_, err = database.Exec(`DELETE FROM registrations WHERE event_id = $1 AND child_id = $2`, eventID, childID)
	if err != nil {
		return fmt.Errorf("unregister child: %w", err)
	}
	return nil
}

func ListRegistrations(database *sql.DB, eventID string) ([]RegistrationWithChild, error) {
	rows, err := database.Query(`
		SELECT r.id, r.event_id, r.child_id, r.device_id, r.info_updated, r.registered_at,
		       c.id, c.device_id, c.name, TO_CHAR(c.birthdate, 'YYYY-MM-DD'), c.allergies, c.notes, c.created_at, c.updated_at
		FROM registrations r
		JOIN children c ON r.child_id = c.id
		WHERE r.event_id = $1
		ORDER BY r.registered_at`,
		eventID,
	)
	if err != nil {
		return nil, fmt.Errorf("list registrations: %w", err)
	}
	defer rows.Close()

	var results []RegistrationWithChild
	for rows.Next() {
		var rc RegistrationWithChild
		c := &Child{}
		var bd, al, no sql.NullString
		if err := rows.Scan(
			&rc.ID, &rc.EventID, &rc.ChildID, &rc.DeviceID, &rc.InfoUpdated, &rc.RegisteredAt,
			&c.ID, &c.DeviceID, &c.Name, &bd, &al, &no, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
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
		rc.Child = c
		results = append(results, rc)
	}
	if results == nil {
		results = []RegistrationWithChild{}
	}
	return results, rows.Err()
}

func ListRegistrationsForDevice(database *sql.DB, eventID, deviceID string) ([]Registration, error) {
	rows, err := database.Query(`
		SELECT id, event_id, child_id, device_id, info_updated, registered_at
		FROM registrations
		WHERE event_id = $1 AND device_id = $2
		ORDER BY registered_at`,
		eventID, deviceID,
	)
	if err != nil {
		return nil, fmt.Errorf("list registrations for device: %w", err)
	}
	defer rows.Close()

	var results []Registration
	for rows.Next() {
		var r Registration
		if err := rows.Scan(&r.ID, &r.EventID, &r.ChildID, &r.DeviceID, &r.InfoUpdated, &r.RegisteredAt); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	if results == nil {
		results = []Registration{}
	}
	return results, rows.Err()
}
