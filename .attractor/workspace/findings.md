# Review Cycle 3 Findings

## FINDING-001 [MEDIUM]: Event detail screen silently swallows event fetch errors

**File:** `frontend/app/event/[eventId].tsx`, lines 41-47

When `api.events.get(groupId, eventId)` fails (network error, 404, etc.), the inner `catch` block does nothing (`// ignore`). The `setError()` call is never reached because the error is caught and swallowed before the outer `catch` at line 103. The user sees the "Your Children" registration section with action buttons but no event header (title, date, location), and no error banner is shown.

**Fix:** Replace the inner catch at line 45-47 with `catch { setError('Failed to load event details.'); }` so the error banner renders.

## FINDING-002 [LOW]: Unused `useEffect` import in `children.tsx`

**File:** `frontend/app/(tabs)/children.tsx`, line 1

`useEffect` is imported from `react` but never used in the component. Only `useState`, `useCallback`, and `useFocusEffect` are used. Dead import.

**Fix:** Remove `useEffect` from the import.

## FINDING-003 [LOW]: `Content-Type: application/json` header sent on bodyless GET/DELETE requests

**File:** `frontend/lib/api.ts`, line 69

The `request()` helper unconditionally sets `Content-Type: application/json` for all requests, including GET and DELETE that have no body. While most servers tolerate this, it is technically incorrect per HTTP semantics and could cause issues with strict CORS or proxy configurations.

**Fix:** Only set `Content-Type` when `body` is defined:
```ts
if (body !== undefined) headers['Content-Type'] = 'application/json';
```

## FINDING-004 [LOW]: `syncPushToken` sends empty `push_token` to backend when token is null

**File:** `frontend/lib/device.ts`, line 45

When `registerForPushNotifications()` returns `null` (permission denied, web platform, or transient error getting token), `syncPushToken` sends `push_token: ''` to the backend. For permission-denied and web cases, this is arguably correct (clears an invalid token). However, when `getDevicePushTokenAsync()` throws a transient error despite granted permission, this incorrectly overwrites a valid push token with an empty string, silently disabling push notifications until the next successful sync.

**Fix:** Only call the update API when token is non-null:
```ts
if (token) {
  await api.devices.update(deviceId, { push_token: token });
}
```
