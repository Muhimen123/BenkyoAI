'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useVaultStore } from '../../store/useVaultStore';
import { VaultItem } from '../../lib/types';

function FileTreeItem({
  item,
  onSelectFile,
  onDelete,
  onExport,
  onMove,
  activeFilePath,
}: {
  item: VaultItem;
  onSelectFile: (path: string) => void;
  onDelete: (path: string) => void;
  onExport: (path: string) => void;
  onMove: (oldPath: string, newPath: string) => void;
  activeFilePath: string | null;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const handleMovePrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPath = prompt(`Move or rename "${item.path}" to new path:`, item.path);
    if (newPath && newPath.trim() && newPath !== item.path) {
      onMove(item.path, newPath.trim());
    }
  };

  if (item.kind === 'directory') {
    return (
      <div className="pl-3 my-1">
        <div className="flex items-center justify-between group py-1 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
          <div
            className="flex items-center gap-2 font-medium text-sm text-zinc-800 dark:text-zinc-200 flex-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span>{isOpen ? '📂' : '📁'}</span>
            <span>{item.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleMovePrompt}
              className="text-xs p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
              title="Move or Rename directory"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete folder "${item.name}" and all its contents?`)) {
                  onDelete(item.path);
                }
              }}
              className="text-xs p-1 hover:bg-red-100 dark:hover:bg-red-950 rounded text-red-500"
              title="Delete directory"
            >
              🗑️
            </button>
          </div>
        </div>
        {isOpen && item.children && (
          <div className="border-l border-zinc-200 dark:border-zinc-800 ml-2 pl-2">
            {item.children.map((child) => (
              <FileTreeItem
                key={child.path}
                item={child}
                onSelectFile={onSelectFile}
                onDelete={onDelete}
                onExport={onExport}
                onMove={onMove}
                activeFilePath={activeFilePath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activeFilePath === item.path;

  return (
    <div
      onClick={() => onSelectFile(item.path)}
      className={`flex items-center justify-between group py-1 px-2 my-0.5 rounded text-sm cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-medium'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
      }`}
    >
      <div className="flex items-center gap-2 truncate flex-1">
        <span>📄</span>
        <span className="truncate">{item.name}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={handleMovePrompt}
          className="text-xs p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
          title="Move or Rename file"
        >
          ✏️
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExport(item.path);
          }}
          className="text-xs p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
          title="Export / Download"
        >
          📥
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete file "${item.name}"?`)) {
              onDelete(item.path);
            }
          }}
          className="text-xs p-1 hover:bg-red-100 dark:hover:bg-red-950 rounded text-red-500"
          title="Delete file"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default function VaultTestPage() {
  const {
    items,
    stats,
    activeFilePath,
    activeFileContent,
    isLoading,
    error,
    loadVault,
    selectFile,
    saveActiveFile,
    createNewFile,
    deleteItem,
    moveItem,
    importFolderFiles,
    exportFile,
    clearError,
  } = useVaultStore();

  const [editorContent, setEditorContent] = useState('');
  const [newFilePath, setNewFilePath] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  useEffect(() => {
    setEditorContent(activeFileContent);
  }, [activeFileContent]);

  const handleSave = async () => {
    await saveActiveFile(editorContent);
  };

  const handleCreateFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    await createNewFile(newFilePath.trim(), '# New File\n');
    setNewFilePath('');
    setShowNewFileDialog(false);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await importFolderFiles(e.target.files);
      if (e.target) e.target.value = '';
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-bold">🗄️ Default Vault & OPFS Storage Test Suite</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cross-browser local storage vault (Chrome, Firefox, Safari) using Origin Private File System (OPFS).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            ← Back to App
          </a>
          <button
            onClick={() => loadVault()}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : '🔄 Refresh Vault'}
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900 px-6 py-3 flex items-center justify-between text-red-700 dark:text-red-300">
          <span className="text-sm">⚠️ {error}</span>
          <button onClick={clearError} className="text-xs font-bold px-2 py-1 hover:bg-red-200 dark:hover:bg-red-900 rounded">
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Files</div>
            <div className="text-2xl font-bold mt-1">{stats?.totalFiles ?? 0}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Directories</div>
            <div className="text-2xl font-bold mt-1">{stats?.totalDirectories ?? 0}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Storage Usage</div>
            <div className="text-2xl font-bold mt-1">{formatBytes(stats?.estimatedUsage)}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Storage Quota</div>
            <div className="text-2xl font-bold mt-1">{formatBytes(stats?.estimatedQuota)}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFileImport}
            multiple
            // @ts-expect-error - webkitdirectory is valid for directory picking in browser inputs
            webkitdirectory=""
            directory=""
            className="hidden"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            multiple
            className="hidden"
          />

          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span>📁</span> Import Folder
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <span>📄</span> Import Files
          </button>
          <button
            onClick={() => setShowNewFileDialog(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <span>✨</span> New File
          </button>
        </div>

        {/* New File Modal */}
        {showNewFileDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handleCreateFileSubmit}
              className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col gap-4"
            >
              <h2 className="text-lg font-bold">Create New Vault File</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Enter relative path (e.g., <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">notes/biology.md</code> or <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">index.txt</code>):
              </p>
              <input
                type="text"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="path/to/file.md"
                required
                autoFocus
                className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-blue-600"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileDialog(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Split View: Tree Explorer & File Editor */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          {/* File Tree Explorer */}
          <div className="md:col-span-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Vault Explorer
            </h2>
            <div className="flex-1 overflow-y-auto max-h-[600px]">
              {items.length === 0 ? (
                <div className="text-center py-12 text-sm text-zinc-400">
                  Vault is empty.<br />Import a folder or create a file to get started.
                </div>
              ) : (
                items.map((item) => (
                  <FileTreeItem
                    key={item.path}
                    item={item}
                    onSelectFile={selectFile}
                    onDelete={deleteItem}
                    onExport={exportFile}
                    onMove={moveItem}
                    activeFilePath={activeFilePath}
                  />
                ))
              )}
            </div>
          </div>

          {/* File Editor Preview */}
          <div className="md:col-span-8 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col">
            {activeFilePath ? (
              <div className="flex flex-col h-full gap-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                    {activeFilePath}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportFile(activeFilePath)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      📥 Export
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="flex-1 font-mono text-sm p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 focus:outline-blue-600 resize-none min-h-[400px]"
                  placeholder="Type file contents here..."
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-400">
                <span className="text-4xl mb-2">👈</span>
                <p className="text-sm font-medium">Select a file from the vault explorer to view or edit</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
