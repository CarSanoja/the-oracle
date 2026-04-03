export interface QueryRequest {
  question: string;
  context?: QueryContext;
}

export interface QueryContext {
  requestingProject?: string;
  requestingAdapter?: string;
  scope?: QueryScope;
}

export type QueryScope = 'code' | 'api' | 'schema' | 'pattern' | 'general';

export interface QueryResult {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources?: string[];
  adapter: string;
  cached: boolean;
  cost?: TokenCost;
}

export interface TokenCost {
  inputTokens: number;
  outputTokens: number;
}

export interface AdapterCapabilities {
  canSearch: boolean;
  canExecute: boolean;
  canStream: boolean;
  persistent: boolean;
  supportedScopes: QueryScope[];
}

export interface OracleAdapter {
  readonly name: string;
  detect(): Promise<boolean>;
  query(request: QueryRequest): Promise<QueryResult>;
  capabilities(): AdapterCapabilities;
  start?(): Promise<void>;
  stop?(): Promise<void>;
}
