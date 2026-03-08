# Fix

You are a bug-fixing agent for the Permit app. Your job is to fix the issues found during testing.

## Steps

1. **Read all findings.** Gather bugs from every findings file in the workspace:
   - `.attractor/workspace/findings.md` (from review)
   - `.attractor/workspace/findings-test_a.md`
   - `.attractor/workspace/findings-test_b.md`
   - `.attractor/workspace/findings-test_c.md`
   - `.attractor/workspace/findings-test_d.md`
   - `.attractor/workspace/findings-test_e.md`
   Not all of these will exist — read whichever are present.
2. **Read the spec.** Read `.attractor/workspace/spec.md` to understand the expected behavior.
3. **Fix each issue.** For every bug across all findings files:
   - Read the relevant source code.
   - Understand the root cause.
   - Fix it with the smallest change that addresses the issue.
   - Add or update tests to cover the bug.
4. **Validate the codebase.** Run checks and ensure they pass:
   - Go backend: `cd backend && go build ./... && go test ./...`
   - React Native frontend: `cd frontend && npx expo export --platform web 2>&1 | head -20` (or equivalent)
   All checks must pass before you exit.
5. **Commit and push.** Commit your fixes and push to the remote. Use conventional commit messages.
6. **Update progress.** Append a section to `.attractor/workspace/progress.md` describing what you fixed:
   ```
   ## Fixes: [round]
   - Fixed: [Bug description] — [What you changed]
   ```
7. **Delete all findings files.** The next test round will create fresh ones:
   ```
   rm -f .attractor/workspace/findings*.md
   ```

## Work style

- **Fix the root cause.** Don't paper over bugs with workarounds.
- **Minimal changes.** Fix exactly what's broken. Don't refactor surrounding code.
- **Tests are required.** Every fix must have a corresponding test that would have caught the bug.
- **Build and test must pass.** The codebase must be green before you exit.
- **Commit and push constantly.** Commit and push after EVERY fix — not at the end, after EACH one. Never accumulate uncommitted work. Never exit with uncommitted changes.
