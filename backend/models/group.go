package models

import (
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidPassword = errors.New("invalid password")
var ErrDeviceNotFound = errors.New("device not found")

type Group struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	JoinCode        string    `json:"join_code"`
	CreatedByDevice *string   `json:"created_by_device_id,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

const joinCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func generateJoinCode() (string, error) {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	code := make([]byte, 8)
	for i := range code {
		code[i] = joinCodeChars[int(b[i])%len(joinCodeChars)]
	}
	return string(code), nil
}

func CreateGroup(database *sql.DB, name, password, deviceID string) (*Group, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	var code string
	for i := 0; i < 10; i++ {
		code, err = generateJoinCode()
		if err != nil {
			return nil, fmt.Errorf("generate join code: %w", err)
		}
		var exists bool
		if err2 := database.QueryRow(`SELECT EXISTS(SELECT 1 FROM groups WHERE join_code = $1)`, code).Scan(&exists); err2 != nil {
			return nil, err2
		}
		if !exists {
			break
		}
	}

	groupID := uuid.New().String()
	tx, err := database.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	g := &Group{}
	var createdBy sql.NullString
	err = tx.QueryRow(`
		INSERT INTO groups (id, name, join_code, password_hash, created_by_device_id, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, name, join_code, created_by_device_id, created_at`,
		groupID, name, code, string(hash), deviceID,
	).Scan(&g.ID, &g.Name, &g.JoinCode, &createdBy, &g.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create group: %w", err)
	}

	_, err = tx.Exec(`
		INSERT INTO group_memberships (device_id, group_id, joined_at)
		VALUES ($1, $2, NOW())`,
		deviceID, groupID,
	)
	if err != nil {
		return nil, fmt.Errorf("add creator membership: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	if createdBy.Valid {
		g.CreatedByDevice = &createdBy.String
	}
	return g, nil
}

func JoinGroup(database *sql.DB, joinCode, password, deviceID string) (*Group, error) {
	g := &Group{}
	var passwordHash string
	var createdBy sql.NullString
	err := database.QueryRow(`
		SELECT id, name, join_code, password_hash, created_by_device_id, created_at
		FROM groups WHERE join_code = $1`,
		joinCode,
	).Scan(&g.ID, &g.Name, &g.JoinCode, &passwordHash, &createdBy, &g.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("find group: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return nil, ErrInvalidPassword
	}

	var deviceExists bool
	if err := database.QueryRow(`SELECT EXISTS(SELECT 1 FROM devices WHERE id = $1)`, deviceID).Scan(&deviceExists); err != nil {
		return nil, fmt.Errorf("check device: %w", err)
	}
	if !deviceExists {
		return nil, ErrDeviceNotFound
	}

	_, err = database.Exec(`
		INSERT INTO group_memberships (device_id, group_id, joined_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT DO NOTHING`,
		deviceID, g.ID,
	)
	if err != nil {
		return nil, fmt.Errorf("add membership: %w", err)
	}

	if createdBy.Valid {
		g.CreatedByDevice = &createdBy.String
	}
	return g, nil
}

func ListGroupsForDevice(database *sql.DB, deviceID string) ([]Group, error) {
	rows, err := database.Query(`
		SELECT g.id, g.name, g.join_code, g.created_by_device_id, g.created_at
		FROM groups g
		JOIN group_memberships m ON g.id = m.group_id
		WHERE m.device_id = $1
		ORDER BY g.created_at`,
		deviceID,
	)
	if err != nil {
		return nil, fmt.Errorf("list groups: %w", err)
	}
	defer rows.Close()

	var groups []Group
	for rows.Next() {
		g := Group{}
		var createdBy sql.NullString
		if err := rows.Scan(&g.ID, &g.Name, &g.JoinCode, &createdBy, &g.CreatedAt); err != nil {
			return nil, err
		}
		if createdBy.Valid {
			g.CreatedByDevice = &createdBy.String
		}
		groups = append(groups, g)
	}
	if groups == nil {
		groups = []Group{}
	}
	return groups, rows.Err()
}

func GetGroup(database *sql.DB, groupID string) (*Group, error) {
	g := &Group{}
	var createdBy sql.NullString
	err := database.QueryRow(`
		SELECT id, name, join_code, created_by_device_id, created_at
		FROM groups WHERE id = $1`,
		groupID,
	).Scan(&g.ID, &g.Name, &g.JoinCode, &createdBy, &g.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("get group: %w", err)
	}
	if createdBy.Valid {
		g.CreatedByDevice = &createdBy.String
	}
	return g, nil
}

func IsMember(database *sql.DB, deviceID, groupID string) (bool, error) {
	var exists bool
	err := database.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM group_memberships WHERE device_id = $1 AND group_id = $2)`,
		deviceID, groupID,
	).Scan(&exists)
	return exists, err
}

// LeaveGroup removes a device's membership from a group.
func LeaveGroup(database *sql.DB, deviceID, groupID string) error {
	result, err := database.Exec(`
		DELETE FROM group_memberships WHERE device_id = $1 AND group_id = $2`,
		deviceID, groupID,
	)
	if err != nil {
		return fmt.Errorf("leave group: %w", err)
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

// GetGroupMemberTokens returns FCM push tokens for all group members except excludeDeviceID.
func GetGroupMemberTokens(database *sql.DB, groupID, excludeDeviceID string) ([]string, error) {
	rows, err := database.Query(`
		SELECT d.push_token
		FROM group_memberships gm
		JOIN devices d ON d.id = gm.device_id
		WHERE gm.group_id = $1
		  AND gm.device_id != $2
		  AND d.push_token IS NOT NULL
		  AND d.push_token != ''`,
		groupID, excludeDeviceID,
	)
	if err != nil {
		return nil, fmt.Errorf("get member tokens: %w", err)
	}
	defer rows.Close()

	var tokens []string
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		tokens = append(tokens, t)
	}
	return tokens, rows.Err()
}
