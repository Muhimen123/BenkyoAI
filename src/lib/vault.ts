import { VaultItem, VaultStats } from './types';

/**
 * Get the root directory handle of the Origin Private File System (OPFS).
 */
export async function getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
  if (!navigator.storage || !navigator.storage.getDirectory) {
    throw new Error('Origin Private File System (OPFS) is not supported in this browser.');
  }
  return await navigator.storage.getDirectory();
}

/**
 * Helper to navigate or create nested directory handles from a path string (e.g. "notes/physics").
 */
async function getDirectoryHandleByPath(
  root: FileSystemDirectoryHandle,
  path: string,
  create = false
): Promise<FileSystemDirectoryHandle> {
  const segments = path.split('/').filter(Boolean);
  let currentDir = root;
  for (const segment of segments) {
    currentDir = await currentDir.getDirectoryHandle(segment, { create });
  }
  return currentDir;
}

/**
 * Split a full path into parent directory path and file/folder name.
 */
function splitPath(fullPath: string): { dirPath: string; name: string } {
  const normalized = fullPath.startsWith('/') ? fullPath.slice(1) : fullPath;
  const lastSlashIndex = normalized.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return { dirPath: '', name: normalized };
  }
  return {
    dirPath: normalized.slice(0, lastSlashIndex),
    name: normalized.slice(lastSlashIndex + 1),
  };
}

/**
 * Recursively list all contents of the OPFS vault or a subdirectory.
 */
export async function listVaultContents(
  dirHandle?: FileSystemDirectoryHandle,
  currentPath = ''
): Promise<VaultItem[]> {
  const root = dirHandle || (await getOpfsRoot());
  const items: VaultItem[] = [];

  //@ts-expect-error - entries() async iterator is standard for FileSystemDirectoryHandle
  for await (const [name, handle] of root.entries()) {
    const itemPath = currentPath ? `${currentPath}/${name}` : `/${name}`;
    if (handle.kind === 'file') {
      const fileHandle = handle as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      items.push({
        name,
        path: itemPath,
        kind: 'file',
        size: file.size,
        lastModified: file.lastModified,
      });
    } else if (handle.kind === 'directory') {
      const subDirHandle = handle as FileSystemDirectoryHandle;
      const children = await listVaultContents(subDirHandle, itemPath);
      // Sort children: directories first, then files
      children.sort((a, b) => {
        if (a.kind === b.kind) return a.name.localeCompare(b.name);
        return a.kind === 'directory' ? -1 : 1;
      });

      items.push({
        name,
        path: itemPath,
        kind: 'directory',
        children,
      });
    }
  }

  // Sort root level items
  items.sort((a, b) => {
    if (a.kind === b.kind) return a.name.localeCompare(b.name);
    return a.kind === 'directory' ? -1 : 1;
  });

  return items;
}

/**
 * Read text content of a file from the vault by its path.
 */
export async function readFileContent(path: string): Promise<string> {
  const root = await getOpfsRoot();
  const { dirPath, name } = splitPath(path);
  const targetDir = dirPath ? await getDirectoryHandleByPath(root, dirPath, false) : root;
  const fileHandle = await targetDir.getFileHandle(name, { create: false });
  const file = await fileHandle.getFile();
  return await file.text();
}

/**
 * Write or create a file in the vault at the specified path.
 */
export async function writeFileContent(path: string, content: string | Blob | ArrayBuffer): Promise<void> {
  const root = await getOpfsRoot();
  const { dirPath, name } = splitPath(path);
  const targetDir = dirPath ? await getDirectoryHandleByPath(root, dirPath, true) : root;
  const fileHandle = await targetDir.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Delete a file or directory from the vault.
 */
export async function deleteVaultEntry(path: string): Promise<void> {
  const root = await getOpfsRoot();
  const { dirPath, name } = splitPath(path);
  const targetDir = dirPath ? await getDirectoryHandleByPath(root, dirPath, false) : root;
  await targetDir.removeEntry(name, { recursive: true });
}

/**
 * Import files (e.g. from file picker or directory upload input) into the vault.
 * Supports webkitRelativePath for folder uploads.
 */
export async function importFiles(files: FileList | File[]): Promise<number> {
  const root = await getOpfsRoot();
  let count = 0;

  for (const file of Array.from(files)) {
    // Check if webkitRelativePath exists (directory upload)
    const relPath: string = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    await writeFileContent(relPath, file);
    count++;
  }
  return count;
}

/**
 * Export/download a vault file to the user's local machine.
 */
export async function exportFileToLocal(path: string): Promise<void> {
  const content = await readFileContent(path);
  const { name } = splitPath(path);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get storage usage and quota estimation.
 */
export async function getVaultStats(): Promise<VaultStats> {
  const root = await getOpfsRoot();
  const items = await listVaultContents(root);

  let totalFiles = 0;
  let totalDirectories = 0;

  function countItems(itemList: VaultItem[]) {
    for (const item of itemList) {
      if (item.kind === 'file') {
        totalFiles++;
      } else {
        totalDirectories++;
        if (item.children) {
          countItems(item.children);
        }
      }
    }
  }

  countItems(items);

  let estimatedUsage: number | undefined;
  let estimatedQuota: number | undefined;

  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    estimatedUsage = estimate.usage;
    estimatedQuota = estimate.quota;
  }

  return {
    totalFiles,
    totalDirectories,
    estimatedUsage,
    estimatedQuota,
  };
}

/**
 * Recursively copy a directory or file from sourceRelPath to destRelPath.
 */
async function copyEntryRecursive(
  root: FileSystemDirectoryHandle,
  sourceRelPath: string,
  destRelPath: string
): Promise<void> {
  const sourceSplits = splitPath(sourceRelPath);
  const sourceParentDir = sourceSplits.dirPath ? await getDirectoryHandleByPath(root, sourceSplits.dirPath, false) : root;
  
  try {
    const fileHandle = await sourceParentDir.getFileHandle(sourceSplits.name, { create: false });
    const file = await fileHandle.getFile();
    await writeFileContent(destRelPath, file);
    return;
  } catch {
    // Must be a directory
  }

  const sourceDir = await getDirectoryHandleByPath(root, sourceRelPath, false);
  // @ts-expect-error - entries() iterator
  for await (const [name, handle] of sourceDir.entries()) {
    const childSource = `${sourceRelPath}/${name}`;
    const childDest = `${destRelPath}/${name}`;
    if (handle.kind === 'file') {
      const fileHandle = handle as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      await writeFileContent(childDest, file);
    } else {
      await copyEntryRecursive(root, childSource, childDest);
    }
  }
}

/**
 * Move or rename a file or directory in the vault.
 */
export async function moveVaultEntry(oldPath: string, newPath: string): Promise<void> {
  const root = await getOpfsRoot();
  const normalizedOld = oldPath.startsWith('/') ? oldPath.slice(1) : oldPath;
  const normalizedNew = newPath.startsWith('/') ? newPath.slice(1) : newPath;

  if (normalizedOld === normalizedNew) return;

  await copyEntryRecursive(root, normalizedOld, normalizedNew);
  await deleteVaultEntry(normalizedOld);
}

