import type { OracleAdapter, QueryRequest, QueryResult, AdapterCapabilities } from '@the-oracle/core';

export class ClaudeAdapter implements OracleAdapter {
  readonly name = 'claude';

  async detect(): Promise<boolean> {
    // TODO: Check if `claude` CLI is installed and accessible
    return false;
  }

  async query(_request: QueryRequest): Promise<QueryResult> {
    // TODO: Delegate to `claude mcp serve` or `claude -p`
    throw new Error('ClaudeAdapter.query() not implemented');
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
