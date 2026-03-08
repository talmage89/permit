package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"permit/backend/models"
)

type ChildHandler struct {
	DB *sql.DB
}

func (h *ChildHandler) List(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "deviceId")
	if r.Header.Get("X-Device-ID") != deviceID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}
	children, err := models.ListChildren(h.DB, deviceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list children")
		return
	}
	writeJSON(w, http.StatusOK, children)
}

type childRequest struct {
	Name      string  `json:"name"`
	Birthdate *string `json:"birthdate"`
	Allergies *string `json:"allergies"`
	Notes     *string `json:"notes"`
}

func (h *ChildHandler) Create(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "deviceId")
	if r.Header.Get("X-Device-ID") != deviceID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var req childRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	child, err := models.CreateChild(h.DB, deviceID, req.Name, req.Birthdate, req.Allergies, req.Notes)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create child")
		return
	}
	writeJSON(w, http.StatusCreated, child)
}

func (h *ChildHandler) Update(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "deviceId")
	childID := chi.URLParam(r, "childId")
	if r.Header.Get("X-Device-ID") != deviceID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var req childRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	child, err := models.UpdateChild(h.DB, childID, deviceID, req.Name, req.Birthdate, req.Allergies, req.Notes)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "child not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update child")
		return
	}
	writeJSON(w, http.StatusOK, child)
}

func (h *ChildHandler) Delete(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "deviceId")
	childID := chi.URLParam(r, "childId")
	if r.Header.Get("X-Device-ID") != deviceID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if err := models.DeleteChild(h.DB, childID, deviceID); err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "child not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete child")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
