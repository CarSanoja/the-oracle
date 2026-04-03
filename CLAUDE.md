# The Oracle

Cross-project, cross-CLI AI communication layer. Open-source TypeScript monorepo.

## Stack

- **Runtime**: Node.js (TypeScript)
- **Protocol**: MCP (Model Context Protocol) — Streamable HTTP + stdio
- **Storage**: SQLite (per-project knowledge cache)
- **Monorepo**: Turborepo
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## Package Structure

```
packages/
├── core/              # Router, registry, MCP server, knowledge store, CLI
├── adapter-claude/    # Claude Code (claude mcp serve)
├── adapter-codex/     # Codex CLI (codex mcp-server)
├── adapter-gemini/    # Gemini CLI (REST wrapper)
└── adapter-openclaw/  # OpenClaw (native daemon + MCP)
```

## Conventions

- TypeScript strict mode, no `any`
- Max ~200 lines per file
- One export per file when possible
- Conventional Commits
- Tests next to source files (`*.test.ts`)
- All adapters implement the `OracleAdapter` interface from `@the-oracle/core`

## Key Concepts

- **Oracle**: An MCP server running in a project, making it queryable
- **Adapter**: Bridge between Oracle core and a specific CLI tool (Claude, Codex, etc.)
- **Peer**: Another Oracle instance (another project) that this one can query
- **Registry**: Local file tracking all active Oracles for auto-discovery
- **Knowledge Store**: SQLite cache of project analysis results
