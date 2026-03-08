package models

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Event struct {
	ID              string     `json:"id"`
	GroupID         string     `json:"group_id"`
	Title           string     `json:"title"`
	Description     *string    `json:"description,omitempty"`
	EventDate       time.Time  `json:"event_date"`
	Location        *string    `json:"location,omitempty"`
	RSVPDeadline    *time.Time `json:"rsvp_deadline,omitempty"`
	CreatedByDevice *string    `json:"created_by_device_id,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func scanEvent(row interface{ Scan(...interface{}) error }) (*Event, error) {
	e := &Event{}
	var desc, loc sql.NullString
	var rsvp sql.NullTime
	var createdBy sql.NullString
	err := row.Scan(&e.ID, &e.GroupID, &e.Title, &desc, &e.EventDate, &loc, &rsvp, &createdBy, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		e.Description = &desc.String
	}
	if loc.Valid {
		e.Location = &loc.String
	}
	if rsvp.Valid {
		e.RSVPDeadline = &rsvp.Time
	}
	if createdBy.Valid {
		e.CreatedByDevice = &createdBy.String
	}
	return e, nil
}

func ListEvents(database *sql.DB, groupID string) ([]Event, error) {
	rows, err := database.Query(`
		SELECT id, group_id, title, description, event_date, location, rsvp_deadline, created_by_device_id, created_at, updated_at
		FROM events
		WHERE group_id = $1
		ORDER BY event_date`,
		groupID,
	)
	if err != nil {
		return nil, fmt.Errorf("list events: %w", err)
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		e, err := scanEvent(rows)
		if err != nil {
			return nil, err
		}
		events = append(events, *e)
	}
	if events == nil {
		events = []Event{}
	}
	return events, rows.Err()
}

func CreateEvent(database *sql.DB, groupID, title string, description *string, eventDate time.Time, location *string, rsvpDeadline *time.Time, deviceID string) (*Event, error) {
	row := database.QueryRow(`
		INSERT INTO events (id, group_id, title, description, event_date, location, rsvp_deadline, created_by_device_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id, group_id, title, description, event_date, location, rsvp_deadline, created_by_device_id, created_at, updated_at`,
		uuid.New().String(), groupID, title, description, eventDate, location, rsvpDeadline, deviceID,
	)
	e, err := scanEvent(row)
	if err != nil {
		return nil, fmt.Errorf("create event: %w", err)
	}
	return e, nil
}

func GetEvent(database *sql.DB, eventID string) (*Event, error) {
	row := database.QueryRow(`
		SELECT id, group_id, title, description, event_date, location, rsvp_deadline, created_by_device_id, created_at, updated_at
		FROM events WHERE id = $1`,
		eventID,
	)
	e, err := scanEvent(row)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("get event: %w", err)
	}
	return e, nil
}

func UpdateEvent(database *sql.DB, eventID, groupID, title string, description *string, eventDate time.Time, location *string, rsvpDeadline *time.Time) (*Event, error) {
	row := database.QueryRow(`
		UPDATE events
		SET title = $3, description = COALESCE($4, description), event_date = $5, location = COALESCE($6, location), rsvp_deadline = COALESCE($7, rsvp_deadline), updated_at = NOW()
		WHERE id = $1 AND group_id = $2
		RETURNING id, group_id, title, description, event_date, location, rsvp_deadline, created_by_device_id, created_at, updated_at`,
		eventID, groupID, title, description, eventDate, location, rsvpDeadline,
	)
	e, err := scanEvent(row)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("update event: %w", err)
	}
	return e, nil
}

func DeleteEvent(database *sql.DB, eventID, groupID string) error {
	result, err := database.Exec(`DELETE FROM events WHERE id = $1 AND group_id = $2`, eventID, groupID)
	if err != nil {
		return fmt.Errorf("delete event: %w", err)
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
