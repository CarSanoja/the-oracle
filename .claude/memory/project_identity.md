---
name: Project Identity
description: The Oracle — cross-project cross-CLI AI communication layer, TypeScript monorepo
type: project
---

**The Oracle** is an open-source package that lets AI coding assistants talk to each other across projects and CLI tools.

**Stack**: TypeScript, Node.js 18+, Turborepo monorepo, MCP (Model Context Protocol), SQLite, Vitest

**Packages**:
- `@the-oracle/core` — Router, registry, MCP server, knowledge store, CLI
- `@the-oracle/adapter-claude` — Claude Code (`claude mcp serve`)
- `@the-oracle/adapter-codex` — Codex CLI (`codex mcp-server`)
- `@the-oracle/adapter-gemini` — Gemini CLI (REST wrapper)
- `@the-oracle/adapter-openclaw` — OpenClaw (native daemon + MCP)

**Why:** AI assistants are project-scoped and can't query each other. Developers copy-paste context between terminals.

**How to apply:** All code decisions should prioritize security, minimal dependencies, and adapter extensibility. The package must be installable with zero config (`npx the-oracle init`).
