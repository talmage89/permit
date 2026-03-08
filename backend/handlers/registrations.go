package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"permit/backend/models"
)

type RegistrationHandler struct {
	DB *sql.DB
}

type registerChildRequest struct {
	ChildID     string `json:"child_id"`
	InfoUpdated bool   `json:"info_updated"`
}

// requireEventMember looks up the event and verifies deviceID is a group member.
// Returns false and writes an error response if the check fails.
func (h *RegistrationHandler) requireEventMember(w http.ResponseWriter, eventID, deviceID string) bool {
	event, err := models.GetEvent(h.DB, eventID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "event not found")
		return false
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to look up event")
		return false
	}
	ok, err := models.IsMember(h.DB, deviceID, event.GroupID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check membership")
		return false
	}
	if !ok {
		writeError(w, http.StatusForbidden, "not a member of this group")
		return false
	}
	return true
}

func (h *RegistrationHandler) Register(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		writeError(w, http.StatusBadRequest, "X-Device-ID header required")
		return
	}

	if !h.requireEventMember(w, eventID, deviceID) {
		return
	}

	var req registerChildRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.ChildID == "" {
		writeError(w, http.StatusBadRequest, "child_id is required")
		return
	}

	reg, err := models.RegisterChild(h.DB, eventID, req.ChildID, deviceID, req.InfoUpdated)
	if err == models.ErrChildNotOwned {
		writeError(w, http.StatusForbidden, "child does not belong to this device")
		return
	}
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "child not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to register child")
		return
	}
	writeJSON(w, http.StatusCreated, reg)
}

func (h *RegistrationHandler) Unregister(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	childID := chi.URLParam(r, "childId")
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		writeError(w, http.StatusBadRequest, "X-Device-ID header required")
		return
	}

	if !h.requireEventMember(w, eventID, deviceID) {
		return
	}

	if err := models.UnregisterChild(h.DB, eventID, childID, deviceID); err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "registration not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to unregister child")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *RegistrationHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		writeError(w, http.StatusBadRequest, "X-Device-ID header required")
		return
	}

	if !h.requireEventMember(w, eventID, deviceID) {
		return
	}

	regs, err := models.ListRegistrations(h.DB, eventID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list registrations")
		return
	}
	writeJSON(w, http.StatusOK, regs)
}

func (h *RegistrationHandler) ListForDevice(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	deviceID := chi.URLParam(r, "deviceId")
	if r.Header.Get("X-Device-ID") != deviceID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}
	regs, err := models.ListRegistrationsForDevice(h.DB, eventID, deviceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list registrations")
		return
	}
	writeJSON(w, http.StatusOK, regs)
}
