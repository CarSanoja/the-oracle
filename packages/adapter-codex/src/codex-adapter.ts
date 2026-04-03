import type { OracleAdapter, QueryRequest, QueryResult, AdapterCapabilities } from '@the-oracle/core';

export class CodexAdapter implements OracleAdapter {
  readonly name = 'codex';

  async detect(): Promise<boolean> {
    // TODO: Check if `codex` CLI is installed and accessible
    return false;
  }

  async query(_request: QueryRequest): Promise<QueryResult> {
    // TODO: Delegate to `codex mcp-server` or `codex exec`
    throw new Error('CodexAdapter.query() not implemented');
  }

  capabilities(): AdapterCapabilities {
    return {
      canSearch: true,
      canExecute: true,
      canStream: true,
      persistent: false,
      supportedScopes: ['code', 'api', 'schema', 'pattern', 'general'],
    };
  }
}
