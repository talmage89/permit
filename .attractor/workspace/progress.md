# Progress

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
