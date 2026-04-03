# The Oracle

**Cross-project, cross-CLI AI communication layer.**

The Oracle lets AI coding assistants talk to each other — across projects, across CLI tools, across LLM providers. Install it in each project and they become queryable by any other.

> *"Hey backend, what does the assignments endpoint return?"*
> — A frontend developer's AI assistant, talking to the backend's Oracle

[Leer en Español](docs/i18n/README.es.md) | [Lire en Français](docs/i18n/README.fr.md) | [Auf Deutsch lesen](docs/i18n/README.de.md) | [Ler em Português](docs/i18n/README.pt.md)

---

## The Problem

Modern teams run AI assistants in every project — Claude Code in the backend, Codex in the frontend, Gemini in mobile. But these assistants are **isolated**. They can't ask each other questions. A frontend dev's AI has no idea what the backend API returns. The backend AI doesn't know what the mobile app expects.

You end up copy-pasting context between terminals. That defeats the purpose.

## The Solution

The Oracle turns each project into a **queryable knowledge node**. Any AI assistant in any project can ask questions to any other project's Oracle — regardless of which CLI tool or LLM powers it.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Frontend   │◄──MCP──►│   Backend   │◄──MCP──►│   Mobile    │
│  (Codex)    │         │  (Claude)   │         │  (Gemini)   │
│  :3101      │         │  :3100      │         │  :3102      │
└─────────────┘         └─────────────┘         └─────────────┘
       ▲                       ▲                       ▲
       └───────────────────────┼───────────────────────┘
                               │
                    ┌──────────────────┐
                    │  Oracle Registry │
                    │  (auto-discovery)│
                    └──────────────────┘
```

## Features

- **Cross-project queries** — Ask any project about its code, APIs, schemas, patterns
- **Cross-CLI** — Works with Claude Code, Codex CLI, Gemini CLI, OpenClaw, and any future tool
- **MCP-native** — Built on the open [Model Context Protocol](https://modelcontextprotocol.io) standard
- **LLM-agnostic** — Each project can use whatever model it wants
- **Auto-discovery** — Oracles on the same machine find each other automatically
- **Zero config** — `npx the-oracle init` detects your CLI tools and sets everything up
- **Persistent daemon** — Stays alive, maintains context, caches knowledge
- **Plugin adapters** — Add support for new CLI tools with a simple adapter interface

## Quick Start

```bash
# Install in your project
npx the-oracle init

# Start the oracle
npx the-oracle serve

# Register a peer project
npx the-oracle peer add ../my-backend

# Query another project
npx the-oracle ask my-backend "What does POST /api/v1/assignments expect?"
```

### From inside your AI assistant

Once running, any MCP-compatible AI tool can query other projects:

```
You (in frontend): "Ask the backend oracle what fields the Assignment schema has"
Claude/Codex/Gemini: → queries backend oracle via MCP → returns structured answer
```

## Supported Adapters

| Adapter | CLI Tool | Mode | Status |
|---------|----------|------|--------|
| `@the-oracle/adapter-claude` | Claude Code | MCP server (`claude mcp serve`) | Planned |
| `@the-oracle/adapter-codex` | Codex CLI | MCP server (`codex mcp-server`) | Planned |
| `@the-oracle/adapter-gemini` | Gemini CLI | REST wrapper | Planned |
| `@the-oracle/adapter-openclaw` | OpenClaw | Native daemon + MCP | Planned |

Don't see your tool? [Write an adapter](docs/ADAPTERS.md) — it's ~100 lines.

## How It Works

1. **`the-oracle init`** scans your project and detects installed CLI tools
2. **`the-oracle serve`** starts an MCP server (Streamable HTTP) exposing your project as queryable
3. **Other oracles** (or any MCP client) connect and can ask questions
4. **The adapter** delegates to the best available AI tool to answer using your codebase as context
5. **Responses are cached** in a local SQLite store to avoid redundant analysis

### Communication Modes

| Mode | Description | Example |
|------|-------------|---------|
| **Project → Project** | Frontend asks backend | "What does this endpoint return?" |
| **CLI → CLI** | Claude delegates to Codex | "Review this with a different perspective" |
| **Broadcast** | Schema changed, notify all | "Assignment schema updated — fields added" |
| **Channel** | Via Slack/Discord (OpenClaw) | Dev asks from Slack, gets answer from project |

## Architecture

```
the-oracle/
├── packages/
│   ├── core/                    # Router, registry, MCP server, knowledge store
│   ├── adapter-claude/          # Claude Code integration
│   ├── adapter-codex/           # Codex CLI integration
│   ├── adapter-gemini/          # Gemini CLI integration
│   └── adapter-openclaw/        # OpenClaw integration
```

See [Architecture Overview](docs/architecture/OVERVIEW.md) for the full design.

## Contributing

We welcome contributions in any language. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) — Use it however you want.

## Acknowledgments

Built on the shoulders of:
- [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- [Claude Code](https://claude.ai/code), [Codex CLI](https://github.com/openai/codex), [Gemini CLI](https://github.com/google/gemini-cli), [OpenClaw](https://github.com/openclaw/openclaw)
