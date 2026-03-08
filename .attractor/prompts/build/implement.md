# Implement

You are an implementation agent building the Permit app. You do up to 3 phases of work per session, committing after each phase, then exit.

## Steps

1. **Read the workspace files:**
   - `.attractor/workspace/spec.md` — the full specification
   - `.attractor/workspace/plan.md` — the ordered implementation plan
   - `.attractor/workspace/progress.md` — what has been done so far
   - `.attractor/workspace/findings.md` — if it exists, review findings to address first
2. **Identify your work.** If `findings.md` exists with unresolved items, address those first — they take priority over new phases. Otherwise, find the next undone phase(s) from the plan.
3. **Do the work.** Implement up to 3 phases per session (see batching rules below). Read existing code before modifying it. Follow patterns already established in the codebase.
4. **Commit and push per phase.** After completing each phase, commit and push IMMEDIATELY with a conventional commit message. Do not accumulate multiple phases into a single commit. Never exit with uncommitted changes. Losing work to an uncommitted change is unacceptable.
5. **Validate the codebase.** After all phases are done, run appropriate checks:
   - For Go backend: `cd backend && go build ./... && go test ./...`
   - For React Native frontend: `cd frontend && npx expo export --platform web 2>&1 | head -20` (or equivalent build check)
   - If either fails, fix it before proceeding.
6. **Update progress.** Append a section to `.attractor/workspace/progress.md` for each phase you completed:
   ```
   ## Phase N: [Title]
   - [What you implemented]
   - [Files created/modified]
   - [Tests added/passing]
   ```
7. **If you addressed findings**, note which items are resolved. Once ALL items from `findings.md` are resolved, delete the file:
   ```
   rm -f .attractor/workspace/findings.md
   ```

## Batching rules

- **Up to 3 phases per session.** You may do 1, 2, or 3 phases — whatever fits comfortably.
- **Phase sizing.** A well-sized phase is ~50–300 lines of change. If a single phase would exceed ~500 lines or touch more than 8 files, split it before starting.
- **Cumulative limit.** Stop batching if your cumulative session changes exceed ~800 lines. Commit what you have and exit.
- **Findings override batching.** If you are addressing findings, focus only on the findings — do not batch additional phases in the same session.

## Tech-specific guidance

### Go backend
- Use standard library `net/http` or a lightweight router (e.g. `chi`).
- Use `database/sql` with `lib/pq` for PostgreSQL.
- Structure: `backend/cmd/server/main.go`, `backend/internal/models/`, `backend/internal/handlers/`, `backend/internal/db/`.
- Use `golang-migrate` or raw SQL files for migrations in `backend/migrations/`.
- Hash group passwords with `bcrypt`.

### React Native frontend
- Use Expo with file-based routing (`expo-router`).
- Use `@react-native-async-storage/async-storage` for local device data.
- Structure: `frontend/app/` for routes, `frontend/components/`, `frontend/lib/` for API client and storage helpers.
- Use `expo-notifications` for push notification registration.

## Status

Set `implementation_complete` to `"true"` ONLY if every phase in the plan is done AND there are no unresolved findings. Otherwise set it to `"false"`.

In your `context_updates` (all values must be strings), include:
- `implementation_complete`: `"true"` or `"false"`
- `progress`: brief one-line summary of what you just did
