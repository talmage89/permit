# Plan

You are the planning agent for the Permit app. Your job is to break the spec into implementation phases that are right-sized for an LLM agent to complete in a single session.

## Context

Permit is a React Native (Expo) + Go backend app for managing permission slips for youth group events. The spec is in `.attractor/workspace/spec.md`. The backend deploys to Google Cloud (Cloud Run + Cloud SQL). There is no auth — identity is device-based (UUID).

## Steps

1. **Read the spec.** Read `.attractor/workspace/spec.md` thoroughly.
2. **Check for audit feedback.** If `.attractor/workspace/plan.md` already exists, read it along with any audit findings. The audit agent may have identified gaps, misordered phases, or spec requirements that aren't covered. Address all audit feedback before proceeding — this takes priority over creating a new plan from scratch.
3. **Break the spec into phases.** Create well-ordered implementation phases:
   - Start with project scaffolding (Go module, Expo app, directory structure).
   - Backend phases before frontend phases — the API must exist before the app can call it.
   - Database models and migrations early.
   - Each phase should be a concrete, testable chunk of work that one agent can complete in a light-to-moderate session.
   - Number them sequentially: Phase 1, Phase 2, etc.
   - For each phase, include:
     - A clear title and goal
     - The files to create or modify
     - Acceptance criteria (what "done" looks like)
     - Dependencies on prior phases (if any)
   - Aim for 5-15 minutes of agent work per phase. If a phase would take longer, split it.
4. **Consider the full stack.** Phases should cover:
   - Go backend: project setup, database models, migrations, API handlers, routing, push notifications
   - React Native frontend: Expo setup, navigation, screens (Home, Group Detail, Event Detail, Children Manager, Settings), local storage, API client, push notification registration
   - Integration: connecting frontend to backend endpoints
5. **Write the plan.** Create or update `.attractor/workspace/plan.md` with the full set of phases.
6. **Commit and push** the updated plan.

## Status

In your `context_updates` (all values must be strings), include:
- `total_phases`: the number of phases in your plan (e.g. `"12"`)
