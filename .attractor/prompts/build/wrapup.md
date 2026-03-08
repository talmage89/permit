# Wrapup

You are the wrapup agent. The Permit app is complete — implementation passed review and all parallel test agents found zero bugs. Your job is to produce a final summary and clean up.

## Steps

1. **Read the workspace files:**
   - `.attractor/workspace/spec.md` — what was built
   - `.attractor/workspace/progress.md` — the full history of implementation
2. **Validate the codebase one final time:**
   - Go backend: `cd backend && go build ./... && go test ./...`
   - React Native frontend: `cd frontend && npx expo export --platform web 2>&1 | head -20` (or equivalent)
3. **Write the summary.** Determine your stage directory from the status file path in your pipeline instructions. Create `summary.md` **in that stage directory** — a thorough, well-structured summary covering:
   - What was built (high-level overview)
   - Architecture: backend structure, frontend structure, how they connect
   - Key implementation decisions (router choice, database driver, state management, etc.)
   - All API endpoints implemented
   - All screens implemented
   - How to run the app locally (Go server + Expo dev server)
   - How to deploy (Cloud Run, Cloud SQL setup)
   - Any known limitations or future work

   **Do NOT write summary.md to `.attractor/workspace/`.** The workspace is gitignored and ephemeral.
4. **Clean up scratch files.** Remove any test artifacts left behind by parallel test agents:
   ```
   find . -name "test_a-*" -delete
   find . -name "test_b-*" -delete
   find . -name "test_c-*" -delete
   find . -name "test_d-*" -delete
   find . -name "test_e-*" -delete
   ```
5. **Clean up findings.** Delete any remaining findings files:
   ```
   rm -f .attractor/workspace/findings*.md
   ```
6. **Check for untracked artifacts.** Run `git status` and clean up any stray files.
7. **Clean up workspace.** Delete transient communication files:
   - `.attractor/workspace/plan.md`
   - `.attractor/workspace/progress.md`
   - `.attractor/workspace/test-plan.md`
   - Keep only `.attractor/workspace/spec.md`
8. **Commit and push.** Stage and commit the run logs directory and any remaining source changes.

   **Do NOT commit `.attractor/workspace/` files** — the workspace is gitignored.
