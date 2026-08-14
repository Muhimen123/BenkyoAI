/**
 * Thin data layer.
 *
 * Every UI data need goes through a named function in `lib/api/*`, and every one
 * of those calls `request()` below. Today `request()` resolves against local
 * mock data. When the real route handlers land, the body of `request()` becomes
 * a `fetch(path, ...)` — see `deliver()` — and no screen changes.
 *
 * The credential attached to every call is the user's own key, read from the
 * Vault in `localStorage`. There is no app-owned key anywhere in this path.
 */
import { readCredentials, type StoredCredentials } from "@/lib/byokVault";
import { sleep } from "@/lib/utils";

export class MissingKeyError extends Error {
  constructor() {
    super("No AI key connected. Connect your own key to continue.");
    this.name = "MissingKeyError";
  }
}

export interface RequestOptions {
  /** Simulated round-trip, in ms. */
  latency?: number;
  /** A couple of calls (key validation) carry the key explicitly instead. */
  requiresKey?: boolean;
}

type Resolver<TBody, TRes> = (
  body: TBody,
  credentials: StoredCredentials,
) => TRes | Promise<TRes>;

export async function request<TBody, TRes>(
  path: string,
  body: TBody,
  resolve: Resolver<TBody, TRes>,
  { latency = 700, requiresKey = true }: RequestOptions = {},
): Promise<TRes> {
  const credentials = readCredentials();
  if (requiresKey && !credentials) throw new MissingKeyError();

  const credential = credentials ?? { provider: "google" as const, apiKey: "" };

  /**
   * Target end-state — the key travels with the request, the route proxies it
   * straight to the provider, nothing is stored server-side:
   *
   *   const res = await fetch(path, {
   *     method: "POST",
   *     headers: {
   *       "content-type": "application/json",
   *       "x-provider": credential.provider,
   *       "x-provider-key": credential.apiKey,
   *     },
   *     body: JSON.stringify(body),
   *   });
   *   return res.json();
   */
  return deliver(path, body, credential, resolve, latency);
}

async function deliver<TBody, TRes>(
  path: string,
  body: TBody,
  credentials: StoredCredentials,
  resolve: Resolver<TBody, TRes>,
  latency: number,
): Promise<TRes> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-provider": credentials.provider,
      "x-provider-key": credentials.apiKey,
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed: ${res.statusText}`);
  }
  
  return res.json();
}
