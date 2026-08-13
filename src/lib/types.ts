export type VaultItemType = 'file' | 'directory';

export interface VaultItem {
  name: string;
  path: string; // e.g. "/notes/math.md"
  kind: VaultItemType;
  size?: number;
  lastModified?: number;
  children?: VaultItem[];
}

export interface VaultStats {
  totalFiles: number;
  totalDirectories: number;
  estimatedUsage?: number;
  estimatedQuota?: number;
}
