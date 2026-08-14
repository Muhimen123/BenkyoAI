/**
 * The Vault lives in the browser. This module is the only place that reads the
 * raw BYOK key back out of storage — everything else works with `KeyConnection`,
 * which holds nothing but the provider and the last four characters.
 *
 * Persistence internals are deliberately thin: one `localStorage` blob written
 * by the Zustand store's `persist` middleware.
 */
import type { ProviderId } from "./types";

export const VAULT_STORAGE_KEY = "benkyoai.vault";

export interface StoredCredentials {
  provider: ProviderId;
  apiKey: string;
}

export function readCredentials(): StoredCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { apiKey?: string; connection?: { provider: ProviderId } };
    };
    const apiKey = parsed.state?.apiKey;
    const provider = parsed.state?.connection?.provider;
    if (!apiKey || !provider) return null;
    return { provider, apiKey };
  } catch {
    return null;
  }
}

export function maskKey(key: string) {
  return key.trim().slice(-4);
}
