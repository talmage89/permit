package models

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Device struct {
	ID          string    `json:"id"`
	DisplayName string    `json:"display_name"`
	PushToken   *string   `json:"push_token,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func CreateDevice(database *sql.DB) (*Device, error) {
	device := &Device{}
	var pushToken sql.NullString
	err := database.QueryRow(`
		INSERT INTO devices (id, display_name, created_at, updated_at)
		VALUES ($1, '', NOW(), NOW())
		RETURNING id, display_name, push_token, created_at, updated_at`,
		uuid.New().String(),
	).Scan(&device.ID, &device.DisplayName, &pushToken, &device.CreatedAt, &device.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create device: %w", err)
	}
	if pushToken.Valid {
		device.PushToken = &pushToken.String
	}
	return device, nil
}

func UpdateDevice(database *sql.DB, deviceID string, displayName *string, pushToken *string) (*Device, error) {
	device := &Device{}
	var pt sql.NullString

	// displayName: nil = keep existing, non-nil = set to provided value (including "")
	// pushToken: nil = keep existing, "" = clear (set NULL), non-empty = set to value
	var err error
	if pushToken != nil {
		var nullablePT *string
		if *pushToken != "" {
			nullablePT = pushToken
		}
		err = database.QueryRow(`
			UPDATE devices
			SET display_name = COALESCE($2, display_name), push_token = $3, updated_at = NOW()
			WHERE id = $1
			RETURNING id, display_name, push_token, created_at, updated_at`,
			deviceID, displayName, nullablePT,
		).Scan(&device.ID, &device.DisplayName, &pt, &device.CreatedAt, &device.UpdatedAt)
	} else {
		err = database.QueryRow(`
			UPDATE devices
			SET display_name = COALESCE($2, display_name), updated_at = NOW()
			WHERE id = $1
			RETURNING id, display_name, push_token, created_at, updated_at`,
			deviceID, displayName,
		).Scan(&device.ID, &device.DisplayName, &pt, &device.CreatedAt, &device.UpdatedAt)
	}

	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("update device: %w", err)
	}
	if pt.Valid {
		device.PushToken = &pt.String
	}
	return device, nil
}
