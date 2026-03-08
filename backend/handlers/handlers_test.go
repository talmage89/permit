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

func TestListForDevice_WrongDeviceHeader_Forbidden(t *testing.T) {
	h := &handlers.RegistrationHandler{}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/events/event-abc/registrations/device-abc", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("eventId", "event-abc")
	rctx.URLParams.Add("deviceId", "device-abc")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req.Header.Set("X-Device-ID", "device-xyz") // wrong device → 403 before membership check
	w := httptest.NewRecorder()
	h.ListForDevice(w, req)
	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

// --- Input validation tests ---

func TestCreateChild_NameTooLong_BadRequest(t *testing.T) {
	h := &handlers.ChildHandler{}
	longName := strings.Repeat("A", 256)
	body := `{"name":"` + longName + `"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/devices/device-abc/children", strings.NewReader(body))
	req = newChiCtx(req, "deviceId", "device-abc")
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCreateChild_InvalidBirthdate_BadRequest(t *testing.T) {
	h := &handlers.ChildHandler{}
	body := `{"name":"Kid","birthdate":"not-a-date"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/devices/device-abc/children", strings.NewReader(body))
	req = newChiCtx(req, "deviceId", "device-abc")
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCreateGroup_NameTooLong_BadRequest(t *testing.T) {
	h := &handlers.GroupHandler{}
	longName := strings.Repeat("X", 256)
	body := `{"name":"` + longName + `","password":"pass"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/groups", strings.NewReader(body))
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCreateGroup_PasswordTooLong_BadRequest(t *testing.T) {
	h := &handlers.GroupHandler{}
	longPass := strings.Repeat("X", 73)
	body := `{"name":"TestGroup","password":"` + longPass + `"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/groups", strings.NewReader(body))
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestRegister_InvalidEventID_BadRequest(t *testing.T) {
	h := &handlers.RegistrationHandler{}
	body := `{"child_id":"child-abc","info_updated":false}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events/not-a-uuid/register", strings.NewReader(body))
	req = newChiCtx(req, "eventId", "not-a-uuid")
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Register(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestRegister_InvalidChildID_BadRequest(t *testing.T) {
	h := &handlers.RegistrationHandler{}
	// child_id is validated before requireEventMember, so no DB needed
	body := `{"child_id":"not-a-uuid","info_updated":false}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/events/event-abc/register", strings.NewReader(body))
	req = newChiCtx(req, "eventId", "event-abc")
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Register(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUnregister_InvalidChildID_BadRequest(t *testing.T) {
	h := &handlers.RegistrationHandler{}
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/events/event-abc/register/not-a-uuid", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("eventId", "event-abc")
	rctx.URLParams.Add("childId", "not-a-uuid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req.Header.Set("X-Device-ID", "device-abc")
	w := httptest.NewRecorder()
	h.Unregister(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// BUG-B2: Non-UUID X-Device-ID on event endpoints should return 400, not 500.
func TestListAll_NonUUIDDeviceID_BadRequest(t *testing.T) {
	h := &handlers.RegistrationHandler{}
	// Valid UUID for eventId, non-UUID for X-Device-ID
	validEventID := "00000000-0000-0000-0000-000000000001"
	req := httptest.NewRequest(http.MethodGet, "/api/v1/events/"+validEventID+"/registrations", nil)
	req = newChiCtx(req, "eventId", validEventID)
	req.Header.Set("X-Device-ID", "not-a-uuid")
	w := httptest.NewRecorder()
	h.ListAll(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// BUG-TA2: Non-UUID deviceId URL param in ListForDevice should return 400, not 500.
func TestListForDevice_NonUUIDDeviceID_BadRequest(t *testing.T) {
	h := &handlers.RegistrationHandler{}
	validEventID := "00000000-0000-0000-0000-000000000001"
	req := httptest.NewRequest(http.MethodGet, "/api/v1/events/"+validEventID+"/registrations/not-a-uuid", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("eventId", validEventID)
	rctx.URLParams.Add("deviceId", "not-a-uuid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req.Header.Set("X-Device-ID", "not-a-uuid") // matches URL param → passes ownership check
	w := httptest.NewRecorder()
	h.ListForDevice(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestDeviceUpdate_DisplayNameTooLong_BadRequest(t *testing.T) {
	h := &handlers.DeviceHandler{}
	longName := strings.Repeat("D", 256)
	body := `{"display_name":"` + longName + `"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/devices/device-abc", strings.NewReader(body))
	req = newChiCtx(req, "deviceId", "device-abc")
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Update(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestDeviceUpdate_DisplayName255_Allowed(t *testing.T) {
	// Validation passes; handler proceeds to DB. With nil DB it will panic or error after validation.
	// We only test that the 400 path is NOT triggered for 255-char name.
	// Use a deferred recover to catch any nil-DB panic that follows.
	h := &handlers.DeviceHandler{}
	name255 := strings.Repeat("D", 255)
	body := `{"display_name":"` + name255 + `"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/devices/device-abc", strings.NewReader(body))
	req = newChiCtx(req, "deviceId", "device-abc")
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	func() {
		defer func() { recover() }() // absorb nil-DB panic
		h.Update(w, req)
	}()
	if w.Code == http.StatusBadRequest {
		t.Errorf("255-char display_name should not return 400")
	}
}

// BUG-TD-1: Whitespace-only child name must be rejected with 400.
func TestCreateChild_WhitespaceOnlyName_BadRequest(t *testing.T) {
	h := &handlers.ChildHandler{}
	body := `{"name":"   "}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/devices/device-abc/children", strings.NewReader(body))
	req = newChiCtx(req, "deviceId", "device-abc")
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for whitespace-only name, got %d", w.Code)
	}
}

func TestUpdateChild_WhitespaceOnlyName_BadRequest(t *testing.T) {
	h := &handlers.ChildHandler{}
	validChildID := "00000000-0000-0000-0000-000000000001"
	body := `{"name":"   "}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/devices/device-abc/children/"+validChildID, strings.NewReader(body))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("deviceId", "device-abc")
	rctx.URLParams.Add("childId", validChildID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Update(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for whitespace-only name on update, got %d", w.Code)
	}
}

// BUG-B-1: Non-UUID path params on group/child/event endpoints must return 400.
func TestGroupGet_NonUUIDGroupID_BadRequest(t *testing.T) {
	h := &handlers.GroupHandler{}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/groups/not-a-uuid", nil)
	req = newChiCtx(req, "groupId", "not-a-uuid")
	w := httptest.NewRecorder()
	h.Get(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID groupId in Get, got %d", w.Code)
	}
}

func TestGroupLeave_NonUUIDGroupID_BadRequest(t *testing.T) {
	h := &handlers.GroupHandler{}
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/groups/not-a-uuid/leave", nil)
	req = newChiCtx(req, "groupId", "not-a-uuid")
	req.Header.Set("X-Device-ID", "device-abc")
	w := httptest.NewRecorder()
	h.Leave(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID groupId in Leave, got %d", w.Code)
	}
}

func TestEventCreate_NonUUIDGroupID_BadRequest(t *testing.T) {
	h := &handlers.EventHandler{}
	body := `{"title":"T","event_date":"2026-01-01T00:00:00Z"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/groups/not-a-uuid/events", strings.NewReader(body))
	req = newChiCtx(req, "groupId", "not-a-uuid")
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID groupId in EventCreate, got %d", w.Code)
	}
}

func TestEventUpdate_NonUUIDEventID_BadRequest(t *testing.T) {
	h := &handlers.EventHandler{}
	validGroupID := "00000000-0000-0000-0000-000000000001"
	body := `{"title":"T","event_date":"2026-01-01T00:00:00Z"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/groups/"+validGroupID+"/events/not-a-uuid", strings.NewReader(body))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("groupId", validGroupID)
	rctx.URLParams.Add("eventId", "not-a-uuid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Update(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID eventId in EventUpdate, got %d", w.Code)
	}
}

func TestEventDelete_NonUUIDEventID_BadRequest(t *testing.T) {
	h := &handlers.EventHandler{}
	validGroupID := "00000000-0000-0000-0000-000000000001"
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/groups/"+validGroupID+"/events/not-a-uuid", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("groupId", validGroupID)
	rctx.URLParams.Add("eventId", "not-a-uuid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req.Header.Set("X-Device-ID", "device-abc")
	w := httptest.NewRecorder()
	h.Delete(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID eventId in EventDelete, got %d", w.Code)
	}
}

func TestChildUpdate_NonUUIDChildID_BadRequest(t *testing.T) {
	h := &handlers.ChildHandler{}
	body := `{"name":"Kid"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/devices/device-abc/children/not-a-uuid", strings.NewReader(body))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("deviceId", "device-abc")
	rctx.URLParams.Add("childId", "not-a-uuid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Update(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID childId in ChildUpdate, got %d", w.Code)
	}
}

func TestChildDelete_NonUUIDChildID_BadRequest(t *testing.T) {
	h := &handlers.ChildHandler{}
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/devices/device-abc/children/not-a-uuid", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("deviceId", "device-abc")
	rctx.URLParams.Add("childId", "not-a-uuid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req.Header.Set("X-Device-ID", "device-abc")
	w := httptest.NewRecorder()
	h.Delete(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID childId in ChildDelete, got %d", w.Code)
	}
}

// BUG-C-001: Non-UUID X-Device-ID on group/event/child endpoints must return 400, not 500.

func TestGroupCreate_NonUUIDDeviceID_BadRequest(t *testing.T) {
	h := &handlers.GroupHandler{}
	body := `{"name":"Test Group","password":"pass"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/groups", strings.NewReader(body))
	req.Header.Set("X-Device-ID", "notauuid")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID X-Device-ID in GroupCreate, got %d", w.Code)
	}
}

func TestGroupJoin_NonUUIDDeviceID_BadRequest(t *testing.T) {
	h := &handlers.GroupHandler{}
	body := `{"join_code":"ABCD1234","password":"pass"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/groups/join", strings.NewReader(body))
	req.Header.Set("X-Device-ID", "notauuid")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Join(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID X-Device-ID in GroupJoin, got %d", w.Code)
	}
}

func TestGroupLeave_NonUUIDDeviceID_BadRequest(t *testing.T) {
	h := &handlers.GroupHandler{}
	validGroupID := "00000000-0000-0000-0000-000000000001"
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/groups/"+validGroupID+"/leave", nil)
	req = newChiCtx(req, "groupId", validGroupID)
	req.Header.Set("X-Device-ID", "notauuid")
	w := httptest.NewRecorder()
	h.Leave(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID X-Device-ID in GroupLeave, got %d", w.Code)
	}
}

func TestEventCreate_NonUUIDDeviceID_BadRequest(t *testing.T) {
	h := &handlers.EventHandler{}
	validGroupID := "00000000-0000-0000-0000-000000000001"
	body := `{"title":"T","event_date":"2026-01-01T00:00:00Z"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/groups/"+validGroupID+"/events", strings.NewReader(body))
	req = newChiCtx(req, "groupId", validGroupID)
	req.Header.Set("X-Device-ID", "notauuid")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID X-Device-ID in EventCreate, got %d", w.Code)
	}
}

func TestChildCreate_NonUUIDDeviceID_BadRequest(t *testing.T) {
	h := &handlers.ChildHandler{}
	body := `{"name":"Kid"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/devices/notauuid/children", strings.NewReader(body))
	req = newChiCtx(req, "deviceId", "notauuid")
	req.Header.Set("X-Device-ID", "notauuid")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for non-UUID deviceId in ChildCreate, got %d", w.Code)
	}
}

// BUG-TA3: Partial PUT /devices with only push_token must not return 400 (display_name omitted → nil → COALESCE preserves it).
func TestDeviceUpdate_PushTokenOnly_PassesValidation(t *testing.T) {
	h := &handlers.DeviceHandler{}
	body := `{"push_token":"mytoken"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/devices/device-abc", strings.NewReader(body))
	req = newChiCtx(req, "deviceId", "device-abc")
	req.Header.Set("X-Device-ID", "device-abc")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	func() {
		defer func() { recover() }() // absorb nil-DB panic after validation
		h.Update(w, req)
	}()
	if w.Code == http.StatusBadRequest {
		t.Errorf("partial PUT with only push_token must not return 400")
	}
}

