# Project Context (Internal)

> This document is internal context for maintainers. Not published.

## Who We Are

The Oracle was born from the Quanta team — builders of an AI-powered educational platform (quanta-core, quanta-platform, quanta-command). We run Claude Code, Codex CLI, and OpenClaw daily across 3+ repos and felt the pain of context isolation firsthand.

## Why Open Source

1. **Network effect**: The more projects have oracles, the more useful each oracle becomes
2. **Adapter ecosystem**: We can't build adapters for every CLI tool — the community can
3. **Trust**: Developers won't install a closed-source tool that reads their codebase
4. **Standard setting**: We want this to become the default way AI tools talk to each other

## Design Principles

1. **Zero friction** — `npx the-oracle init` and you're done. No accounts, no API keys for the oracle itself.
2. **Protocol-first** — MCP is the backbone. No proprietary protocols.
3. **Adapter simplicity** — Writing an adapter should take an afternoon, not a week.
4. **Local-first** — Everything runs on your machine. No cloud dependency. Network mode is opt-in.
5. **Respect existing tools** — We don't replace Claude/Codex/Gemini. We connect them.

## Naming Decision

"The Oracle" was chosen because:
- Semantically perfect: you ask it questions, it answers with deep knowledge
- Memorable and short
- Not trademarked in this context (we avoided "Oracle" alone to distance from Oracle Corp)
- CLI-friendly: `the-oracle init` reads naturally
- Language-neutral: "Oracle" is understood globally

## Key Technical Decisions

### Why MCP (not REST, not gRPC, not A2A)?

- MCP is already supported by Claude Code and Codex CLI natively
- OpenClaw has MCP integration built-in
- Streamable HTTP transport (March 2025 spec) enables network-accessible servers
- The MCP TypeScript SDK has 97M+ monthly downloads
- A2A is too heavy for our use case (agent discovery/negotiation overhead)
- REST would work but wouldn't integrate with existing MCP toolchains

### Why Monorepo?

- Adapters share the core interface types
- Version coordination between core and adapters
- Single CI pipeline
- Easier contributor experience (one clone, one install)

### Why SQLite for Knowledge Store?

- Zero dependencies
- One file per project (portable, no server)
- Good enough for caching query results
- Same pattern proven in quanta-bridge

### Why TypeScript?

- MCP SDK is TypeScript-first
- Claude Agent SDK has TS support
- Codex SDK is TypeScript
- OpenClaw ecosystem is JS/TS
- Widest contributor base for tooling projects
