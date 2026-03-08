# Permit App - Implementation Plan

## Phase 1: Project Scaffolding & Go Module Setup

**Goal:** Initialize the Go backend project with module, directory structure, and a health-check endpoint.

**Files to create:**
- `backend/go.mod`, `backend/go.sum`
- `backend/main.go` — HTTP server entry point with `/health` endpoint
- `backend/Dockerfile`
- `backend/.env.example`

**Acceptance criteria:**
- `go build ./...` succeeds
- Server starts on `PORT` env var (default 8080)
- `GET /health` returns `{"status":"ok"}`
- Dockerfile builds successfully

**Dependencies:** None

---

## Phase 2: Database Schema & Migrations

**Goal:** Create PostgreSQL schema with all tables and a migration runner.

**Files to create:**
- `backend/db/migrations/001_initial_schema.sql` — DDL for devices, children, groups, group_memberships, events, registrations tables
- `backend/db/db.go` — Database connection pool setup (using `pgx` or `database/sql` with `lib/pq`)
- `backend/db/migrate.go` — Simple migration runner (embed SQL, run on startup)

**Acceptance criteria:**
- All 6 tables created with correct columns, types, foreign keys, and indexes
- `join_code` has unique constraint
- Migration runs idempotently on server startup
- Connection uses `DATABASE_URL` env var

**Dependencies:** Phase 1

---

## Phase 3: Device & Children API

**Goal:** Implement device registration and children CRUD endpoints.

**Files to create:**
- `backend/handlers/devices.go` — `POST /api/v1/devices`, `PUT /api/v1/devices/{deviceId}`
- `backend/handlers/children.go` — CRUD for `/api/v1/devices/{deviceId}/children[/{childId}]`
- `backend/models/device.go` — Device struct and DB queries
- `backend/models/child.go` — Child struct and DB queries
- `backend/router/router.go` — HTTP router setup (using `chi` or `gorilla/mux`)

**Acceptance criteria:**
- `POST /devices` creates device with server-generated UUID, returns it
- `PUT /devices/{id}` updates display_name and push_token
- Children CRUD works: list, create, update, delete
- Proper HTTP status codes (201, 200, 404, 400)
- JSON request/response bodies

**Dependencies:** Phase 2

---

## Phase 4: Groups API

**Goal:** Implement group creation, joining, and listing.

**Files to create:**
- `backend/handlers/groups.go` — `POST /groups`, `POST /groups/join`, `GET /devices/{deviceId}/groups`, `GET /groups/{groupId}`
- `backend/models/group.go` — Group and GroupMembership structs and queries

**Acceptance criteria:**
- `POST /groups` creates group with bcrypt password hash and random 8-char join code; auto-adds creator as member
- `POST /groups/join` validates join code + password, adds membership
- `GET /devices/{deviceId}/groups` lists groups the device belongs to
- `GET /groups/{groupId}` returns group details (without password hash)
- Join code is unique; duplicate handled gracefully

**Dependencies:** Phase 3

---

## Phase 5: Events API

**Goal:** Implement event CRUD scoped to groups.

**Files to create:**
- `backend/handlers/events.go` — CRUD for `/api/v1/groups/{groupId}/events[/{eventId}]`
- `backend/models/event.go` — Event struct and DB queries

**Acceptance criteria:**
- `POST /groups/{groupId}/events` creates event (validates group membership via device ID header)
- `GET /groups/{groupId}/events` lists events for the group (ordered by event_date)
- `GET /groups/{groupId}/events/{eventId}` returns event details
- `PUT` and `DELETE` work with proper ownership/membership checks
- Proper error handling for non-existent groups/events

**Dependencies:** Phase 4

---

## Phase 6: Registrations API

**Goal:** Implement event registration (permission slip) endpoints.

**Files to create:**
- `backend/handlers/registrations.go` — `POST /events/{eventId}/register`, `DELETE /events/{eventId}/register/{childId}`, `GET /events/{eventId}/registrations`, `GET /events/{eventId}/registrations/{deviceId}`
- `backend/models/registration.go` — Registration struct and DB queries

**Acceptance criteria:**
- `POST /events/{eventId}/register` registers one or more children (with `info_updated` flag)
- `DELETE` unregisters a child
- `GET /events/{eventId}/registrations` returns all registrations with child details (organizer view)
- `GET /events/{eventId}/registrations/{deviceId}` returns registrations for a specific device
- Prevents duplicate registrations for same child+event

**Dependencies:** Phase 5

---

## Phase 7: Push Notifications (Backend)

**Goal:** Add FCM push notification sending when events are created.

**Files to create:**
- `backend/notifications/fcm.go` — FCM client wrapper (sends to device tokens)
- Update `backend/handlers/events.go` — trigger notification on event creation

**Acceptance criteria:**
- On event creation, all group members (except creator) with push tokens receive a notification
- Notification payload includes group name, event title, event date
- FCM errors are logged but don't fail the event creation
- FCM credentials loaded from env var or JSON key file
- Gracefully no-ops if FCM is not configured

**Dependencies:** Phase 5

---

## Phase 8: Expo Project Setup & Navigation

**Goal:** Initialize the React Native (Expo) project with navigation structure.

**Files to create:**
- `frontend/` — Expo project (via `npx create-expo-app`)
- `frontend/app/` — Expo Router file-based routing
- `frontend/app/(tabs)/index.tsx` — Home screen placeholder
- `frontend/app/(tabs)/children.tsx` — Children Manager placeholder
- `frontend/app/(tabs)/settings.tsx` — Settings placeholder
- `frontend/app/group/[groupId].tsx` — Group Detail placeholder
- `frontend/app/event/[eventId].tsx` — Event Detail placeholder

**Acceptance criteria:**
- `npx expo start` runs without errors
- Tab navigation with Home, Children, Settings tabs
- Stack navigation to Group Detail and Event Detail screens
- All screens render placeholder content

**Dependencies:** None (can run in parallel with backend phases)

---

## Phase 9: Device Identity & API Client

**Goal:** Implement device UUID generation, local storage, and API client.

**Files to create:**
- `frontend/lib/storage.ts` — AsyncStorage helpers for device ID, display name, groups, children
- `frontend/lib/api.ts` — API client with base URL config, device ID header injection
- `frontend/lib/device.ts` — Device registration (generate UUID, POST to backend on first launch)

**Acceptance criteria:**
- On first launch, UUID is generated and stored locally
- API client attaches device ID to all requests (header or query param)
- Base URL configurable via env/config
- API client has typed methods for all endpoints

**Dependencies:** Phase 8

---

## Phase 10: Settings & Display Name Screen

**Goal:** Implement the Settings screen with display name editing.

**Files to create/modify:**
- `frontend/app/(tabs)/settings.tsx` — Display name input, save button
- `frontend/components/FirstLaunchModal.tsx` — Modal for setting display name on first launch

**Acceptance criteria:**
- First launch prompts for display name
- Settings screen shows current display name with edit capability
- Display name saved locally and synced to backend
- Changes persist across app restarts

**Dependencies:** Phase 9

---

## Phase 11: Children Manager Screen

**Goal:** Implement the Children Manager for adding/editing/removing children.

**Files to create/modify:**
- `frontend/app/(tabs)/children.tsx` — List of children with add button
- `frontend/components/ChildForm.tsx` — Form for creating/editing a child (name, birthdate, allergies, notes)

**Acceptance criteria:**
- List shows all children stored locally
- Add new child with name (required), birthdate, allergies, notes
- Edit existing child info
- Delete child with confirmation
- Children synced to backend on create/update/delete
- Data persists locally across app restarts

**Dependencies:** Phase 9

---

## Phase 12: Home Screen & Group Management

**Goal:** Implement the Home screen with group listing, creation, and joining.

**Files to create/modify:**
- `frontend/app/(tabs)/index.tsx` — List of joined groups, create/join buttons
- `frontend/components/CreateGroupModal.tsx` — Form for group name + password
- `frontend/components/JoinGroupModal.tsx` — Form for join code + password

**Acceptance criteria:**
- Home screen lists all joined groups
- Create group: name + password → calls API → adds to local list
- Join group: join code + password → calls API → adds to local list
- Groups persist locally
- Tapping a group navigates to Group Detail

**Dependencies:** Phase 9

---

## Phase 13: Group Detail & Event Creation

**Goal:** Implement the Group Detail screen showing events and allowing event creation.

**Files to create/modify:**
- `frontend/app/group/[groupId].tsx` — List of upcoming events, create event button
- `frontend/components/CreateEventModal.tsx` — Form for event title, description, date/time, location, RSVP deadline

**Acceptance criteria:**
- Group Detail shows group name and list of events (sorted by date)
- Create event form with all fields (title required, rest optional)
- Events fetched from backend on screen load
- Pull-to-refresh for event list
- Tapping an event navigates to Event Detail

**Dependencies:** Phase 12

---

## Phase 14: Event Detail & Registration

**Goal:** Implement the Event Detail screen with registration (permission slip) functionality.

**Files to create/modify:**
- `frontend/app/event/[eventId].tsx` — Event info, children list with register/unregister buttons, organizer registration view

**Acceptance criteria:**
- Shows event title, description, date, location, RSVP deadline
- Lists user's children with "Yes" / "Info Updated" buttons
- Tapping "Yes" registers the child (single tap)
- Tapping "Info Updated" sets the flag and registers
- Already-registered children shown with a checkmark/indicator
- Can unregister a child
- Organizer view: list of all registered children with their info (name, allergies, notes)

**Dependencies:** Phase 13, Phase 11

---

## Phase 15: Push Notifications (Frontend)

**Goal:** Register for push notifications, handle incoming notifications, and add notification preferences to Settings.

**Files to create/modify:**
- `frontend/lib/notifications.ts` — Expo push notification registration, token upload to backend
- Update `frontend/lib/device.ts` — Send push token on registration
- Update `frontend/app/event/[eventId].tsx` — Deep link from notification
- Update `frontend/app/(tabs)/settings.tsx` — Add push notification preference toggle

**Acceptance criteria:**
- App requests notification permission on launch
- FCM token sent to backend via `PUT /devices/{deviceId}`
- Incoming notifications display when app is backgrounded
- Tapping a notification navigates to the relevant event (if possible)
- Settings screen includes a toggle to enable/disable push notifications
- Toggling off removes push token from backend (sends empty token via PUT /devices)

**Dependencies:** Phase 14, Phase 7

---

## Phase 16: Polish & Error Handling

**Goal:** Add loading states, error handling, empty states, and UI polish across all screens.

**Files to modify:**
- All screen and component files

**Acceptance criteria:**
- Loading spinners during API calls
- Error messages displayed on API failures (with retry option)
- Empty states for no groups, no events, no children, no registrations
- Input validation on forms (required fields)
- Consistent styling and spacing across screens

**Dependencies:** Phase 14
