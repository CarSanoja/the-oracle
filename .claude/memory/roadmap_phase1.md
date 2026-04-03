---
name: Roadmap Phase 1
description: Phase 1 implementation plan — 4 sprints, 13 features, exact file paths and code patterns
type: project
---

## Phase 1 — Proof of Concept (4 Sprints)

Full plan at `docs/internal/IMPLEMENTATION_PLAN.md`.
Technical reference at `docs/internal/TECHNICAL_REFERENCE.md`.

### Sprint 1: Security Foundation

| Step | Feature | Files | Status |
|------|---------|-------|--------|
| 1.1 | F-006 Auth Token | `core/src/auth/{token,middleware}.ts` | pending |
| 1.2 | F-007 Secrets Deny-List | `core/src/security/{secrets-denylist,response-sanitizer}.ts` | pending |
| 1.3 | F-004 Registry | `core/src/registry/{registry,types}.ts` | pending |
| 1.4 | F-005 Knowledge Store | `core/src/store/{knowledge-store,schema}.ts` | pending |

**Gate**: All unit tests pass, no external deps beyond better-sqlite3.

### Sprint 2: MCP Server + Router

| Step | Feature | Files | Status |
|------|---------|-------|--------|
| 2.1 | F-002a Unix Socket Transport | `core/src/transport/{unix-socket-server,unix-socket-client}.ts` | pending |
| 2.2 | F-002b Oracle Router | `core/src/router/{router,adapter-manager}.ts` | pending |
| 2.3 | F-003 MCP Tools | `core/src/tools/{oracle-ask,oracle-search,oracle-ask-peer,oracle-list-peers,oracle-status,register-tools}.ts` | pending |
| 2.4 | F-002c Daemon Server | `core/src/server/{daemon,health}.ts` | pending |

**Gate**: Daemon starts, socket exists, MCP tools callable via test client.

### Sprint 3: CLI + Adapters

| Step | Feature | Files | Status |
|------|---------|-------|--------|
| 3.1 | F-001 CLI Entry Point | `core/src/cli/{index,init,serve,ask,peer,status,stop}.ts` | pending |
| 3.2 | F-010 Claude Adapter | `adapter-claude/src/{claude-adapter,detect}.ts` | pending |
| 3.3 | F-011 Codex Adapter | `adapter-codex/src/{codex-adapter,detect}.ts` | pending |

**Gate**: `the-oracle init && the-oracle serve` works, `the-oracle ask` returns answer.

### Sprint 4: Integration + Polish

| Step | Feature | Files | Status |
|------|---------|-------|--------|
| 4.1 | F-013 Build Pipeline | tsconfig verification, turbo build | pending |
| 4.2 | F-009 .oracleignore | `core/src/security/oracle-ignore.ts` | pending |
| 4.3 | F-008 Response Sanitization Wiring | Wire into router + peer tools | pending |
| 4.4 | F-012 E2E Tests | `core/src/__tests__/e2e-*.test.ts` | pending |

**Gate**: All E2E tests pass, `npx turbo build && npx turbo test` green.

### Implementation Order

Start Sprint 1 Step 1.1, finish it, then 1.2, etc. Sequential within sprints. No jumping ahead.

**Why:** Security foundation (Sprint 1) must exist before the server (Sprint 2) that uses it. The server must exist before the CLI (Sprint 3) that controls it. Integration tests (Sprint 4) need everything working.

**How to apply:** Open session in the-oracle project directory. Say "implement Step 1.1 — Auth Token System". The plan in `docs/internal/IMPLEMENTATION_PLAN.md` has exact file paths, code patterns, test specs, and verification commands.
