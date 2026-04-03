---
name: Roadmap Phase 1
description: Phase 1 tasks — core MCP server, CLI commands, registry, knowledge store, first adapters
type: project
---

## Phase 1 — Proof of Concept

**Goal**: Two projects can query each other via MCP over Unix domain sockets.

### Core (`@the-oracle/core`)

| Task | Status | Feature |
|------|--------|---------|
| CLI entry point (`init`, `serve`, `ask`, `peer add`, `status`, `stop`) | pending | F-001 |
| MCP server over Unix domain sockets | pending | F-002 |
| MCP tools: `oracle_ask`, `oracle_search`, `oracle_list_peers`, `oracle_ask_peer`, `oracle_status` | pending | F-003 |
| Registry (`~/.the-oracle/registry.json`, 0600 perms) | pending | F-004 |
| Knowledge store (SQLite, per-project cache with TTL) | pending | F-005 |
| Auth token generation + validation middleware | pending | F-006 |
| Secrets deny-list enforcement | pending | F-007 |
| Response sanitization middleware | pending | F-008 |
| `.oracleignore` file support | pending | F-009 |

### Adapters

| Task | Status | Feature |
|------|--------|---------|
| Claude adapter — detect + query via `claude -p` with `--allowedTools` | pending | F-010 |
| Codex adapter — detect + query via `codex exec` | pending | F-011 |

### Integration

| Task | Status | Feature |
|------|--------|---------|
| End-to-end test: Claude project asks Codex project a question | pending | F-012 |
| npm workspace build + test pipeline working | pending | F-013 |

**Why:** Phase 1 proves the core concept with real security. Everything after builds on this foundation.

**How to apply:** Implement in order: F-006 (auth) → F-007 (secrets) → F-004 (registry) → F-002 (MCP server) → F-005 (knowledge store) → F-003 (tools) → F-001 (CLI) → F-010/F-011 (adapters) → F-012 (integration test).
