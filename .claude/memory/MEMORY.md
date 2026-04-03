# The Oracle Memory

## Project Overview
- [Project Identity](project_identity.md) — Cross-project cross-CLI AI communication layer, TypeScript monorepo with Turborepo
- [Security Posture](project_security_posture.md) — 24 mapped threats (7 P0, 9 P1, 8 P2), Unix sockets default, mandatory auth, read-only cross-project

## Roadmap & Progress
- [Roadmap Phase 1](roadmap_phase1.md) — Core MCP server, CLI, registry, knowledge store, Claude + Codex adapters
- [Roadmap Phases 2-6](roadmap_phases_2_6.md) — Multi-CLI, auto-discovery, broadcast, community, network mode

## Architectural Decisions
- [Transport Decision](decision_unix_sockets.md) — Unix domain sockets as default (not HTTP) due to DNS rebinding CVEs
- [Auth Decision](decision_mandatory_auth.md) — Bearer token on every request, even localhost
- [Read-Only Enforcement](decision_readonly_crossproject.md) — Protocol-level, not configurable

## Key Patterns
- [Adapter Interface](pattern_adapter_interface.md) — OracleAdapter with detect/query/capabilities, implemented per CLI tool
