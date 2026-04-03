import type { OracleAdapter, QueryRequest, QueryResult, AdapterCapabilities } from '@the-oracle/core';

export class GeminiAdapter implements OracleAdapter {
  readonly name = 'gemini';

  async detect(): Promise<boolean> {
    // TODO: Check if `gemini` CLI is installed and accessible
    return false;
  }

  async query(_request: QueryRequest): Promise<QueryResult> {
    // TODO: Delegate to Gemini CLI via REST wrapper
    throw new Error('GeminiAdapter.query() not implemented');
  }

  capabilities(): AdapterCapabilities {
    return {
      canSearch: true,
      canExecute: false,
      canStream: true,
      persistent: false,
      supportedScopes: ['code', 'api', 'schema', 'general'],
    };
  }
}
