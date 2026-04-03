# Implementation Plan (Internal)

> Step-by-step execution plan for Phase 1. Each step has exact file paths, code patterns,
> dependencies, and verification commands. No research needed — everything is in TECHNICAL_REFERENCE.md.

## Execution Order

Phase 1 is split into **4 sprints** with clear gates between them. Each sprint produces
a working, testable increment.

---

## Sprint 1: Security Foundation + Infrastructure

**Goal**: Auth, secrets deny-list, registry, and knowledge store — the boring stuff that must exist before anything else.

### Step 1.1: Auth Token System (F-006)

**Files to create:**
```
packages/core/src/auth/
├── token.ts          # generateToken(), saveToken(), loadToken()
└── middleware.ts     # verifyRequest() — checks Authorization header
```

**Implementation:**
- `generateToken()`: `randomBytes(32).toString('hex')` → 64 hex chars
- `saveToken(name)`: writes to `~/.the-oracle/auth/{name}.token` with 0600 perms
- `loadToken(name)`: reads token file, returns string
- `verifyRequest(req, storedToken)`: extracts `Authorization: Bearer <token>`, uses `timingSafeEqual`
- Directory `~/.the-oracle/auth/` created with 0700 perms

**Dependencies**: None (all `node:crypto`, `node:fs`)

**Verify:**
```bash
npx vitest run packages/core/src/auth/
```

**Tests** (`packages/core/src/auth/token.test.ts`):
- Token is 64 hex chars
- Token file has 0600 permissions
- `verifyRequest` returns true for valid token
- `verifyRequest` returns false for invalid token
- `verifyRequest` returns false for missing header
- Timing-safe comparison (no early exit on mismatch)

### Step 1.2: Secrets Deny-List (F-007)

**Files to create:**
```
packages/core/src/security/
├── secrets-denylist.ts    # DENIED_PATTERNS, isSecretFile(), loadOracleIgnore()
└── response-sanitizer.ts  # sanitizeResponse() — strips API keys, tokens, passwords
```

**Implementation:**
- `DENIED_PATTERNS`: hardcoded array of glob patterns:
  ```
  .env, .env.*, *.pem, *.key, *.p12, *.pfx, id_rsa*, id_ed25519*,
  id_ecdsa*, *.pub (SSH), credentials.json, service-account*.json,
  .aws/*, .ssh/*, .git/config, .npmrc, .pypirc, secrets.*, *.secret,
  .netrc, .docker/config.json, kubeconfig, *.keystore
  ```
- `isSecretFile(filePath)`: checks against DENIED_PATTERNS + `.oracleignore`
- `loadOracleIgnore(projectPath)`: parses `.oracleignore` file (gitignore format), merges with hardcoded list
- `sanitizeResponse(text)`: regex scan for patterns matching:
  - API keys (`sk-...`, `pk_...`, `AKIA...`, `ghp_...`, `ghs_...`, `glpat-...`)
  - Tokens (JWT `eyJ...`, base64 blocks > 40 chars)
  - Private keys (`-----BEGIN .* PRIVATE KEY-----`)
  - Connection strings (`://user:pass@`, `password=...`)
  - Replaces matches with `[REDACTED]`

**Dependencies**: None

**Verify:**
```bash
npx vitest run packages/core/src/security/
```

**Tests:**
- All hardcoded patterns matched correctly
- `.oracleignore` patterns merged (add only, never remove hardcoded)
- `sanitizeResponse` catches AWS keys, GitHub tokens, JWTs, private keys
- `sanitizeResponse` doesn't redact normal code

### Step 1.3: Registry (F-004)

**Files to create:**
```
packages/core/src/registry/
├── registry.ts       # register(), deregister(), list(), findPeer()
└── types.ts          # RegistryEntry interface
```

**Implementation:**
- Registry file: `~/.the-oracle/registry.json` with 0600 perms
- Schema:
  ```json
  {
    "oracles": [{
      "name": "project-name",
      "path": "/absolute/path/to/project",
      "socketPath": "~/.the-oracle/sockets/project-name.sock",
      "adapters": ["claude"],
      "pid": 12345,
      "startedAt": "2026-04-03T10:00:00Z",
      "authToken": "hex-token"
    }]
  }
  ```
- `register(entry)`: adds to registry, atomic write (write tmp + rename)
- `deregister(name)`: removes from registry
- `list()`: returns all entries, filters out stale (socket doesn't exist)
- `findPeer(name)`: returns entry or null
- File locking: use `proper-lockfile` or simple atomic rename

**Dependencies**: None (atomic write via `writeFileSync` + `renameSync`)

**Verify:**
```bash
npx vitest run packages/core/src/registry/
```

### Step 1.4: Knowledge Store (F-005)

**Files to create:**
```
packages/core/src/store/
├── knowledge-store.ts  # KnowledgeStore class
└── schema.ts           # SQL schema + prepared statements
```

**Implementation:**
- SQLite file: `~/.the-oracle/cache/{project-name}.db` with 0600 perms
- Pragmas: WAL, busy_timeout=5000, synchronous=NORMAL, foreign_keys=ON
- Tables:
  ```sql
  CREATE TABLE knowledge_cache (
    key         TEXT PRIMARY KEY,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    confidence  TEXT NOT NULL DEFAULT 'medium',
    sources     TEXT,           -- JSON array
    adapter     TEXT NOT NULL,
    hit_count   INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at  INTEGER NOT NULL,
    last_hit_at INTEGER
  );
  CREATE INDEX idx_cache_expires ON knowledge_cache(expires_at);

  CREATE TABLE project_meta (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  ```
- Key generation: SHA-256 hash of `question + scope`
- TTL: 3600s default for local queries, 300s for cross-project
- Methods: `get(key)`, `set(key, result, ttl)`, `purgeExpired()`, `clear()`, `stats()`
- `get()` uses a transaction: read + increment hit_count atomically

**Dependencies**: `better-sqlite3` (already declared)

**Verify:**
```bash
npx vitest run packages/core/src/store/
```

---

## Sprint 2: MCP Server + Router

**Goal**: Oracle daemon that listens on Unix socket, exposes MCP tools, routes queries.

### Step 2.1: Unix Socket Transport (F-002 part 1)

**Files to create:**
```
packages/core/src/transport/
├── unix-socket-server.ts   # UnixSocketServerTransport implements MCP Transport
└── unix-socket-client.ts   # UnixSocketClientTransport for connecting to peers
```

**Implementation:**
- Implements MCP SDK's `Transport` interface
- JSON-RPC 2.0 framing: `Content-Length: N\r\n\r\nJSON`
- Server: `net.createServer()`, single client connection at a time (queue others)
- Client: `net.createConnection()`, reconnection with backoff
- Socket path: `~/.the-oracle/sockets/{name}.sock`
- Stale socket cleanup on startup
- Permissions: `readableAll: false, writableAll: false`

**Dependencies**: `@modelcontextprotocol/sdk` (Transport interface)

**Verify:**
```bash
npx vitest run packages/core/src/transport/
```

**Tests:**
- Server starts and creates socket file
- Client connects and sends JSON-RPC message
- Server receives and responds
- Stale socket cleaned up on restart
- Auth token validated on connection

### Step 2.2: Oracle Router (F-002 part 2)

**Files to create:**
```
packages/core/src/router/
├── router.ts      # OracleRouter — receives queries, delegates to adapter or peer
└── adapter-manager.ts  # Loads, detects, and manages available adapters
```

**Implementation:**
- `OracleRouter`:
  - `handleLocalQuery(request)`: checks cache → calls adapter → caches result → sanitizes → returns
  - `handlePeerQuery(peerName, request)`: looks up peer in registry → connects via Unix socket → calls `oracle_ask` → returns (no forwarding — 1 hop only)
  - Adapter selection: uses first detected adapter (priority: claude > codex > gemini > openclaw)
- `AdapterManager`:
  - `detectAdapters()`: runs `detect()` on all registered adapters
  - `getAdapter(name?)`: returns specific or best available
  - `registerAdapter(adapter)`: adds to list

**Dependencies**: Auth middleware, Knowledge Store, Registry, Secrets Denylist

**Verify:**
```bash
npx vitest run packages/core/src/router/
```

### Step 2.3: MCP Tools (F-003)

**Files to create:**
```
packages/core/src/tools/
├── oracle-ask.ts         # oracle_ask tool
├── oracle-search.ts      # oracle_search tool
├── oracle-ask-peer.ts    # oracle_ask_peer tool
├── oracle-list-peers.ts  # oracle_list_peers tool
├── oracle-status.ts      # oracle_status tool
└── register-tools.ts     # registers all tools on McpServer
```

**Implementation:**

| Tool | Input | Output | Description |
|------|-------|--------|-------------|
| `oracle_ask` | `{ question, scope? }` | `{ answer, confidence, sources, cached }` | Query this project |
| `oracle_search` | `{ pattern, glob?, scope? }` | `{ matches: [{ file, line, text }] }` | Search this project's code |
| `oracle_ask_peer` | `{ peer, question, scope? }` | `{ answer, confidence, sources, peer }` | Query a peer oracle |
| `oracle_list_peers` | `{}` | `{ peers: [{ name, path, adapters, status }] }` | List connected peers |
| `oracle_status` | `{}` | `{ name, uptime, adapters, peers, cache_stats }` | Oracle health |

- All tools use `zod` for input schema
- All tools annotated with `readOnlyHint: true`
- `oracle_ask_peer` enforces 1-hop limit (never forwards to peer's peers)
- Response from `oracle_ask_peer` passes through `sanitizeResponse()`

**Dependencies**: `zod`, MCP SDK, Router

### Step 2.4: Daemon Server (F-002 complete)

**Files to create:**
```
packages/core/src/server/
├── daemon.ts        # startDaemon() — ties everything together
└── health.ts        # health check endpoint
```

**Implementation:**
- `startDaemon(config)`:
  1. Check if already running (`isDaemonRunning`)
  2. Load/generate auth token
  3. Open knowledge store
  4. Create MCP server + register tools
  5. Create Unix socket transport
  6. Connect MCP server to transport
  7. Register in registry
  8. Setup graceful shutdown (SIGINT, SIGTERM)
  9. Log startup info

**Dependencies**: All Sprint 1 + Sprint 2 components

**Verify**: Manual test — start daemon, verify socket exists, query via `curl --unix-socket`

---

## Sprint 3: CLI + Adapters

**Goal**: `the-oracle` CLI commands + Claude and Codex adapters that actually work.

### Step 3.1: CLI Entry Point (F-001)

**Files to create:**
```
packages/core/src/cli/
├── index.ts         # Commander program with all subcommands
├── init.ts          # the-oracle init
├── serve.ts         # the-oracle serve
├── ask.ts           # the-oracle ask <question>
├── peer.ts          # the-oracle peer add/list/remove
├── status.ts        # the-oracle status
└── stop.ts          # the-oracle stop
```

**Commands:**

| Command | Action |
|---------|--------|
| `the-oracle init` | Detect CLI tools, create `oracle.json` config in project, add `.the-oracle/` to `.gitignore` |
| `the-oracle serve` | Start daemon (foreground by default) |
| `the-oracle ask <question>` | Query this project's oracle (starts daemon if not running) |
| `the-oracle ask --peer <name> <question>` | Query a peer oracle |
| `the-oracle peer add <path>` | Register a project as a peer |
| `the-oracle peer list` | List registered peers and their status |
| `the-oracle peer remove <name>` | Remove a peer |
| `the-oracle status` | Show daemon status, adapters, peers, cache stats |
| `the-oracle stop` | Stop the daemon gracefully |
| `the-oracle cache clear` | Purge knowledge cache |

**Configuration file** (`oracle.json` in project root):
```json
{
  "name": "my-project",
  "adapters": ["claude"],
  "peers": [
    { "name": "my-backend", "path": "../my-backend" }
  ],
  "cache": {
    "localTtl": 3600,
    "crossProjectTtl": 300
  }
}
```

**Verify:**
```bash
npx turbo build
node packages/core/dist/cli.js --help
node packages/core/dist/cli.js init
node packages/core/dist/cli.js serve
```

### Step 3.2: Claude Adapter (F-010)

**Files to create:**
```
packages/adapter-claude/src/
├── index.ts              # export { ClaudeAdapter }
├── claude-adapter.ts     # Full implementation
└── detect.ts             # Detection logic
```

**Implementation:**

`detect()`:
```typescript
import { execFile } from 'node:child_process';
// Run: which claude
// Returns true if exit code 0
```

`query(request)`:
```typescript
// Spawn: claude -p <question> --output-format json --allowedTools Read Glob Grep --max-turns 3 --bare
// CWD: project path
// Parse JSON response
// Extract: result, session_id, usage
// Return: { answer: result, confidence: inferConfidence(usage), sources: [], adapter: 'claude', cached: false, cost: usage }
```

- Always uses `--bare` for cross-project queries (skip target project's CLAUDE.md)
- Always uses `--allowedTools Read Glob Grep` (read-only enforcement)
- Uses `execFile` (NEVER `exec`)
- Timeout: 60 seconds
- If Claude not found, `detect()` returns false

**Verify:**
```bash
npx vitest run packages/adapter-claude/src/
# Manual: node -e "const {ClaudeAdapter} = require('./dist'); new ClaudeAdapter().detect().then(console.log)"
```

### Step 3.3: Codex Adapter (F-011)

**Files to create:**
```
packages/adapter-codex/src/
├── index.ts            # export { CodexAdapter }
├── codex-adapter.ts    # Full implementation
└── detect.ts           # Detection logic
```

**Implementation:**

`detect()`:
```typescript
// Run: which codex
// Returns true if exit code 0
```

`query(request)`:
```typescript
// Spawn: codex exec --json --sandbox read-only --ask-for-approval never --ephemeral --cd <projectPath> -
// Pipe question to stdin
// Parse JSONL events
// Extract text from message.output_text.done event
// Return: { answer, confidence, sources: [], adapter: 'codex', cached: false }
```

- Always uses `--sandbox read-only` (read-only enforcement)
- Always uses `--ephemeral` (no session state leakage)
- Uses `spawn` with argument arrays (NEVER exec)
- Timeout: 60 seconds

**Verify:**
```bash
npx vitest run packages/adapter-codex/src/
```

---

## Sprint 4: Integration + Polish

**Goal**: End-to-end working, build pipeline, initial tests.

### Step 4.1: Build Pipeline (F-013)

**Files to modify/create:**
```
packages/core/src/index.ts          # Re-export everything
packages/core/src/cli.ts            # CLI entry point (bin)
tsconfig.json (each package)        # Verify builds
```

**Verify:**
```bash
npx turbo build                     # All packages compile
npx turbo test                      # All tests pass
npx turbo lint                      # All lint passes
node packages/core/dist/cli.js --version
```

### Step 4.2: .oracleignore Support (F-009)

**Files to create:**
```
packages/core/src/security/oracle-ignore.ts  # Parse .oracleignore, merge with denylist
```

**Implementation:**
- Gitignore-compatible format
- Merged with hardcoded deny-list (additive only)
- Loaded from project root when adapter processes a query

### Step 4.3: Response Sanitization Middleware (F-008)

Already implemented in Step 1.2 (`response-sanitizer.ts`). In this step:
- Wire it into the Router (after adapter returns, before caching)
- Wire it into `oracle_ask_peer` tool (after peer returns)
- Add test with realistic payloads (API keys in code snippets, etc.)

### Step 4.4: End-to-End Integration Test (F-012)

**Files to create:**
```
packages/core/src/__tests__/
├── e2e-local-query.test.ts     # Start daemon, query locally, verify response
├── e2e-peer-query.test.ts      # Start 2 daemons, query across projects
└── e2e-security.test.ts        # Verify secrets blocked, auth enforced, sanitization works
```

**Test scenarios:**
1. Start oracle in project A → ask "What files are in src/" → get answer
2. Start oracle in project A and B → A asks B a question → gets answer
3. Query without auth token → rejected
4. Query that would read .env → blocked
5. Response containing API key patterns → redacted
6. Query to non-existent peer → clear error
7. Stop daemon → socket cleaned up, registry updated

**Note**: E2E tests need mock adapters (don't require real Claude/Codex installed):

```typescript
class MockAdapter implements OracleAdapter {
  readonly name = 'mock';
  async detect() { return true; }
  async query(req: QueryRequest) {
    return { answer: `Mock answer for: ${req.question}`, confidence: 'high' as const,
             adapter: 'mock', cached: false };
  }
  capabilities() {
    return { canSearch: true, canExecute: false, canStream: false,
             persistent: false, supportedScopes: ['general'] as const };
  }
}
```

---

## File Manifest (Phase 1 Complete)

After all 4 sprints, the `packages/core/src/` tree should be:

```
packages/core/src/
├── index.ts
├── cli.ts                          # bin entry point
├── types.ts                        # (exists) OracleAdapter, QueryRequest, etc.
├── config.ts                       # (exists) OracleConfig, PeerConfig, etc.
├── auth/
│   ├── token.ts
│   ├── middleware.ts
│   └── token.test.ts
├── security/
│   ├── secrets-denylist.ts
│   ├── response-sanitizer.ts
│   ├── oracle-ignore.ts
│   ├── secrets-denylist.test.ts
│   └── response-sanitizer.test.ts
├── registry/
│   ├── registry.ts
│   ├── types.ts
│   └── registry.test.ts
├── store/
│   ├── knowledge-store.ts
│   ├── schema.ts
│   └── knowledge-store.test.ts
├── transport/
│   ├── unix-socket-server.ts
│   ├── unix-socket-client.ts
│   └── unix-socket.test.ts
├── router/
│   ├── router.ts
│   ├── adapter-manager.ts
│   └── router.test.ts
├── tools/
│   ├── oracle-ask.ts
│   ├── oracle-search.ts
│   ├── oracle-ask-peer.ts
│   ├── oracle-list-peers.ts
│   ├── oracle-status.ts
│   └── register-tools.ts
├── server/
│   ├── daemon.ts
│   └── health.ts
├── cli/
│   ├── index.ts
│   ├── init.ts
│   ├── serve.ts
│   ├── ask.ts
│   ├── peer.ts
│   ├── status.ts
│   └── stop.ts
└── __tests__/
    ├── e2e-local-query.test.ts
    ├── e2e-peer-query.test.ts
    └── e2e-security.test.ts
```

Adapters remain minimal:
```
packages/adapter-claude/src/
├── index.ts
├── claude-adapter.ts
├── detect.ts
└── claude-adapter.test.ts

packages/adapter-codex/src/
├── index.ts
├── codex-adapter.ts
├── detect.ts
└── codex-adapter.test.ts
```

---

## Sprint Sequence & Gates

```
Sprint 1 (Security Foundation)
  ├── 1.1 Auth Token System
  ├── 1.2 Secrets Deny-List
  ├── 1.3 Registry
  └── 1.4 Knowledge Store
  GATE: All unit tests pass, no external dependencies beyond better-sqlite3

Sprint 2 (MCP Server)
  ├── 2.1 Unix Socket Transport
  ├── 2.2 Oracle Router
  ├── 2.3 MCP Tools
  └── 2.4 Daemon Server
  GATE: Daemon starts, socket exists, MCP tools callable via test client

Sprint 3 (CLI + Adapters)
  ├── 3.1 CLI Entry Point
  ├── 3.2 Claude Adapter
  └── 3.3 Codex Adapter
  GATE: `the-oracle init && the-oracle serve` works, `the-oracle ask` returns answer

Sprint 4 (Integration)
  ├── 4.1 Build Pipeline
  ├── 4.2 .oracleignore Support
  ├── 4.3 Response Sanitization Wiring
  └── 4.4 End-to-End Tests
  GATE: All E2E tests pass, `npx turbo build && npx turbo test` green
```

---

## Dependency Graph

```
                    ┌──────────────┐
                    │   types.ts   │
                    │  config.ts   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  auth/   │ │security/ │ │ registry/│
        │  token   │ │ denylist │ │ registry │
        └────┬─────┘ │sanitizer│ └────┬─────┘
             │       └────┬─────┘      │
             │            │            │
             └────────────┼────────────┘
                          ▼
                   ┌──────────────┐
                   │   store/     │
                   │  knowledge   │
                   └──────┬───────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │transport/│ │ router/  │ │  tools/  │
        │  unix    │ │  router  │ │ mcp tools│
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
                          ▼
                   ┌──────────────┐
                   │   server/    │
                   │   daemon     │
                   └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │    cli/      │
                   │  commands    │
                   └──────────────┘

        ┌─────────────────────────────────┐
        │         adapter-claude          │
        │         adapter-codex           │
        │     (plug into router via       │
        │      AdapterManager)            │
        └─────────────────────────────────┘
```

---

## Estimated Scope

| Sprint | Files | Lines (est.) | Tests |
|--------|-------|-------------|-------|
| Sprint 1 | ~10 | ~500 | ~25 |
| Sprint 2 | ~12 | ~700 | ~20 |
| Sprint 3 | ~12 | ~600 | ~15 |
| Sprint 4 | ~6 | ~400 | ~12 |
| **Total** | **~40** | **~2,200** | **~72** |
