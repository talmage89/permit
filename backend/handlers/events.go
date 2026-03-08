package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"permit/backend/models"
)

type EventHandler struct {
	DB *sql.DB
}

type eventRequest struct {
	Title        string  `json:"title"`
	Description  *string `json:"description"`
	EventDate    string  `json:"event_date"`
	Location     *string `json:"location"`
	RSVPDeadline *string `json:"rsvp_deadline"`
}

func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupId")
	events, err := models.ListEvents(h.DB, groupID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list events")
		return
	}
	writeJSON(w, http.StatusOK, events)
}

func (h *EventHandler) Create(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupId")
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		writeError(w, http.StatusBadRequest, "X-Device-ID header required")
		return
	}

	ok, err := models.IsMember(h.DB, deviceID, groupID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check membership")
		return
	}
	if !ok {
		writeError(w, http.StatusForbidden, "not a member of this group")
		return
	}

	var req eventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}
	if req.EventDate == "" {
		writeError(w, http.StatusBadRequest, "event_date is required")
		return
	}

	eventDate, err := time.Parse(time.RFC3339, req.EventDate)
	if err != nil {
		writeError(w, http.StatusBadRequest, "event_date must be RFC3339 format")
		return
	}

	var rsvpDeadline *time.Time
	if req.RSVPDeadline != nil {
		t, err := time.Parse(time.RFC3339, *req.RSVPDeadline)
		if err != nil {
			writeError(w, http.StatusBadRequest, "rsvp_deadline must be RFC3339 format")
			return
		}
		rsvpDeadline = &t
	}

	event, err := models.CreateEvent(h.DB, groupID, req.Title, req.Description, eventDate, req.Location, rsvpDeadline, deviceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create event")
		return
	}
	writeJSON(w, http.StatusCreated, event)
}

func (h *EventHandler) Get(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	event, err := models.GetEvent(h.DB, eventID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get event")
		return
	}
	writeJSON(w, http.StatusOK, event)
}

func (h *EventHandler) Update(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupId")
	eventID := chi.URLParam(r, "eventId")
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		writeError(w, http.StatusBadRequest, "X-Device-ID header required")
		return
	}

	ok, err := models.IsMember(h.DB, deviceID, groupID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check membership")
		return
	}
	if !ok {
		writeError(w, http.StatusForbidden, "not a member of this group")
		return
	}

	var req eventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}
	if req.EventDate == "" {
		writeError(w, http.StatusBadRequest, "event_date is required")
		return
	}

	eventDate, err := time.Parse(time.RFC3339, req.EventDate)
	if err != nil {
		writeError(w, http.StatusBadRequest, "event_date must be RFC3339 format")
		return
	}

	var rsvpDeadline *time.Time
	if req.RSVPDeadline != nil {
		t, err := time.Parse(time.RFC3339, *req.RSVPDeadline)
		if err != nil {
			writeError(w, http.StatusBadRequest, "rsvp_deadline must be RFC3339 format")
			return
		}
		rsvpDeadline = &t
	}

	event, err := models.UpdateEvent(h.DB, eventID, groupID, req.Title, req.Description, eventDate, req.Location, rsvpDeadline)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update event")
		return
	}
	writeJSON(w, http.StatusOK, event)
}

func (h *EventHandler) Delete(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupId")
	eventID := chi.URLParam(r, "eventId")
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		writeError(w, http.StatusBadRequest, "X-Device-ID header required")
		return
	}

	ok, err := models.IsMember(h.DB, deviceID, groupID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check membership")
		return
	}
	if !ok {
		writeError(w, http.StatusForbidden, "not a member of this group")
		return
	}

	if err := models.DeleteEvent(h.DB, eventID, groupID); err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "event not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete event")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
