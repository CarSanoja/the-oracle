# Research & Justification (Internal)

> This document is internal context for maintainers. Not published.

## Origin

The idea emerged from operating 3 interconnected projects (backend, frontend, admin) where AI assistants in each project had zero visibility into the others. Developers constantly copy-pasted API schemas, endpoint docs, and type definitions between terminals running different AI tools.

## Problem Statement

AI coding assistants (Claude Code, Codex CLI, Gemini CLI, OpenClaw) are project-scoped. They understand the codebase they're running in, but have no mechanism to query other projects in the same ecosystem. This creates:

1. **Context silos** — frontend AI doesn't know backend API contracts
2. **Redundant analysis** — each AI re-discovers patterns the other already mapped
3. **Copy-paste tax** — developers become the bridge between their own tools
4. **CLI lock-in** — no interop between Claude, Codex, Gemini, OpenClaw

## Technical Landscape (April 2026)

### CLI Tools with MCP Server Mode

| Tool | MCP Server | Command | Exposed Tools |
|------|-----------|---------|---------------|
| Claude Code | Yes | `claude mcp serve` | Bash, Read, Write, Edit, Glob, Grep, dispatch_agent |
| Codex CLI | Yes | `codex mcp-server` | `codex()`, `codex-reply()` (stateful sessions) |
| Gemini CLI | No | — | REST API only |
| OpenClaw | Yes | Native MCP support | 500+ MCP servers, 26+ tools, 53+ skills |

### Claude Code Programmatic Modes

- `-p` flag: non-interactive pipe mode, JSON output, session resumption
- Agent SDK: Python + TypeScript, full tool access, async streaming
- `claude mcp serve`: exposes Claude as MCP server over stdio

### Codex CLI Programmatic Modes

- `codex exec`: non-interactive, `--json` output, session resumption
- `codex mcp-server`: MCP over stdio, stateful sessions
- `@openai/codex-sdk`: TypeScript SDK with thread management

### OpenClaw Differentiators

- 247k+ GitHub stars in 60 days (Jan-Mar 2026)
- **Daemon model**: runs persistently, not just CLI invocations
- **Multi-channel**: WhatsApp, Slack, Telegram, Discord, Signal, Teams
- **LLM-agnostic**: can use Claude, GPT, DeepSeek, Llama, any model
- **NemoClaw** (Nvidia): security sandboxing add-on for skill vetting
- Perfect as default runtime for users without paid API keys

### Relevant Protocols

| Protocol | Purpose | Creator | Best For |
|----------|---------|---------|----------|
| MCP | Agent-to-tool | Anthropic | Connecting agents to tools/data (our primary protocol) |
| A2A | Agent-to-agent | Google | Agent discovery and delegation (future consideration) |
| ACP | Agent-to-agent | IBM | Sync/async agent interactions |

All three are now under the Linux Foundation's Agentic AI Foundation (AAIF).

## Why This Doesn't Exist Yet

- MCP is tool-centric (agent → tool), not agent-centric (agent → agent)
- Each CLI vendor optimizes for their own ecosystem
- Cross-project is a workflow problem, not a protocol problem — needs an opinionated layer on top
- The "shared SQLite bridge" pattern (proven in our Quanta projects) hasn't been generalized

## Market Opportunity

- Every team using 2+ AI tools across 2+ repos has this problem
- No existing solution — closest are: Repomix (static export), claude-context (vector search), ai-cli-mcp (multi-CLI but single-project)
- MCP adoption is exploding (400+ community servers, native in Claude/Codex/OpenClaw)
- Developer tooling open-source has strong adoption curves (see: Turborepo, Biome, Bun)

## Competitive Landscape

| Tool | What It Does | What It Doesn't Do |
|------|-------------|-------------------|
| Repomix | Packs repo into AI-friendly file | No live queries, no cross-project |
| claude-context | Vector search over codebase | Single project, Claude-only |
| ai-cli-mcp | Run Claude/Codex/Gemini from one session | Single project, no project awareness |
| codex-mcp-server | Expose Codex as MCP server | Single project, Codex-only |
| quanta-bridge | Shared SQLite spec system | Project-specific, not generalizable as-is |
| **the-oracle** | Cross-project, cross-CLI queryable oracles | **What we're building** |
