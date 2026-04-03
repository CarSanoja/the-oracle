# The Oracle

Cross-project, cross-CLI AI communication layer. Open-source TypeScript monorepo.

## Stack

- **Runtime**: Node.js 18+ (TypeScript strict)
- **Protocol**: MCP (Model Context Protocol) — Unix domain sockets (default) + Streamable HTTP (opt-in)
- **Storage**: SQLite (per-project knowledge cache)
- **Monorepo**: Turborepo
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## Commands

```bash
npm install          # Install all dependencies
npx turbo build      # Build all packages
npx turbo test       # Run all tests
npx turbo lint       # Lint all packages
```

## Package Structure

```
packages/
├── core/              # Router, registry, MCP server, knowledge store, CLI
├── adapter-claude/    # Claude Code (claude -p with --allowedTools)
├── adapter-codex/     # Codex CLI (codex exec)
├── adapter-gemini/    # Gemini CLI (REST wrapper)
└── adapter-openclaw/  # OpenClaw (native daemon + MCP)
```

## Conventions

- TypeScript strict mode, no `any` — use `unknown` and narrow
- Max ~200 lines per file
- One export per file when possible
- Conventional Commits
- Tests next to source files (`*.test.ts`)
- All adapters implement `OracleAdapter` from `@the-oracle/core`
- NEVER use `child_process.exec()` — always `execFile()` or `spawn()` with argument arrays
- NEVER use string interpolation for shell commands

## Security (Non-Negotiable)

These are binding architectural decisions. See `docs/internal/SECURITY_THREAT_MODEL.md` for the full 24-threat analysis.

1. **Unix domain sockets** as default transport (not HTTP) — eliminates DNS rebinding
2. **Auth on every request** — random bearer token, even localhost
3. **Cross-project = read-only** at protocol level — no Bash/Write/Edit in cross-project queries
4. **Secrets deny-list** hardcoded — `.env*`, `*.pem`, `*.key`, SSH keys, cloud creds
5. **No transitive routing** — 1 hop max between peers
6. **Context isolation** — ephemeral sessions per cross-project query
7. **Tool description sanitization** — no free-text from peer oracles
8. **No shell interpolation** — `execFile`/`spawn` only

## Key Concepts

- **Oracle**: An MCP server running in a project, making it queryable
- **Adapter**: Bridge between Oracle core and a specific CLI tool
- **Peer**: Another Oracle instance (another project) that this one can query
- **Registry**: `~/.the-oracle/registry.json` (0600 perms) tracking active oracles
- **Knowledge Store**: SQLite cache of project analysis results (TTL-based)
- **Secrets Deny-List**: Hardcoded file patterns never read in cross-project queries

## MCP Memory

Project memory DB at `.claude/memory.db`. Memory files at `.claude/memory/`. Index at `.claude/memory/MEMORY.md`.

Entity types: feature, bug, decision, implementation, improvement, context.

Roadmap tracking: each Phase 1 task has a feature ID (F-001 through F-013) tracked in `roadmap_phase1.md`.
