import type { OracleAdapter, QueryRequest, QueryResult, AdapterCapabilities } from '@the-oracle/core';

export class OpenClawAdapter implements OracleAdapter {
  readonly name = 'openclaw';

  async detect(): Promise<boolean> {
    // TODO: Check if OpenClaw daemon is running
    return false;
  }

  async query(_request: QueryRequest): Promise<QueryResult> {
    // TODO: Delegate to OpenClaw daemon via MCP
    throw new Error('OpenClawAdapter.query() not implemented');
  }

  capabilities(): AdapterCapabilities {
    return {
      canSearch: true,
      canExecute: true,
      canStream: true,
      persistent: true,
      supportedScopes: ['code', 'api', 'schema', 'pattern', 'general'],
    };
  }
}
