# Review Findings

Build status: Go `go build ./...` PASS | Go `go test ./...` no test files | Frontend `expo export --platform web` PASS

---

## FINDING-001 [CRITICAL]: Compiled binary committed to git

**File:** `backend/backend` (8.1MB ELF binary)

A compiled Go binary is tracked in git. This bloats the repository and should never be committed.

**Fix:** `git rm --cached backend/backend` and add `backend/backend` to `.gitignore`.

---

## FINDING-002 [HIGH]: Server starts with nil DB — all requests will panic

**File:** `backend/main.go` (lines 21-32)

When `db.Connect()` fails, the server logs a warning but continues with `database = nil`. Every handler receives a nil `*sql.DB` and will panic on the first database operation.

**Fix:** Use `log.Fatalf` when the database is unavailable instead of continuing to serve.

---

## FINDING-003 [HIGH]: No authorization on children endpoints — any device can read/modify/delete another device's children

**File:** `backend/handlers/children.go`

The `{deviceId}` is taken from the URL path with no verification that the caller is actually that device. Any client can call `GET/PUT/DELETE /devices/VICTIM_UUID/children/...` to access another device's children including sensitive allergy/medical info. The events/groups handlers already use `X-Device-ID` header validation.

**Fix:** Require `X-Device-ID` header and verify it matches the `{deviceId}` URL parameter, consistent with how events handlers already work.

---

## FINDING-004 [MEDIUM]: Event Detail screen broken when navigating from notification (missing groupId)

**File:** `frontend/app/event/[eventId].tsx` (lines 53-61), `frontend/app/_layout.tsx` (line 35)

The notification handler navigates with `router.push('/event/${data.eventId}')` without `groupId`. The Event Detail screen requires `groupId` to fetch event data — without it, the screen renders with no event info.

**Fix:** Either include `groupId` in the notification payload, or add a backend endpoint to resolve `eventId` → `groupId`.

---

## FINDING-005 [MEDIUM]: Expo push tokens used instead of native FCM tokens

**File:** `frontend/lib/notifications.ts` (line 31)

Uses `Notifications.getExpoPushTokenAsync()` which returns Expo-format tokens (`ExponentPushToken[xxxx]`). The backend uses FCM directly and expects native FCM device tokens. This format mismatch means all push notifications will silently fail.

**Fix:** Use `Notifications.getDevicePushTokenAsync()` to get native FCM/APNs tokens, or switch the backend to use the Expo Push Service.

---

## FINDING-006 [MEDIUM]: Leave group only removes locally, reappears on refresh

**File:** `frontend/app/(tabs)/index.tsx` (lines 78-90)

Long-pressing a group to "leave" removes it from local storage only. No backend API call is made to remove the membership, so the group reappears on the next backend refresh.

**Fix:** Either add a `DELETE /groups/{groupId}/members/{deviceId}` backend endpoint and call it, or remove the leave feature until the backend supports it.

---

## FINDING-007 [MEDIUM]: Registration upsert allows cross-device child registration spoofing

**File:** `backend/models/registration.go` (lines 25-38)

The `ON CONFLICT (event_id, child_id) DO UPDATE SET device_id = EXCLUDED.device_id` allows any device to overwrite another device's registration by sending a known `child_id`. No check verifies the child belongs to the calling device.

**Fix:** Verify `child_id` belongs to the calling `device_id` (check `children.device_id`) before inserting.

---

## FINDING-008 [MEDIUM]: ChildForm shows stale data when editing different children

**File:** `frontend/components/ChildForm.tsx` (lines 24-28)

`useState` initializers only run on first mount. When the modal opens for editing a different child, form fields show the previous child's data.

**Fix:** Add `useEffect(() => { if (visible) resetToInitial(); }, [visible, initial]);`

---

## FINDING-009 [MEDIUM]: Notification toggle not persisted — resets to "off" on navigation

**File:** `frontend/app/(tabs)/settings.tsx` (line 20)

`notificationsEnabled` starts as `false` and is never loaded from storage or actual permission status. The toggle always shows "off" when returning to Settings.

**Fix:** Check `Notifications.getPermissionsAsync()` and stored push token on mount to initialize the toggle state.

---

## FINDING-010 [MEDIUM]: No membership check on registration and event GET endpoints

**File:** `backend/handlers/registrations.go`, `backend/handlers/events.go`

`POST /events/{eventId}/register`, `GET /events/{eventId}/registrations`, `DELETE /events/{eventId}/register/{childId}`, and `GET /groups/{groupId}/events/{eventId}` do not verify group membership. Anyone who knows an event UUID can view registrations (including children's allergy/medical info) and register/unregister children.

**Fix:** Look up the event's `group_id` and verify the caller (via `X-Device-ID`) is a member.

---

## FINDING-011 [LOW]: `go.mod` dependencies incorrectly marked `// indirect`

**File:** `backend/go.mod`

All four dependencies (chi, uuid, pq, bcrypt) are marked `// indirect` but are directly imported.

**Fix:** Run `go mod tidy`.

---

## FINDING-012 [LOW]: No `.gitignore` in backend directory

**File:** `backend/` (missing `.gitignore`)

No `.gitignore` exists to prevent compiled binaries from being committed again.

**Fix:** Add `backend/.gitignore` with entries for `backend`, `server`, `*.exe`.

---

## FINDING-013 [LOW]: Duplicated `formatDate` helper

**Files:** `frontend/app/group/[groupId].tsx` (lines 15-27), `frontend/app/event/[eventId].tsx` (lines 15-27)

Identical function in two files.

**Fix:** Extract to a shared utility in `frontend/lib/`.

---

## FINDING-014 [LOW]: No error banner on Children screen when backend fetch fails

**File:** `frontend/app/(tabs)/children.tsx` (lines 46-47)

Home and Group Detail screens show error banners on API failure, but Children silently falls back to cached data with no indication.

---

## FINDING-015 [LOW]: Event GET ignores groupId URL parameter

**File:** `backend/handlers/events.go` (lines 112-124)

`GET /groups/{groupId}/events/{eventId}` queries only by `eventId`, ignoring the `groupId` in the URL. Requesting `/groups/WRONG_ID/events/REAL_ID` returns the event.

**Fix:** Include `group_id` in the WHERE clause.
