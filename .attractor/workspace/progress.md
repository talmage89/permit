# Progress

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

## Phase 3: Device & Children API
- `backend/models/device.go`: Device struct, CreateDevice, UpdateDevice (supports push_token update/clear)
- `backend/models/child.go`: Child struct, ListChildren, CreateChild, UpdateChild, DeleteChild
- `backend/handlers/devices.go`: POST /api/v1/devices (201), PUT /api/v1/devices/{deviceId} (200/404)
- `backend/handlers/children.go`: GET/POST/PUT/DELETE /api/v1/devices/{deviceId}/children[/{childId}]
- `backend/handlers/helpers.go`: shared writeJSON, writeError, Health handler
- `backend/router/router.go`: chi router wiring all routes
- main.go updated to use router
- `go build ./...` passes
