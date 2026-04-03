# Technical Reference (Internal)

> All API signatures, code patterns, and exact commands needed to implement The Oracle.
> This document eliminates the need for research during implementation.

## 1. Claude Code Programmatic Usage

### `claude -p` (Pipe Mode)

```bash
claude -p "question" --output-format json --allowedTools "Read" "Glob" "Grep" --max-turns 3
```

**Key flags:**

| Flag | Example | Purpose |
|------|---------|---------|
| `-p` | `claude -p "query"` | Non-interactive mode |
| `--output-format` | `json`, `text`, `stream-json` | Response format |
| `--allowedTools` | `"Read" "Glob" "Grep"` | Restrict to these tools only |
| `--max-turns` | `3` | Limit agentic turns |
| `--max-budget-usd` | `0.50` | Spending cap |
| `-r` / `--resume` | `"session-id"` | Resume session |
| `--bare` | (flag) | Skip CLAUDE.md, hooks, MCP — isolated mode |
| `--json-schema` | `'{"type":"object",...}'` | Structured output validation |

**JSON response schema:**
```json
{
  "result": "The text response",
  "session_id": "uuid",
  "usage": {
    "input_tokens": 1234,
    "output_tokens": 567,
    "cache_read_tokens": 0,
    "cache_creation_tokens": 0
  },
  "stop_reason": "end_turn"
}
```

**Spawning from Node.js:**
```typescript
import { execFile } from 'node:child_process';

const args = [
  '-p', question,
  '--output-format', 'json',
  '--allowedTools', 'Read', 'Glob', 'Grep',
  '--max-turns', '3',
  '--bare',
];

execFile('claude', args, { cwd: projectPath }, (err, stdout, stderr) => {
  const result = JSON.parse(stdout);
});
```

### Claude Agent SDK (TypeScript)

```bash
npm install @anthropic-ai/claude-agent-sdk
```

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = query({
  prompt: "Analyze this project's API endpoints",
  options: {
    allowedTools: ["Read", "Glob", "Grep"],
    outputFormat: "json",
    maxTurns: 3,
    bare: true,
  }
});

for await (const msg of result) {
  if (msg.type === "message") {
    console.log(msg.content);       // answer text
    console.log(msg.sessionId);     // for resumption
    console.log(msg.usage);         // token counts
  }
}
```

---

## 2. Codex CLI Programmatic Usage

### `codex exec` (Non-Interactive)

```bash
echo "question" | codex exec --json -s read-only -a never --ephemeral -C /path/to/project -
```

**Key flags:**

| Flag | Example | Purpose |
|------|---------|---------|
| `--json` | (flag) | JSONL event output |
| `-s` / `--sandbox` | `read-only` | File access restriction |
| `-a` / `--ask-for-approval` | `never` | No interactive prompts |
| `-C` / `--cd` | `/path/to/project` | Working directory |
| `--ephemeral` | (flag) | Don't persist session |
| `-m` / `--model` | `o3` | Model selection |
| `-o` / `--output-last-message` | `result.txt` | Write final answer to file |

**JSONL event types:**
```jsonl
{"type":"thread.started","thread_id":"uuid"}
{"type":"turn.started"}
{"type":"message.output_text.delta","delta":"chunk..."}
{"type":"message.output_text.done","text":"full answer"}
{"type":"turn.completed","output":[...]}
{"type":"turn.failed","error":{"message":"..."}}
```

**Spawning from Node.js:**
```typescript
import { spawn } from 'node:child_process';

const codex = spawn('codex', [
  'exec', '--json', '--sandbox', 'read-only',
  '--ask-for-approval', 'never', '--ephemeral',
  '--cd', projectPath, '-'
], { stdio: ['pipe', 'pipe', 'pipe'] });

codex.stdin.write(question + '\n');
codex.stdin.end();

let answer = '';
codex.stdout.on('data', (chunk) => {
  for (const line of chunk.toString().split('\n').filter(Boolean)) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'message.output_text.done') answer = event.text;
    } catch {}
  }
});
```

---

## 3. MCP TypeScript SDK

### Installation

```bash
npm install @modelcontextprotocol/sdk zod
```

### Creating an MCP Server with Custom Tools

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({ name: 'oracle-core', version: '0.0.1' });

server.registerTool(
  'oracle_ask',
  {
    title: 'Ask Oracle',
    description: 'Ask this project a question',
    inputSchema: z.object({
      question: z.string(),
      scope: z.enum(['code', 'api', 'schema', 'pattern', 'general']).optional(),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  async ({ question, scope }) => {
    const result = await handleQuery(question, scope);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);
```

### Unix Domain Socket Transport (Custom Implementation)

The SDK does NOT have a built-in Unix socket transport. Implement the `Transport` interface:

```typescript
import * as net from 'node:net';
import type { Transport, JSONRPCMessage } from '@modelcontextprotocol/sdk';

export class UnixSocketServerTransport implements Transport {
  private server: net.Server | null = null;
  private socket: net.Socket | null = null;
  private readBuffer = '';

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
  sessionId?: string;

  constructor(private socketPath: string) {}

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        this.socket = socket;
        socket.on('data', (chunk) => this.handleData(chunk));
        socket.on('error', (err) => this.onerror?.(err));
        socket.on('close', () => this.onclose?.());
      });
      this.server.listen(this.socketPath, () => resolve());
      this.server.on('error', reject);
    });
  }

  private handleData(chunk: Buffer): void {
    this.readBuffer += chunk.toString();
    while (true) {
      const headerEnd = this.readBuffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;
      const header = this.readBuffer.substring(0, headerEnd);
      const match = header.match(/Content-Length: (\d+)/);
      if (!match) break;
      const len = parseInt(match[1]!, 10);
      const bodyStart = headerEnd + 4;
      if (this.readBuffer.length < bodyStart + len) break;
      const body = this.readBuffer.substring(bodyStart, bodyStart + len);
      this.readBuffer = this.readBuffer.substring(bodyStart + len);
      try {
        this.onmessage?.(JSON.parse(body));
      } catch (e) {
        this.onerror?.(e as Error);
      }
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    const body = JSON.stringify(message);
    const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    this.socket?.write(frame);
  }

  async close(): Promise<void> {
    this.socket?.end();
    this.server?.close();
    this.onclose?.();
  }
}
```

### MCP Client (Connecting to Peer Oracles)

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({ name: 'oracle-peer-client', version: '0.0.1' });
// Connect via custom UnixSocketClientTransport
await client.connect(transport);

const result = await client.callTool({
  name: 'oracle_ask',
  arguments: { question: 'What does POST /api/v1/assignments expect?' },
});
```

---

## 4. Node.js Infrastructure Patterns

### Unix Domain Socket HTTP Server

```typescript
import { createServer } from 'node:http';
import { existsSync, unlinkSync } from 'node:fs';

const SOCKET_PATH = '~/.the-oracle/sockets/my-project.sock';

if (existsSync(SOCKET_PATH)) unlinkSync(SOCKET_PATH);

const server = createServer(handler);
server.listen({ path: SOCKET_PATH, readableAll: false, writableAll: false });
// readableAll: false + writableAll: false = only owner can connect (0600 equivalent)
```

### Unix Socket HTTP Client

```typescript
import { request } from 'node:http';

function queryOracle(socketPath: string, body: object): Promise<object> {
  return new Promise((resolve, reject) => {
    const req = request({ socketPath, path: '/ask', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}
```

### SQLite with better-sqlite3

```typescript
import Database from 'better-sqlite3';
import { chmodSync } from 'node:fs';

const db = new Database(dbPath);
chmodSync(dbPath, 0o600);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
```

### Auth Token Generation

```typescript
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { writeFileSync, chmodSync, mkdirSync } from 'node:fs';

function generateToken(): string {
  return randomBytes(32).toString('hex'); // 64 hex chars, 256 bits
}

function saveToken(dir: string, token: string): void {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(join(dir, 'token'), token, 'utf-8');
  chmodSync(join(dir, 'token'), 0o600);
}

function verifyToken(provided: string, stored: string): boolean {
  const a = Buffer.from(provided, 'utf-8');
  const b = Buffer.from(stored, 'utf-8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

### Process Detection (Is Daemon Running?)

```typescript
import { connect } from 'node:net';
import { existsSync } from 'node:fs';

function isDaemonRunning(socketPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!existsSync(socketPath)) { resolve(false); return; }
    const client = connect({ path: socketPath });
    client.on('connect', () => { client.destroy(); resolve(true); });
    client.on('error', () => resolve(false));
  });
}
```

### Graceful Shutdown

```typescript
function setupShutdown(server: Server, socketPath: string, db: Database): void {
  let stopping = false;
  const stop = (signal: string) => {
    if (stopping) return;
    stopping = true;
    server.close(() => {
      try { unlinkSync(socketPath); } catch {}
      db.close();
      process.exit(0);
    });
    setTimeout(() => {
      try { unlinkSync(socketPath); } catch {}
      db.close();
      process.exit(1);
    }, 5000);
  };
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));
}
```

### Commander CLI Pattern

```typescript
import { Command } from 'commander';

const program = new Command();
program.name('the-oracle').version('0.0.1');

program.command('init')
  .description('Initialize Oracle in the current project')
  .action(async () => { /* ... */ });

program.command('serve')
  .option('--foreground', 'run in foreground', false)
  .action(async (opts) => { /* ... */ });

program.command('ask <question>')
  .option('--peer <name>', 'ask a specific peer')
  .action(async (question, opts) => { /* ... */ });

program.command('peer')
  .command('add <path>')
  .action(async (path) => { /* ... */ });

program.command('status').action(async () => { /* ... */ });
program.command('stop').action(async () => { /* ... */ });

program.parse();
```

---

## 5. Dependencies Summary

### @the-oracle/core

| Package | Purpose | Why this one |
|---------|---------|-------------|
| `@modelcontextprotocol/sdk` | MCP server + client | Official SDK, required for MCP tools |
| `zod` | Schema validation | Peer dep of MCP SDK, also used for input validation |
| `better-sqlite3` | Knowledge cache | Fastest Node.js SQLite, sync API, zero deps |
| `commander` | CLI framework | Zero deps, built-in TS types, mature |

**Zero-dep from Node.js stdlib:**
- `node:http` — HTTP server on Unix sockets
- `node:net` — Socket detection, custom MCP transport
- `node:crypto` — Token generation, timing-safe comparison
- `node:fs` — File permissions, registry, token storage
- `node:child_process` — Spawning CLI tools (execFile/spawn only, NEVER exec)
- `node:path` — Path manipulation
- `node:os` — Home directory detection

### Adapters (each)

| Package | Purpose |
|---------|---------|
| `@the-oracle/core` | Shared types + adapter interface |

No additional dependencies. Adapters use `execFile`/`spawn` from `node:child_process` to invoke their respective CLI tools.
