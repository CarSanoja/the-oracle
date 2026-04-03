export interface OracleConfig {
  name: string;
  port: number;
  projectPath: string;
  adapters: string[];
  peers: PeerConfig[];
}

export interface PeerConfig {
  name: string;
  url: string;
}

export interface RegistryEntry {
  name: string;
  path: string;
  port: number;
  adapters: string[];
  pid: number;
  startedAt: string;
}
