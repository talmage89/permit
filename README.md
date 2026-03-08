# Permit

A mobile app for managing permission slips for youth group events. Group leaders create events, parents register their children with a single tap. Child info (allergies, notes) is saved so subsequent sign-ups are instant.

No login required -- identity is device-based.

## How it works

1. **Create a group** with a name and password. Share the join code.
2. **Parents join** the group by entering the code + password.
3. **Add children** once -- name, allergies, notes are saved on the device.
4. **Leader posts an event** -- all group members get a push notification.
5. **Parents tap "Yes"** to register each child. One tap. Done.

## Tech stack

- **Frontend:** React Native (Expo)
- **Backend:** Go
- **Database:** PostgreSQL (Cloud SQL)
- **Deployment:** Google Cloud Run
- **Notifications:** Firebase Cloud Messaging

## Project structure

```
backend/          # Go API server
frontend/         # React Native Expo app
SPEC.md           # Full specification
.attractor/       # Attractor build pipeline
  flows/build.dag # DAG definition
  prompts/build/  # Agent prompts
```

## Build pipeline

This project is built autonomously using [Attractor](https://github.com/talmage89/attractor). The DAG defines a multi-phase pipeline with escalating validation:

```mermaid
graph TD
    start((start)) --> init[init]
    init --> plan[plan]
    plan --> audit[audit]
    audit -->|passed| implement[implement]
    audit -->|gaps found| plan

    implement -->|more phases| implement
    implement -->|complete| review[review]
    review -->|findings| implement
    review -->|passed| test_plan[test_plan]

    test_plan --> fan{fanout}
    fan --> test_a[test_a]
    fan --> test_b[test_b]
    fan --> test_c[test_c]
    fan --> test_d[test_d]
    fan --> test_e[test_e]

    test_a --> merge{merge}
    test_b --> merge
    test_c --> merge
    test_d --> merge
    test_e --> merge

    merge -->|bugs found| fix[fix]
    fix --> test_plan
    merge -->|all pass| harden[harden]

    harden -->|more to test| test_plan
    harden -->|exhausted 8+ rounds| security_audit[security_audit]

    security_audit -->|issues| security_fix[security_fix]
    security_fix --> security_audit
    security_audit -->|clean| wrapup[wrapup]

    wrapup --> exit((exit))
```

**Phases:**
1. **Plan + Audit** -- break spec into implementation phases, verify completeness
2. **Implement + Review** -- build in batches of 3 phases, diff-based code review
3. **Test (x5 parallel)** -- 5 agents test concurrently with distinct focus areas
4. **Harden** -- escalate test difficulty across 11+ round categories, loop back to testing
5. **Security Audit** -- OWASP-style review of the full codebase
6. **Wrapup** -- final validation and summary

## Docs

- [SPEC.md](SPEC.md) -- full app specification (data models, API, screens)
