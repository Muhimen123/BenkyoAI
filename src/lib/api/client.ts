/**
 * Thin data layer.
 *
 * Every UI data need goes through a named function in `lib/api/*`, and every
 * one of those calls `request()` below. The credential attached to every call
 * is the user's own key, read from the Vault in `localStorage`. There is no
 * app-owned key anywhere in this path.
 */
import { readCredentials } from "@/lib/byokVault";
import { useStudyStore } from "@/store/useStudyStore";
import type { UsageEntry } from "@/lib/types";

/** Mirrors USAGE_HEADER in lib/usage.ts (server-only module). */
const USAGE_HEADER = "x-benkyo-usage";

function recordUsageFrom(res: Response, path: string, roadmapId?: string) {
  const raw = res.headers.get(USAGE_HEADER);
  if (!raw) return;
  try {
    const records = JSON.parse(raw) as Omit<UsageEntry, "at" | "roadmapId" | "path">[];
    useStudyStore.getState().recordUsage(records.map((r) => ({ ...r, path })), roadmapId);
  } catch {
    // A malformed header only costs us one meter reading.
  }
}

export class MissingKeyError extends Error {
  constructor() {
    super("No AI key connected. Connect your own key to continue.");
    this.name = "MissingKeyError";
  }
}

export interface RequestOptions {
  requiresKey?: boolean;
}

export async function request<TBody, TRes>(
  path: string,
  body: TBody,
  { requiresKey = true }: RequestOptions = {},
): Promise<TRes> {
  const credentials = readCredentials();
  if (requiresKey && !credentials) throw new MissingKeyError();

  const credential = credentials ?? { provider: "google" as const, apiKey: "" };

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-provider": credential.provider,
      "x-provider-key": credential.apiKey,
      ...(credential.model && { "x-provider-model": credential.model }),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    recordUsageFrom(res, path);
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${res.statusText}`);
  }

  const data = await res.json();
  // A roadmap is created by this very call, so its cost belongs to it rather
  // than to whichever roadmap was open before.
  recordUsageFrom(res, path, path === "/api/roadmap" ? data?.id : undefined);
  return data;
}
