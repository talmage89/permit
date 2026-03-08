package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"permit/backend/models"
)

type GroupHandler struct {
	DB *sql.DB
}

type createGroupRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

func (h *GroupHandler) Create(w http.ResponseWriter, r *http.Request) {
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		writeError(w, http.StatusBadRequest, "X-Device-ID header required")
		return
	}

	var req createGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if len(req.Name) > 255 {
		writeError(w, http.StatusBadRequest, "name must be 255 characters or fewer")
		return
	}
	if req.Password == "" {
		writeError(w, http.StatusBadRequest, "password is required")
		return
	}
	if len(req.Password) > 72 {
		writeError(w, http.StatusBadRequest, "password must be 72 characters or fewer")
		return
	}

	group, err := models.CreateGroup(h.DB, req.Name, req.Password, deviceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create group")
		return
	}
	writeJSON(w, http.StatusCreated, group)
}

type joinGroupRequest struct {
	JoinCode string `json:"join_code"`
	Password string `json:"password"`
}

func (h *GroupHandler) Join(w http.ResponseWriter, r *http.Request) {
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		writeError(w, http.StatusBadRequest, "X-Device-ID header required")
		return
	}

	var req joinGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	group, err := models.JoinGroup(h.DB, req.JoinCode, req.Password, deviceID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "group not found")
		return
	}
	if err == models.ErrInvalidPassword {
		writeError(w, http.StatusUnauthorized, "invalid join code or password")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to join group")
		return
	}
	writeJSON(w, http.StatusOK, group)
}

func (h *GroupHandler) ListForDevice(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "deviceId")
	if r.Header.Get("X-Device-ID") != deviceID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}
	groups, err := models.ListGroupsForDevice(h.DB, deviceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list groups")
		return
	}
	writeJSON(w, http.StatusOK, groups)
}

func (h *GroupHandler) Get(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupId")
	group, err := models.GetGroup(h.DB, groupID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "group not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get group")
		return
	}
	writeJSON(w, http.StatusOK, group)
}

func (h *GroupHandler) Leave(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "groupId")
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		writeError(w, http.StatusBadRequest, "X-Device-ID header required")
		return
	}

	if err := models.LeaveGroup(h.DB, deviceID, groupID); err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "membership not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to leave group")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
