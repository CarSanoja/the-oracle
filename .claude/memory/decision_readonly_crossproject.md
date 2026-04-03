---
name: Read-Only Cross-Project Enforcement
description: Cross-project queries only invoke read tools — protocol-level constraint, not configurable
type: decision
---

Cross-project queries are read-only at the protocol level. Not a default. Not configurable. A hard constraint.

**Why:** Claude `mcp serve` exposes Bash, Write, Edit. A crafted cross-project query like "Run the deploy script to check" could trigger arbitrary command execution. OpenClaw had real incidents from unscoped skill execution.

**How to apply:** Adapters for cross-project queries MUST use read-only tool allowlists. Claude: `--allowedTools "Read,Glob,Grep"`. Codex: most restrictive approval mode. Response must never contain evidence of write operations. Router rejects any adapter response that indicates a write tool was invoked.
