import { create } from 'zustand';
import { VaultItem, VaultStats } from '../lib/types';
import {
  listVaultContents,
  readFileContent,
  writeFileContent,
  deleteVaultEntry,
  moveVaultEntry,
  importFiles,
  exportFileToLocal,
  getVaultStats,
} from '../lib/vault';

interface VaultState {
  items: VaultItem[];
  stats: VaultStats | null;
  activeFilePath: string | null;
  activeFileContent: string;
  isLoading: boolean;
  error: string | null;

  loadVault: () => Promise<void>;
  selectFile: (path: string) => Promise<void>;
  saveActiveFile: (content: string) => Promise<void>;
  createNewFile: (path: string, initialContent?: string) => Promise<void>;
  deleteItem: (path: string) => Promise<void>;
  moveItem: (oldPath: string, newPath: string) => Promise<void>;
  importFolderFiles: (files: FileList | File[]) => Promise<void>;
  exportFile: (path: string) => Promise<void>;
  clearError: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  items: [],
  stats: null,
  activeFilePath: null,
  activeFileContent: '',
  isLoading: false,
  error: null,

  loadVault: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await listVaultContents();
      const stats = await getVaultStats();
      set({ items, stats, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load vault contents';
      set({ error: message, isLoading: false });
    }
  },

  selectFile: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const content = await readFileContent(path);
      set({ activeFilePath: path, activeFileContent: content, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to read file: ${path}`;
      set({ error: message, isLoading: false });
    }
  },

  saveActiveFile: async (content: string) => {
    const { activeFilePath } = get();
    if (!activeFilePath) return;
    set({ isLoading: true, error: null });
    try {
      await writeFileContent(activeFilePath, content);
      set({ activeFileContent: content, isLoading: false });
      await get().loadVault();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save file';
      set({ error: message, isLoading: false });
    }
  },

  createNewFile: async (path: string, initialContent = '') => {
    set({ isLoading: true, error: null });
    try {
      await writeFileContent(path, initialContent);
      set({ isLoading: false });
      await get().loadVault();
      await get().selectFile(path);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create file';
      set({ error: message, isLoading: false });
    }
  },

  deleteItem: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteVaultEntry(path);
      const { activeFilePath } = get();
      if (activeFilePath === path || activeFilePath?.startsWith(path + '/')) {
        set({ activeFilePath: null, activeFileContent: '' });
      }
      set({ isLoading: false });
      await get().loadVault();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete item';
      set({ error: message, isLoading: false });
    }
  },

  moveItem: async (oldPath: string, newPath: string) => {
    set({ isLoading: true, error: null });
    try {
      await moveVaultEntry(oldPath, newPath);
      const { activeFilePath } = get();
      if (activeFilePath === oldPath) {
        set({ activeFilePath: newPath });
      } else if (activeFilePath?.startsWith(oldPath + '/')) {
        const subPath = activeFilePath.slice(oldPath.length);
        set({ activeFilePath: newPath + subPath });
      }
      set({ isLoading: false });
      await get().loadVault();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to move/rename item';
      set({ error: message, isLoading: false });
    }
  },

  importFolderFiles: async (files: FileList | File[]) => {
    set({ isLoading: true, error: null });
    try {
      await importFiles(files);
      set({ isLoading: false });
      await get().loadVault();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import files';
      set({ error: message, isLoading: false });
    }
  },

  exportFile: async (path: string) => {
    try {
      await exportFileToLocal(path);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export file';
      set({ error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
