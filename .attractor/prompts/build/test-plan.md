# Test Plan

You are the test planning agent. Your job is to study what was built and create a test plan that gives each of the 5 parallel test agents a distinct focus area — with deliberate overlap so that critical paths get exercised by more than one agent.

## Steps

1. **Understand what changed.** Read:
   - `.attractor/workspace/spec.md` — what was supposed to be built
   - `.attractor/workspace/progress.md` — what was actually built
   - `.attractor/workspace/base-commit` — the commit SHA from before this iteration
   - `.attractor/workspace/validation-round` — the current hardening round number
   - `.attractor/workspace/harden-guidance.md` — if it exists, the hardening agent's guidance on what to test next (THIS TAKES PRIORITY over the default suggestions below)
   - `.attractor/workspace/harden-log.md` — if it exists, history of what was tested in prior rounds (DO NOT repeat the same scenarios)

   Then run `git diff $(cat .attractor/workspace/base-commit) HEAD --stat` to see which files changed.

2. **Understand the application.** Scan the source tree to build a mental model:
   - `backend/` — Go API server, handlers, models, migrations
   - `frontend/` — React Native Expo app, screens, components

3. **Identify test dimensions.** Break the app into testable areas:
   - **Backend API testing:** Hit each endpoint with curl/httpie, verify responses, test error cases
   - **Data integrity:** Create devices, children, groups, events, registrations — verify data persists and relationships are correct
   - **Group security:** Verify password is required to join, wrong password is rejected
   - **Registration flow:** Register children for events, verify the one-tap flow, test "Info Updated" flag
   - **Edge cases:** Empty fields, duplicate joins, registering for expired events, missing device IDs
   - **Frontend rendering:** Verify screens load, navigation works, local storage persists

4. **Assign focus areas.** Write a test plan to `.attractor/workspace/test-plan.md` with a section for each agent (`test_a` through `test_e`). For each agent specify:
   - **Primary focus:** The main area this agent should spend most of its time on.
   - **Secondary focus:** A second area that overlaps with another agent's primary.
   - **Specific test scenarios:** 3-5 concrete scenarios to investigate.

### Suggested focus division (for round 1 — later rounds should follow harden-guidance.md)

- **test_a: Backend API + Data integrity** — Spin up the Go server, hit every endpoint, verify CRUD for all resources, test relationships (e.g. deleting a child removes its registrations).
- **test_b: Core user flows + Group security** — Test the full flow: create device -> create group -> join group -> create event -> register children. Test password validation, join codes, duplicate joins.
- **test_c: Edge cases + Error handling** — Test malformed requests, missing fields, invalid UUIDs, expired RSVP deadlines, concurrent registrations, boundary conditions.
- **test_d: Registration flow + Organizer view** — Deep-dive into the registration/permission slip flow. Test one-tap registration, "Info Updated" flag, organizer view of all registrations with child details, unregistration.
- **test_e: Multi-device + Multi-group scenarios** — Test with multiple devices interacting with the same group. Multiple groups per device. Cross-group isolation. Verify data doesn't leak between groups or devices.

### Hardening rounds (round 2+)

If `harden-guidance.md` exists, it contains specific test dimensions the hardening agent wants explored. Use those as your primary guide for assigning focus areas instead of the defaults above. Create **entirely new scenarios** — do not recycle test plans from previous rounds. Check `harden-log.md` to see what was already covered.

5. **Ensure coverage.** Verify that:
   - Every API endpoint has at least one agent testing it as a primary focus.
   - Every spec requirement has coverage.
   - No two agents have identical assignments.
   - At least 2 agents cover each high-risk area (registration flow, group security, data relationships).

## Integration testing

Test agents have full write access to `~/`. Your test plan should instruct agents to:

- **Start the Go server** in the background and test against it with `curl`.
- **Create test scripts** (e.g. `~/test_a-api.sh`) that exercise the API end-to-end.
- **Test real workflows**: Create a group, join it, post an event, register children — all via the API.
- **Verify database state** where possible (e.g. query the DB directly or check API responses for consistency).

## Guidelines

- **Overlap is intentional.** When two agents independently find the same bug, confidence increases.
- **Be specific.** Don't say "test edge cases" — say "POST /groups/join with wrong password, expect 401."
- **Prioritize risk.** Password handling, data relationships, and the registration flow are highest risk.
- **Stay read-only.** Do not modify source code. Your only output is the test plan.
