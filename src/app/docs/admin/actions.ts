"use server";

/**
 * Admin actions for /docs visibility. Server Functions are reachable by direct
 * POST, so every one checks the admin cookie itself rather than trusting the UI.
 */
import { refresh } from "next/cache";
import {
  adminConfigured,
  grantAdminCookie,
  isAdmin,
  revokeAdminCookie,
  setOverride,
  tokenIsValid,
} from "@/lib/docs/accessServer";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function signIn(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!adminConfigured()) return { ok: false, message: "Admin is turned off on this server." };
  const token = String(form.get("token") ?? "");
  if (!tokenIsValid(token)) return { ok: false, message: "That token isn't right." };
  await grantAdminCookie();
  refresh();
  return { ok: true, message: "Signed in." };
}

export async function signOut(): Promise<void> {
  await revokeAdminCookie();
  refresh();
}

function isoOrUndefined(value: unknown) {
  if (typeof value !== "string" || !value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Saves an override: on/off plus an optional window (ISO strings). */
export async function saveVisibility(input: {
  enabled: boolean;
  start?: string;
  end?: string;
}): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: "Your admin session has ended. Sign in again." };
  const start = isoOrUndefined(input.start);
  const end = isoOrUndefined(input.end);
  if (start === null || end === null) return { ok: false, message: "One of the dates isn't valid." };
  if (start && end && new Date(end) <= new Date(start)) {
    return { ok: false, message: "The window has to end after it starts." };
  }
  setOverride({ enabled: Boolean(input.enabled), start, end });
  refresh();
  return { ok: true, message: "Saved. /docs follows these settings now." };
}

/** Drops the override so the env vars (or the public default) apply again. */
export async function resetVisibility(): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: "Your admin session has ended. Sign in again." };
  setOverride(null);
  refresh();
  return { ok: true, message: "Override cleared. Back to the server defaults." };
}
