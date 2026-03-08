package handlers_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"permit/backend/handlers"
)

// newChiCtx wires a chi URL param into the request context.
func newChiCtx(r *http.Request, key, val string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, val)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

// --- DeviceHandler ---

func TestDeviceUpdate_MissingHeader_Forbidden(t *testing.T) {
	h := &handlers.DeviceHandler{}
	req := httptest.NewRequest(http.MethodPut, "/api/v1/devices/device-abc", nil)
	req = newChiCtx(req, "deviceId", "device-abc")
	// No X-Device-ID header → forbidden
	w := httptest.NewRecorder()
	h.Update(w, req)
	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestDeviceUpdate_WrongHeader_Forbidden(t *testing.T) {
	h := &handlers.DeviceHandler{}
	req := httptest.NewRequest(http.MethodPut, "/api/v1/devices/device-abc", nil)
	req = newChiCtx(req, "deviceId", "device-abc")
	req.Header.Set("X-Device-ID", "device-xyz") // wrong device
	w := httptest.NewRecorder()
	h.Update(w, req)
	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

// --- GroupHandler ---

func TestGroupListForDevice_MissingHeader_Forbidden(t *testing.T) {
	h := &handlers.GroupHandler{}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/devices/device-abc/groups", nil)
	req = newChiCtx(req, "deviceId", "device-abc")
	// No X-Device-ID header
	w := httptest.NewRecorder()
	h.ListForDevice(w, req)
	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestGroupListForDevice_WrongHeader_Forbidden(t *testing.T) {
	h := &handlers.GroupHandler{}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/devices/device-abc/groups", nil)
	req = newChiCtx(req, "deviceId", "device-abc")
	req.Header.Set("X-Device-ID", "device-xyz")
	w := httptest.NewRecorder()
	h.ListForDevice(w, req)
	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

// --- EventHandler ---

func TestEventList_MissingHeader_BadRequest(t *testing.T) {
	h := &handlers.EventHandler{}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/groups/group-abc/events", nil)
	req = newChiCtx(req, "groupId", "group-abc")
	w := httptest.NewRecorder()
	h.List(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestEventGet_MissingHeader_BadRequest(t *testing.T) {
	h := &handlers.EventHandler{}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/groups/group-abc/events/event-abc", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("groupId", "group-abc")
	rctx.URLParams.Add("eventId", "event-abc")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	w := httptest.NewRecorder()
	h.Get(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- RegistrationHandler ---

func TestRegister_MissingDeviceHeader_BadRequest(t *testing.T) {
	h := &handlers.RegistrationHandler{}
	body := `{"child_id":"child-abc","info_updated":false}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events/event-abc/register", strings.NewReader(body))
	req = newChiCtx(req, "eventId", "event-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Register(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

