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

## Transport

**Default: Unix domain sockets** (not HTTP).

```
~/.the-oracle/sockets/{oracle-name}.sock
```

Unix domain sockets eliminate DNS rebinding, CORS attacks, and port scanning — the three most exploited attack vectors against localhost services (CVE-2025-49596, CVE-2025-52882, CVE-2025-66414).

HTTP transport is available as opt-in for cross-machine scenarios, with mandatory mTLS and randomized ports (never predictable ranges).

## Security Model

See [SECURITY_THREAT_MODEL.md](../internal/SECURITY_THREAT_MODEL.md) for the full 24-threat analysis.

### Non-Negotiable Constraints

1. **Authentication on every request** — Random bearer token generated at startup, stored with 0600 permissions. Required even on localhost. No "trust the local machine" — the machine runs npm scripts, browser extensions, and untrusted code.

2. **Read-only cross-project queries** — Enforced at the protocol level. Adapters ONLY invoke read tools (Read, Glob, Grep). No Bash, Write, or Edit. This is a hard constraint, not configurable.

3. **Secrets deny-list** — Hardcoded, non-overridable list of files NEVER read in cross-project queries: `.env*`, `*.pem`, `*.key`, SSH keys, cloud credentials. Users can ADD patterns via `.oracleignore` but cannot remove the hardcoded list.

4. **No transitive routing** — Queries go to direct peers only (1 hop). Oracle never forwards to its own peers on behalf of a remote requester.

5. **Context isolation** — Each peer query runs in an isolated adapter session. Results from one peer are never shared with queries to another peer.

6. **Tool description sanitization** — All tool descriptions from peer oracles are stripped to a normalized schema. No free-text descriptions cross the trust boundary (prevents tool poisoning attacks).

7. **No shell interpolation** — All CLI delegation uses `execFile`/`spawn` with argument arrays. Never `exec` with string concatenation.

### Adapter Security

- Claude adapter runs with `--allowedTools "Read,Glob,Grep"` and `--bare` mode for cross-project queries
- Codex adapter uses most restrictive approval mode
- Adapters spawn in isolated sessions per cross-project query (no state leakage)
- Third-party adapters must pass a capability audit before being listed in the official registry
