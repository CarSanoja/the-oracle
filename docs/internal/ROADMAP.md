# Roadmap (Internal)

> This document is internal context for maintainers. Not published.

## Phase 1 — Proof of Concept

**Goal**: Two projects can query each other via MCP.

- [ ] `@the-oracle/core`: CLI (`init`, `serve`, `ask`, `peer add`)
- [ ] `@the-oracle/core`: MCP server (Streamable HTTP) with `ask_project`, `list_projects`, `search_code`
- [ ] `@the-oracle/core`: Registry (local file, `~/.the-oracle/registry.json`)
- [ ] `@the-oracle/core`: Knowledge store (SQLite, per-project)
- [ ] `@the-oracle/adapter-claude`: `claude mcp serve` wrapper, detection, query delegation
- [ ] `@the-oracle/adapter-codex`: `codex mcp-server` wrapper, detection, query delegation
- [ ] Integration test: Claude project asks Codex project a question

## Phase 2 — Multi-CLI Communication

- [ ] `@the-oracle/adapter-gemini`: Gemini CLI REST wrapper
- [ ] `@the-oracle/adapter-openclaw`: OpenClaw daemon bridge
- [ ] CLI-to-CLI routing: Claude asks Codex to review something
- [ ] Response caching with TTL
- [ ] Auto-detection of all installed CLI tools during `init`

## Phase 3 — Auto-Discovery & DX

- [ ] mDNS or filesystem-based auto-discovery of peers
- [ ] `the-oracle status` dashboard (which oracles are alive, latency, cache stats)
- [ ] `the-oracle watch` mode (re-index on file changes)
- [ ] Config merging with project's existing `.mcp.json`

## Phase 4 — Broadcast & Events

- [ ] Schema change notifications (broadcast to peers)
- [ ] Webhook support for CI/CD integration
- [ ] Event log for cross-project communication audit trail

## Phase 5 — Community & Ecosystem

- [ ] Adapter plugin system with npm discovery
- [ ] `the-oracle adapter create` scaffold command
- [ ] Public adapter registry
- [ ] VS Code extension (sidebar showing connected oracles)
- [ ] Web dashboard for team visibility

## Phase 6 — Network Mode (Teams)

- [ ] Remote oracles over HTTPS (not just localhost)
- [ ] Authentication (API keys, OAuth)
- [ ] Team registry (central server, optional)
- [ ] Rate limiting and cost tracking
