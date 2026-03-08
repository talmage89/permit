# Review Cycle 4 Findings

Build: PASS (go build, go test, expo export all pass)

## FINDING-001 [LOW] — ListForDevice registrations endpoint skips group membership check

**File:** `backend/handlers/registrations.go:126-139`

The `GET /events/{eventId}/registrations/{deviceId}` endpoint only checks that `X-Device-ID == deviceId` but does not call `requireEventMember()` like the other registration endpoints (`Register`, `Unregister`, `ListAll`). This is an inconsistency in the auth pattern.

**Practical impact is negligible:** Since registration itself requires membership, a non-member device would always get an empty list. The only information leak is confirming whether an event UUID exists (empty list vs error), which is very low value.

**Fix:** Add `requireEventMember(w, eventID, r.Header.Get("X-Device-ID"))` check for consistency with other registration handlers.

## FINDING-002 [LOW] — Join code collision loop doesn't error on exhaustion

**File:** `backend/models/group.go:44-57`

If all 10 join code generation attempts collide with existing codes, the loop exits without an error and the last colliding code is used in the INSERT, causing a unique constraint violation that surfaces as a generic 500 error. Should return an explicit error after loop exhaustion.

**Practical impact is negligible:** The keyspace is 30^8 ≈ 656 billion, making 10 consecutive collisions astronomically unlikely.

## FINDING-003 [LOW] — Event Detail screen shows blank when navigated without groupId

**File:** `frontend/app/event/[eventId].tsx:38-48`

If `groupId` query param is missing, the event fetch is skipped (line 40: `if (groupId)`), leaving the screen with no event title, date, or location.

**Practical impact is negligible:** The only path that could trigger this is a push notification with missing groupId in its data payload. The backend FCM code always includes groupId (fcm.go data map), so this scenario cannot occur under normal operation.

## FINDING-004 [LOW] — Unused API client methods

**File:** `frontend/lib/api.ts:146-158`

`events.update()` and `events.delete()` are defined but never called from any screen. The spec defines these backend endpoints (which are implemented), but no UI screen provides event edit/delete controls.

**Impact:** Dead code. The spec's Screens section does not describe edit/delete UI, so this is not a missing feature — just unused API wrappers.
