/**
 * The retrieval index lives in IndexedDB, in this browser only — alongside the
 * rest of the vault, never on a server. One record per chunk, with its vector.
 */
import type { Chunk } from "./search";

const DB_NAME = "benkyoai-rag";
const STORE = "chunks";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("materialId", "materialId");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    t.oncomplete = () => {
      db.close();
      resolve(req ? req.result : undefined);
    };
    t.onerror = () => reject(t.error);
  });
}

export async function putChunks(chunks: Chunk[]) {
  await tx("readwrite", (store) => {
    for (const chunk of chunks) store.put(chunk);
  });
}

export async function allChunks(): Promise<Chunk[]> {
  return (await tx<Chunk[]>("readonly", (store) => store.getAll())) ?? [];
}

export async function chunksFor(materialIds: string[]): Promise<Chunk[]> {
  const ids = new Set(materialIds);
  return (await allChunks()).filter((c) => ids.has(c.materialId));
}

export async function deleteChunksFor(materialId: string) {
  const keys =
    (await tx<IDBValidKey[]>("readonly", (store) => store.index("materialId").getAllKeys(materialId))) ?? [];
  if (keys.length) await tx("readwrite", (store) => keys.forEach((k) => store.delete(k)));
}

export async function clearChunks() {
  await tx("readwrite", (store) => store.clear());
}
