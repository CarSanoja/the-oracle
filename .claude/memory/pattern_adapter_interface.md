---
name: Adapter Interface Pattern
description: OracleAdapter interface with detect/query/capabilities — all adapters implement this
type: decision
---

Every adapter implements `OracleAdapter` from `@the-oracle/core`:

```typescript
interface OracleAdapter {
  readonly name: string;
  detect(): Promise<boolean>;        // Is the CLI tool installed?
  query(request: QueryRequest): Promise<QueryResult>;  // Ask a question
  capabilities(): AdapterCapabilities;  // What can this adapter do?
  start?(): Promise<void>;           // Optional lifecycle
  stop?(): Promise<void>;
}
```

**Why:** Clean extension point. Adding a new CLI tool = one new adapter package implementing this interface. ~100 lines per adapter.

**How to apply:** New adapters go in `packages/adapter-{name}/`. Must implement detect + query + capabilities. Must enforce read-only for cross-project queries regardless of the underlying CLI tool's capabilities.
