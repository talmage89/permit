# Permit - Group Event Permission Slip App

## Overview

Permit is a mobile app for managing permission slips for youth group events. Group leaders create events, and parents/guardians can register their children with a single tap. Child information (name, allergies, notes) is saved locally on the device so subsequent registrations are instant.

No authentication required -- all data is device-local. Anyone in a group can post events.

## Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Go (Golang)
- **Deployment:** Google Cloud (Cloud Run + Cloud SQL / Firestore)
- **Push Notifications:** Firebase Cloud Messaging (FCM)

## Core Concepts

### Device Identity

- On first launch, the app generates a unique device ID (UUID) stored locally.
- The device ID is sent with all API requests to identify the user.
- No login, no passwords, no email -- just the device.
- A user sets a display name on first launch (editable later).

### Children

- A user creates "children" on their device with the following fields:
  - **Name** (required)
  - **Birthdate** (optional)
  - **Allergies** (free text, optional)
  - **Notes** (free text, optional -- dietary restrictions, medications, etc.)
- Children are stored locally on the device AND synced to the backend (keyed by device ID).
- Child info persists across events. Users update it once and it carries forward.

### Groups

- Anyone can create a group. The creator sets:
  - **Group name** (required)
  - **Group password** (required)
- To join a group, a user enters the group name/code and password.
- Once joined, the group is saved locally. No re-auth needed.
- Anyone in the group can post events (no admin/member distinction).
- A user can belong to multiple groups.
- Groups have a shareable join code (short alphanumeric, e.g. `ABCD1234`).

### Events

- Any group member can create an event with:
  - **Title** (required)
  - **Description** (free text, optional)
  - **Date & time** (required)
  - **Location** (free text, optional)
  - **RSVP deadline** (optional)
- When an event is published, all group members receive a push notification.

### Registration (Permission Slips)

- When viewing an event, a user sees their children listed.
- For each child, the user can:
  - Tap **"Yes"** -- registers the child for the event.
  - Tap **"Info Updated"** -- flags that child info has been updated since last event, then registers.
- Registration is a single tap per child. No forms to fill out after the first time.
- The event organizer can view a list of registered children with their info (name, allergies, notes).

## API Design

Base URL: `/api/v1`

### Devices

| Method | Path | Description |
|--------|------|-------------|
| POST | `/devices` | Register a new device (returns device ID if not already registered) |
| PUT | `/devices/{deviceId}` | Update display name |

### Children

| Method | Path | Description |
|--------|------|-------------|
| GET | `/devices/{deviceId}/children` | List children for a device |
| POST | `/devices/{deviceId}/children` | Create a child |
| PUT | `/devices/{deviceId}/children/{childId}` | Update a child |
| DELETE | `/devices/{deviceId}/children/{childId}` | Delete a child |

### Groups

| Method | Path | Description |
|--------|------|-------------|
| POST | `/groups` | Create a new group |
| POST | `/groups/join` | Join a group (requires join code + password) |
| GET | `/devices/{deviceId}/groups` | List groups for a device |
| GET | `/groups/{groupId}` | Get group details |

### Events

| Method | Path | Description |
|--------|------|-------------|
| POST | `/groups/{groupId}/events` | Create an event |
| GET | `/groups/{groupId}/events` | List events for a group |
| GET | `/groups/{groupId}/events/{eventId}` | Get event details |
| PUT | `/groups/{groupId}/events/{eventId}` | Update an event |
| DELETE | `/groups/{groupId}/events/{eventId}` | Delete an event |

### Registrations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/events/{eventId}/register` | Register children for an event |
| DELETE | `/events/{eventId}/register/{childId}` | Unregister a child |
| GET | `/events/{eventId}/registrations` | List all registrations (for organizers) |
| GET | `/events/{eventId}/registrations/{deviceId}` | Get registrations for a device |

## Data Models

### Device
```
id: UUID (generated server-side)
display_name: string
push_token: string (FCM token, optional)
created_at: timestamp
updated_at: timestamp
```

### Child
```
id: UUID
device_id: UUID (FK -> Device)
name: string
birthdate: date (nullable)
allergies: text (nullable)
notes: text (nullable)
created_at: timestamp
updated_at: timestamp
```

### Group
```
id: UUID
name: string
join_code: string (unique, 8 chars alphanumeric)
password_hash: string (bcrypt)
created_by_device_id: UUID (FK -> Device)
created_at: timestamp
```

### GroupMembership
```
device_id: UUID (FK -> Device)
group_id: UUID (FK -> Group)
joined_at: timestamp
```

### Event
```
id: UUID
group_id: UUID (FK -> Group)
title: string
description: text (nullable)
event_date: timestamp
location: text (nullable)
rsvp_deadline: timestamp (nullable)
created_by_device_id: UUID (FK -> Device)
created_at: timestamp
updated_at: timestamp
```

### Registration
```
id: UUID
event_id: UUID (FK -> Event)
child_id: UUID (FK -> Child)
device_id: UUID (FK -> Device)
info_updated: boolean (default false)
registered_at: timestamp
```

## Screens (React Native)

1. **Home** -- List of joined groups. Button to create/join a group.
2. **Group Detail** -- List of upcoming events. Button to create an event.
3. **Event Detail** -- Event info, list of user's children with Yes/Info Updated buttons. Organizer view shows all registrations.
4. **Children Manager** -- Add/edit/remove children and their info.
5. **Settings** -- Edit display name, manage push notification preferences.

## Push Notifications

- When an event is created, send a notification to all group members (except the creator).
- Payload includes group name, event title, and event date.
- Uses FCM via the backend. Device tokens are registered on app launch.

## Deployment (Google Cloud)

- **Cloud Run** for the Go backend (stateless, auto-scaling).
- **Cloud SQL (PostgreSQL)** for the database.
- **Firebase Cloud Messaging** for push notifications.
- Environment config via Cloud Run environment variables.

## Future Considerations (Out of Scope for v1)

- Admin roles within groups (ability to restrict who can post events)
- Event comments/discussion
- Photo attachments for events
- Export registration list as PDF/CSV
- Web companion app
- Multiple organizations/tenants with branding
