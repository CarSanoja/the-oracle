---
name: Security Posture
description: 24 mapped threats across P0-P2, binding architectural security decisions
type: project
---

Full threat model at `docs/internal/SECURITY_THREAT_MODEL.md`.

**P0 Critical (7)**: DNS rebinding (3 real CVEs), no auth on localhost, secret exfiltration ($82k incident), Claude Bash exposure, npm supply chain (Axios attack), MCP tool poisoning (Invariant Labs), shell command injection.

**Binding decisions**:
1. Unix domain sockets as default transport (not HTTP)
2. Auth on every request (random bearer token, 0600 perms)
3. Cross-project queries = read-only at protocol level (not configurable)
4. Hardcoded secrets deny-list (users add, never remove)
5. No transitive routing (1 hop max)
6. Context isolation (ephemeral sessions per cross-project query)
7. No shell interpolation (execFile/spawn only, never exec)
8. Tool description sanitization (no free-text from peers)

**Why:** OpenClaw's skill vetting gaps led to real exploitation. MCP Inspector, Claude Code VS Code, and MCP SDK all had DNS rebinding CVEs in 2025.

**How to apply:** Every feature must be evaluated against these 24 threats. No shortcut on auth, no HTTP without mTLS, no write tools in cross-project queries.
