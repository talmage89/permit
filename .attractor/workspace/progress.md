# Progress

## Fixes: test round 3
- Fixed BUG-TD-1 [LOW]: Added strings.TrimSpace to child name validation in Create+Update; whitespace-only names now return 400
- Fixed BUG-B-1 [LOW]: Added isValidUUID checks on groupId/eventId/childId path params in groups.go, events.go, children.go; non-UUID params now return 400 instead of 500
- Fixed BUG-TA3 [LOW]: Changed UpdateDevice displayName param to *string + COALESCE in both SQL paths; partial PUT with only push_token now preserves display_name
- Fixed BUG-C-001 [MEDIUM]: Added TO_CHAR(birthdate, 'YYYY-MM-DD') in all child SQL queries (CreateChild, UpdateChild, ListChildren); birthdate now returns YYYY-MM-DD format instead of full RFC3339 timestamp
- Added 9 new unit tests covering all 4 bugs; go build+test pass; expo export passes

## Fixes: test round 2
- Fixed BUG-TA1/BUG-D1 [LOW]: `PUT /devices/{id}` now validates display_name <= 255 chars, returns 400 (consistent with other Round 1 length fixes)
- Fixed BUG-B2/BUG-TA2 [LOW]: Added `isValidUUID(deviceID)` check in `requireEventMember` before calling `IsMember`; prevents 500 when X-Device-ID or deviceId URL param is not a valid UUID on any event/registration endpoint
- Fixed BUG-B1 [LOW]: `UnregisterChild` now checks registration ownership before deleting; returns `ErrRegistrationForbidden` when registration exists but belongs to another device; handler returns 403 instead of misleading 404
- Added 5 new unit tests covering all fixes; `go build ./... && go test ./...` passes; `expo export --platform web` passes

## Fixes: test round 1
- Fixed BUG-001/BUG-1 [MEDIUM]: Added `requireEventMember()` to `ListForDevice` handler — non-members now get 403 instead of 200
- Fixed BUG-A1 [MEDIUM]: `UpdateChild` SQL uses COALESCE so partial PUT preserves birthdate/allergies/notes
- Fixed BUG-A2 [MEDIUM]: `UpdateEvent` SQL uses COALESCE so partial PUT preserves description/location/rsvp_deadline
- Fixed BUG-3 [LOW]: Birthdate validated as YYYY-MM-DD or RFC3339 in Create/Update child — invalid formats return 400
- Fixed BUG-2 [LOW]: Child name > 255 chars returns 400 (length check before DB)
- Fixed BUG-6 [LOW]: Group name > 255 chars returns 400 (length check before DB)
- Fixed BUG-7 [LOW]: Event title > 255 chars returns 400 in Create and Update (length check before DB)
- Fixed BUG-5 [LOW]: Group password > 72 chars returns 400 (bcrypt limit enforced in handler)
- Fixed BUG-4/2d [LOW]: Non-UUID eventId/childId in registrations endpoints return 400 (UUID validation in requireEventMember, Register, Unregister)
- Added 8 new unit tests covering all input validation fixes (no DB required)
- `go build ./... && go test ./...` passes; `expo export --platform web` passes

## Review Cycle 3: All 4 Findings Resolved
- FINDING-001 [MEDIUM]: Inner catch in event/[eventId].tsx now calls setError() instead of silently ignoring
- FINDING-002 [LOW]: Removed unused `useEffect` import from children.tsx
- FINDING-003 [LOW]: Content-Type header only set when body is defined in api.ts request()
- FINDING-004 [LOW]: syncPushToken() only calls API update when token is non-null
- `go build ./... && go test ./...` passes; `npx expo export --platform web` passes

## Review Cycle 2: All 7 Findings Resolved
- FINDING-001 [CRITICAL]: Frontend registration now sends flat `{child_id, info_updated}` matching backend struct (fixes broken registration flow)
- FINDING-002 [HIGH]: Device update handler enforces `X-Device-ID == deviceId` ownership check
- FINDING-003 [HIGH]: Event List and Get handlers now require X-Device-ID and IsMember group membership check
- FINDING-004 [MEDIUM]: Groups ListForDevice enforces `X-Device-ID == deviceId` ownership check
- FINDING-005 [MEDIUM]: ListChildren refactored to use `scanChild()` helper, removing duplicated inline scan
- FINDING-006 [LOW]: Added `backend/handlers/handlers_test.go` with 7 auth check tests (no DB required)
- FINDING-007 [LOW]: Removed redundant `database := conn` alias in main.go
- `go build ./... && go test ./...` passes; `npx expo export --platform web` passes

## Review Cycle 1: All 15 Findings Resolved
- FINDING-001 [CRITICAL]: Removed compiled binary from git; added backend/.gitignore
- FINDING-002 [HIGH]: DB failure now calls log.Fatalf instead of continuing with nil DB
- FINDING-003 [HIGH]: X-Device-ID auth check added to all children endpoints (List/Create/Update/Delete)
- FINDING-004 [MEDIUM]: FCM notification data now includes eventId/groupId for deep-link navigation
- FINDING-005 [MEDIUM]: Switched to getDevicePushTokenAsync() for native FCM/APNs tokens
- FINDING-006 [MEDIUM]: Leave group calls DELETE /groups/{groupId}/leave on backend; added model+handler+route
- FINDING-007 [MEDIUM]: RegisterChild verifies child.device_id matches calling device before upsert
- FINDING-008 [MEDIUM]: ChildForm useEffect resets fields whenever visible/initial prop changes
- FINDING-009 [MEDIUM]: Settings screen loads notification permission status on mount
- FINDING-010 [MEDIUM]: All registration endpoints check group membership via event's group_id
- FINDING-011 [LOW]: go mod tidy removed // indirect markers from direct dependencies
- FINDING-012 [LOW]: backend/.gitignore added (covered with FINDING-001)
- FINDING-013 [LOW]: Extracted shared formatDate to frontend/lib/utils.ts; updated both screens
- FINDING-014 [LOW]: Added error banner + Retry to Children screen on backend fetch failure
- FINDING-015 [LOW]: Event GET handler validates groupId URL param matches event.GroupID
- go build ./... passes; npx expo export --platform web passes

## Phase 16: Polish & Error Handling
- `frontend/app/(tabs)/index.tsx`: Added `error` state + amber error banner with Retry button; catch block now falls back to local cache and shows the banner
- `frontend/app/group/[groupId].tsx`: Added `error` state + amber error banner with Retry button when group/event load fails
- `frontend/app/event/[eventId].tsx`: Added `error` state + inline amber error banner with Retry button when event detail load fails
- `frontend/components/CreateEventModal.tsx`: Added `isValidDate()` validation for `event_date` and `rsvp_deadline` before submission; alerts user with clear message on invalid dates
- `npx expo export --platform web` passes

## Phase 13: Group Detail & Event Creation
- `frontend/components/CreateEventModal.tsx`: slide-up modal for event title (required), description, date/time, location, RSVP deadline; calls POST /groups/{groupId}/events
- `frontend/app/group/[groupId].tsx`: fetches group name + event list on focus; pull-to-refresh; tapping event navigates to Event Detail with groupId query param; Create Event button opens modal
- `npx expo export --platform web` passes

## Phase 14: Event Detail & Registration
- `frontend/app/event/[eventId].tsx`: loads event details (groupId from query param), user's children (backend with local fallback), and user's registrations; "Yes" and "Info Updated" buttons register child; Remove unregisters; organizer view shows all registrations with child details (allergies, notes, info_updated badge)
- `npx expo export --platform web` passes

## Phase 15: Push Notifications (Frontend)
- `frontend/lib/notifications.ts`: configures Notifications handler; `registerForPushNotifications()` requests permission and returns Expo push token
- `frontend/lib/device.ts`: added `syncPushToken()` which calls `registerForPushNotifications()` and uploads token via PUT /devices/{deviceId}
- `frontend/app/_layout.tsx`: calls `syncPushToken()` non-blocking on init; adds `addNotificationResponseReceivedListener` to navigate to event on notification tap
- `frontend/app/(tabs)/settings.tsx`: added Push Notifications Switch toggle; enabling calls syncPushToken() and uploads token; disabling clears token on backend
- `npx expo export --platform web` passes

## Phase 10: Settings & Display Name Screen
- `frontend/app/_layout.tsx`: calls `initDevice()` on startup; shows `FirstLaunchModal` when no display name is set
- `frontend/components/FirstLaunchModal.tsx`: modal prompting user to enter display name on first launch; saves locally + syncs to backend
- `frontend/app/(tabs)/settings.tsx`: loads display name from AsyncStorage on mount; save button writes to storage and syncs to API
- `npx expo export --platform web` passes

## Phase 11: Children Manager Screen
- `frontend/components/ChildForm.tsx`: slide-up modal for add/edit with name (required), birthdate, allergies, notes
- `frontend/app/(tabs)/children.tsx`: fetches children from backend on focus (falls back to local); list with edit (tap row) + remove button; syncs all operations to backend
- `npx expo export --platform web` passes

## Phase 12: Home Screen & Group Management
- `frontend/components/CreateGroupModal.tsx`: group name + password form; calls POST /groups; saves to local storage
- `frontend/components/JoinGroupModal.tsx`: join code + password form; calls POST /groups/join; saves to local storage
- `frontend/app/(tabs)/index.tsx`: loads groups from backend on focus (local fallback); lists with join code; tap → Group Detail; long-press → leave; create/join buttons open modals
- `npx expo export --platform web` passes

## Phase 1: Project Scaffolding & Go Module Setup
- Initialized Go module `permit/backend` (Go 1.24)
- `backend/main.go`: HTTP server with `/health` endpoint returning `{"status":"ok"}`
- `backend/Dockerfile`: multi-stage Alpine build
- `backend/.env.example`: PORT, DATABASE_URL, FCM credentials
- `go build ./...` passes

## Phase 2: Database Schema & Migrations
- `backend/db/migrations/001_initial_schema.sql`: all 6 tables (devices, children, groups, group_memberships, events, registrations) with FK constraints, unique constraints (join_code), and indexes
- `backend/db/db.go`: PostgreSQL connection pool via DATABASE_URL env var (lib/pq)
- `backend/db/migrate.go`: embedded SQL migration runner, idempotent (IF NOT EXISTS)
- main.go updated to connect and run migrations on startup (warns and continues if DB unavailable)

## Phase 6: Registrations API
- `backend/models/registration.go`: Registration/RegistrationWithChild structs, RegisterChild (upsert), UnregisterChild, ListRegistrations (with child details), ListRegistrationsForDevice
- `backend/handlers/registrations.go`: POST /events/{eventId}/register (201), DELETE /events/{eventId}/register/{childId} (204/404), GET /events/{eventId}/registrations (organizer view), GET /events/{eventId}/registrations/{deviceId}
- router updated with /api/v1/events/{eventId}/register[/{childId}] and /registrations[/{deviceId}] routes
- `go build ./...` passes

## Phase 5: Events API
- `backend/models/event.go`: Event struct, ListEvents (ordered by event_date), CreateEvent, GetEvent, UpdateEvent, DeleteEvent
- `backend/handlers/events.go`: GET/POST /groups/{groupId}/events, GET/PUT/DELETE /groups/{groupId}/events/{eventId} with membership check via X-Device-ID header; event_date/rsvp_deadline as RFC3339
- router updated with /api/v1/groups/{groupId}/events[/{eventId}] routes
- `go build ./...` passes

## Phase 4: Groups API
- `backend/models/group.go`: Group struct, CreateGroup (bcrypt password + random 8-char join code + tx for creator membership), JoinGroup (password verify + ON CONFLICT membership), ListGroupsForDevice, GetGroup, IsMember
- `backend/handlers/groups.go`: POST /groups (201), POST /groups/join (200/401/404), GET /devices/{deviceId}/groups, GET /groups/{groupId}
- router updated with new group routes
- added `golang.org/x/crypto` for bcrypt
- `go build ./...` passes

## Phase 9: Device Identity & API Client
- `frontend/lib/storage.ts`: AsyncStorage helpers for deviceId, displayName, groups, children
- `frontend/lib/api.ts`: typed fetch-based API client covering all endpoints; injects X-Device-ID header; BASE_URL via EXPO_PUBLIC_API_URL
- `frontend/lib/device.ts`: initDevice() — registers device on first launch, persists UUID, falls back to local UUID if backend unreachable
- expo export --platform web passes

## Phase 8: Expo Project Setup & Navigation
- `frontend/package.json`: Expo SDK 52, expo-router v4, all peer deps
- `frontend/app.json`: scheme, web bundler (metro), expo-router + expo-notifications plugins
- `frontend/tsconfig.json`, `babel.config.js`, `metro.config.js`
- `frontend/app/_layout.tsx`: root Stack layout
- `frontend/app/(tabs)/_layout.tsx`: tab navigator (Home, Children, Settings)
- `frontend/app/(tabs)/index.tsx`, `children.tsx`, `settings.tsx`: placeholder screens
- `frontend/app/group/[groupId].tsx`, `frontend/app/event/[eventId].tsx`: placeholder screens
- `frontend/.gitignore`: excludes node_modules, dist
- `npx expo export --platform web` passes (10 static routes)

## Phase 7: Push Notifications (Backend)
- `backend/notifications/fcm.go`: FCM v1 REST client using stdlib JWT/RSA (no new deps); graceful no-op when credentials missing
- `backend/models/group.go`: GetGroupMemberTokens() returns push tokens of group members excluding creator
- `backend/handlers/events.go`: async goroutine sends push notification on event creation
- `backend/router/router.go`: accepts *notifications.FCMClient param
- `backend/main.go`: initializes FCMClient; passes to router
- `go build ./...` passes

## Phase 3: Device & Children API
- `backend/models/device.go`: Device struct, CreateDevice, UpdateDevice (supports push_token update/clear)
- `backend/models/child.go`: Child struct, ListChildren, CreateChild, UpdateChild, DeleteChild
- `backend/handlers/devices.go`: POST /api/v1/devices (201), PUT /api/v1/devices/{deviceId} (200/404)
- `backend/handlers/children.go`: GET/POST/PUT/DELETE /api/v1/devices/{deviceId}/children[/{childId}]
- `backend/handlers/helpers.go`: shared writeJSON, writeError, Health handler
- `backend/router/router.go`: chi router wiring all routes
- main.go updated to use router
- `go build ./...` passes
