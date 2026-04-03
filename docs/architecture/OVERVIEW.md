# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       The Oracle (per project)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐       │
│  │ Claude   │ │ Codex    │ │ Gemini   │ │  OpenClaw    │       │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │  Adapter     │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘       │
│       │    MCP     │    MCP     │   REST/MCP   │   MCP         │
│       └────────────┼────────────┼──────────────┘               │
│                    ▼                                            │
│  ┌─────────────────────────────────────────────────────┐       │
│  │                   Oracle Core                        │       │
│  │                                                      │       │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │       │
│  │  │ Router  │  │ Registry │  │ Knowledge Store   │  │       │
│  │  │         │  │          │  │ (SQLite)          │  │       │
│  │  └─────────┘  └──────────┘  └───────────────────┘  │       │
│  └─────────────────────────────────────────────────────┘       │
│                    ▼                                            │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              MCP Server (Streamable HTTP)            │       │
│  │              Exposes: ask, search, list, broadcast   │       │
│  └─────────────────────────────────────────────────────┘       │
│                    ▼                                            │
│             localhost:31XX (auto-assigned)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### Router

Receives incoming queries and decides how to handle them:

1. **Local query** — question about this project → delegate to best available adapter
2. **Peer query** — question about another project → forward to that project's oracle
3. **Broadcast** — notification to all peers → fan out to registry

### Registry

Tracks all known Oracle instances:

```json
// ~/.the-oracle/registry.json
{
  "oracles": [
    {
      "name": "my-backend",
      "path": "/home/dev/projects/my-backend",
      "port": 3100,
      "adapters": ["claude", "codex"],
      "pid": 12345,
      "started_at": "2026-04-03T10:00:00Z"
    }
  ]
}
```

- Updated on `serve` (register) and shutdown (deregister)
- Peers discovered via registry or explicit `peer add`
- Health checks remove stale entries

### Knowledge Store

Per-project SQLite database caching analysis results:

```sql
CREATE TABLE knowledge (
  id TEXT PRIMARY KEY,
  query_hash TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  adapter TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ttl_seconds INTEGER DEFAULT 3600,
  hit_count INTEGER DEFAULT 0
);

CREATE TABLE project_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

- Cache hit avoids re-querying the adapter (and burning LLM tokens)
- TTL-based expiration (configurable, default 1 hour)
- `project_meta` stores: project name, language, framework, last indexed

### Adapters

Each adapter implements:

```typescript
interface OracleAdapter {
  readonly name: string;

  detect(): Promise<boolean>;

  query(request: QueryRequest): Promise<QueryResult>;

  capabilities(): AdapterCapabilities;

  start?(): Promise<void>;

  stop?(): Promise<void>;
}

interface QueryRequest {
  question: string;
  context?: {
    requestingProject?: string;
    requestingAdapter?: string;
    scope?: 'code' | 'api' | 'schema' | 'pattern' | 'general';
  };
}

interface QueryResult {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources?: string[];
  adapter: string;
  cached: boolean;
  cost?: { inputTokens: number; outputTokens: number };
}

interface AdapterCapabilities {
  canSearch: boolean;
  canExecute: boolean;
  canStream: boolean;
  persistent: boolean;
  supportedScopes: string[];
}
```

### MCP Server

Exposed tools (callable by any MCP client):

| Tool | Description |
|------|-------------|
| `oracle_ask` | Ask this project a question |
| `oracle_search` | Search this project's code |
| `oracle_list_peers` | List connected peer oracles |
| `oracle_ask_peer` | Ask a specific peer oracle a question |
| `oracle_broadcast` | Send a notification to all peers |
| `oracle_status` | Get this oracle's status and stats |

## Communication Flow

### Project → Project Query

```
Frontend Oracle                          Backend Oracle
     │                                        │
     │  oracle_ask_peer("backend",            │
     │    "What does POST /assignments        │
     │     expect?")                          │
     │───────────── MCP HTTP ────────────────►│
     │                                        │
     │                              Router receives query
     │                              Checks knowledge cache
     │                              Cache miss → delegates
     │                              to Claude adapter
     │                                        │
     │                              Claude adapter:
     │                              claude mcp serve →
     │                              Read + Grep codebase →
     │                              returns answer
     │                                        │
     │◄──────────── QueryResult ──────────────│
     │  { answer: "POST /assignments          │
     │    expects { title, type, ... }",      │
     │    confidence: "high",                 │
     │    sources: ["schemas.py:45"] }        │
     │                                        │
     │  Cache result in knowledge store       │
```

### CLI → CLI Delegation

```
Developer using Claude Code in frontend:
  "Ask Codex to review this component"
       │
       ▼
  Oracle Router (frontend)
       │
       │ Detects: target is CLI, not project
       │ Routes to: Codex adapter
       ▼
  Codex Adapter
       │ codex mcp-server → codex() with context
       ▼
  Codex analyzes and returns review
       │
       ▼
  Response returned to Claude Code session
```

## Port Assignment

Oracles auto-assign ports starting at 3100:

- First oracle: 3100
- Second oracle: 3101
- etc.

Port conflicts are resolved by incrementing. The registry tracks which port each oracle uses.

## Security Model

- **Localhost only** by default — oracles only listen on 127.0.0.1
- **No authentication** in local mode (same machine = same trust boundary)
- **Network mode** (Phase 6) adds API key authentication
- **Adapter sandboxing** — adapters cannot access files outside their project directory
- **Read-only by default** — oracles answer questions, they don't modify code (unless explicitly enabled)
