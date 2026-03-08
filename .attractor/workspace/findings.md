# Review Findings — Cycle 2

Build status: `go build ./...` passes, `npx expo export --platform web` passes.

## FINDING-001 [CRITICAL] — Registration API request body format mismatch

**Files:** `frontend/lib/api.ts:163`, `backend/handlers/registrations.go:16-19,57`

The frontend sends a batch-wrapped body:
```json
{"children": [{"child_id": "...", "info_updated": true}]}
```

But the backend `registerChildRequest` struct expects a flat single-child object:
```go
type registerChildRequest struct {
    ChildID     string `json:"child_id"`
    InfoUpdated bool   `json:"info_updated"`
}
```

Go's JSON decoder silently ignores the unknown `children` key, leaves `ChildID` empty, and the handler returns `"child_id is required"`. **This breaks the entire registration flow** — the app's core feature (one-tap permission slips) cannot work.

**Fix:** Either change the backend to accept `{children: [...]}` and loop, or change the frontend to send one `{child_id, info_updated}` per call (matching the backend's single-child design). The simpler fix is to update the frontend to call the endpoint once per child with the flat body format.

## FINDING-002 [HIGH] — Device update endpoint lacks ownership check

**File:** `backend/handlers/devices.go:30-49`

`PUT /devices/{deviceId}` does not verify `X-Device-ID == deviceId`. All children endpoints (`handlers/children.go`) correctly enforce this check, but the device update handler does not. Any caller knowing a device UUID can overwrite its `display_name` and `push_token`, enabling push notification hijacking.

**Fix:** Add `if r.Header.Get("X-Device-ID") != deviceID { writeError(w, http.StatusForbidden, "forbidden"); return }` at the top of the handler.

## FINDING-003 [HIGH] — Event List and Event Get endpoints lack group membership check

**File:** `backend/handlers/events.go:30-38` (List), `backend/handlers/events.go:112-129` (Get)

`Create`, `Update`, and `Delete` all verify `IsMember(deviceID, groupID)`, but `List` and `Get` do not require `X-Device-ID` or check membership. Any API caller can enumerate events for any group by guessing the group UUID.

**Fix:** Add `X-Device-ID` header requirement and `IsMember` check to both `List` and `Get`, matching the pattern used in `Create`/`Update`/`Delete`.

## FINDING-004 [MEDIUM] — Groups ListForDevice lacks ownership check

**File:** `backend/handlers/groups.go:85-93`

`GET /devices/{deviceId}/groups` does not verify `X-Device-ID == deviceId`. The children `List` handler at `handlers/children.go:17-20` correctly enforces this check, but the groups handler does not. Any caller knowing a device UUID can enumerate all groups that device belongs to.

**Fix:** Add `if r.Header.Get("X-Device-ID") != deviceID { writeError(w, http.StatusForbidden, "forbidden"); return }`.

## FINDING-005 [MEDIUM] — ListChildren duplicates scanChild logic

**File:** `backend/models/child.go:56-71`

The `scanChild` helper (lines 22-40) handles nullable field scanning, but `ListChildren` (lines 56-71) reimplements the exact same scan logic inline instead of calling `scanChild(rows)`. `CreateChild` and `UpdateChild` already use `scanChild`.

**Fix:** Replace the inline scan in `ListChildren` with `c, err := scanChild(rows)`.

## FINDING-006 [LOW] — No Go test coverage

No `*_test.go` files exist in the backend. While the app builds and the frontend exports cleanly, there is zero automated test coverage for backend handler logic, model functions, or authorization checks.

**Fix:** Add tests for at minimum the authorization checks (X-Device-ID enforcement) and registration flow.

## FINDING-007 [LOW] — Redundant variable assignment in main.go

**File:** `backend/main.go:29`

```go
database := conn
```

The variable `conn` is immediately aliased to `database` for no reason. Should be `database, err := db.Connect()` directly.

**Fix:** Rename `conn` to `database` in the `db.Connect()` call and remove the alias.
