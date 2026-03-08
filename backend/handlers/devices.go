package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"permit/backend/models"
)

type DeviceHandler struct {
	DB *sql.DB
}

func (h *DeviceHandler) Create(w http.ResponseWriter, r *http.Request) {
	device, err := models.CreateDevice(h.DB)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create device")
		return
	}
	writeJSON(w, http.StatusCreated, device)
}

type updateDeviceRequest struct {
	DisplayName string  `json:"display_name"`
	PushToken   *string `json:"push_token"`
}

func (h *DeviceHandler) Update(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "deviceId")
	if r.Header.Get("X-Device-ID") != deviceID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var req updateDeviceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(req.DisplayName) > 255 {
		writeError(w, http.StatusBadRequest, "display_name must be 255 characters or fewer")
		return
	}

	device, err := models.UpdateDevice(h.DB, deviceID, req.DisplayName, req.PushToken)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "device not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update device")
		return
	}
	writeJSON(w, http.StatusOK, device)
}
