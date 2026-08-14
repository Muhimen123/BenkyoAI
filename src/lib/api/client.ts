/**
 * Thin data layer.
 *
 * Every UI data need goes through a named function in `lib/api/*`, and every
 * one of those calls `request()` below. The credential attached to every call
 * is the user's own key, read from the Vault in `localStorage`. There is no
 * app-owned key anywhere in this path.
 */
import { readCredentials } from "@/lib/byokVault";

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
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${res.statusText}`);
  }

  return res.json();
}
