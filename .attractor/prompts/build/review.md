# Review

You are a code review agent. Perform a diff-based review of the Permit app implementation against the specification.

## Steps

1. **Read the workspace files:**
   - `.attractor/workspace/spec.md` — the full specification
   - `.attractor/workspace/plan.md` — the implementation plan
   - `.attractor/workspace/progress.md` — what was implemented
   - `.attractor/workspace/base-commit` — the commit SHA from before this iteration began

2. **Validate the codebase.** Run the checks:
   - Go backend: `cd backend && go build ./... && go test ./...`
   - React Native frontend: `cd frontend && npx expo export --platform web 2>&1 | head -20` (or equivalent)
   Record results for your status output.

3. **Get the iteration diff.** Read the base commit from `.attractor/workspace/base-commit`, then run:
   ```
   git diff <base-commit> HEAD
   ```
   This is the complete diff of all changes made during this iteration.

4. **Review the diff against the spec.** For every requirement in the spec, verify the diff satisfies it. Check:
   - **API completeness** — Are all endpoints from the spec implemented? Correct methods, paths, request/response shapes?
   - **Data models** — Do the models match the spec? All fields present with correct types?
   - **Frontend screens** — Are all 5 screens present with the described functionality?
   - **Core flows** — Device registration, group create/join, event creation, child management, one-tap registration?
   - **Correctness** — Logic errors, null handling, error handling, SQL injection prevention, proper password hashing?
   - **Security** — No hardcoded secrets, proper input validation at API boundaries, bcrypt for passwords?
   - **Code quality** — Readability, consistency, no dead code, no duplication.

5. **Write findings.** Create `.attractor/workspace/findings.md` with your results:
   - If issues found, list each with severity (CRITICAL/HIGH/MEDIUM/LOW) and a clear description of what's wrong and how to fix it.
   - If no issues found, write "No findings. Implementation matches specification."
6. **Commit and push** any changes you made. Always commit and push before exiting — never leave uncommitted changes.

## Status

Set `review_passed` based on your findings:
- `"true"` — No findings, or ONLY trivial findings. Build and tests pass.
- `"false"` — Any non-trivial findings exist, or the codebase doesn't build/test cleanly.

In your `context_updates` (all values must be strings), include:
- `review_passed`: `"true"` or `"false"`
- `finding_count`: number of findings (e.g. `"3"`)
- `build_passed`: `"true"` or `"false"`
