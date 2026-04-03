---
name: Roadmap Phases 2-6
description: Future phases — multi-CLI, auto-discovery, broadcast, community, network mode
type: project
---

## Phase 2 — Multi-CLI Communication
- Gemini adapter (REST wrapper)
- OpenClaw adapter (daemon bridge)
- CLI-to-CLI routing
- Response caching with TTL
- Auto-detection of installed CLI tools during `init`

## Phase 3 — Auto-Discovery & DX
- Filesystem-based auto-discovery of peers
- `the-oracle status` dashboard
- `the-oracle watch` mode (re-index on file changes)
- Config merging with project's existing `.mcp.json`

## Phase 4 — Broadcast & Events
- Schema change notifications (broadcast to peers)
- Webhook support for CI/CD
- Event log for cross-project communication audit trail

## Phase 5 — Community & Ecosystem
- Adapter plugin system with npm discovery
- `the-oracle adapter create` scaffold command
- Public adapter registry
- VS Code extension
- Web dashboard

## Phase 6 — Network Mode (Teams)
- Remote oracles over HTTPS with mTLS
- API key + OAuth authentication
- Team registry (central server, optional)
- Rate limiting and cost tracking

**Why:** Phased to deliver value early (P1 = usable PoC) while building toward full vision.

**How to apply:** Do not start Phase N+1 features until Phase N is solid. Each phase has its own security review.
