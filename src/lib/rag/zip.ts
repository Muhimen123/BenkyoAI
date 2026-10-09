/**
 * Minimal ZIP reader for Office files (.pptx is a ZIP of XML parts).
 *
 * Reads the central directory, then inflates the requested entries with the
 * browser's native DecompressionStream — no dependency needed for the two
 * compression methods Office actually uses (stored and deflate).
 */

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

export interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localOffset: number;
}

export function listZipEntries(buffer: ArrayBuffer): ZipEntry[] {
  const view = new DataView(buffer);
  // The end-of-central-directory record sits in the last 64 KB (+22 bytes).
  let eocd = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a ZIP archive.");

  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries: ZipEntry[] = [];

  for (let n = 0; n < count; n++) {
    if (view.getUint32(offset, true) !== CENTRAL) throw new Error("Corrupt ZIP directory.");
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    entries.push({
      method: view.getUint16(offset + 10, true),
      compressedSize: view.getUint32(offset + 20, true),
      localOffset: view.getUint32(offset + 42, true),
      name: decoder.decode(new Uint8Array(buffer, offset + 46, nameLength)),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

export async function readZipEntry(buffer: ArrayBuffer, entry: ZipEntry): Promise<string> {
  const view = new DataView(buffer);
  if (view.getUint32(entry.localOffset, true) !== LOCAL) throw new Error("Corrupt ZIP entry.");
  const start =
    entry.localOffset + 30 + view.getUint16(entry.localOffset + 26, true) + view.getUint16(entry.localOffset + 28, true);
  const data = new Uint8Array(buffer, start, entry.compressedSize);

  if (entry.method === 0) return new TextDecoder().decode(data);
  if (entry.method !== 8) throw new Error(`Unsupported ZIP compression (${entry.method}).`);

  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}
