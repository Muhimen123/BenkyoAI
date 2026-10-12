/**
 * Server half of /docs access control: the admin override, the admin cookie,
 * and the combined status the page renders from.
 *
 * BenkyoAI has no database, so the admin override lives in server memory. On
 * a single long-running server (`next start`) it holds until restart; on
 * serverless hosting each instance has its own copy, so the env vars are the
 * durable control there.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  accessState,
  configFromEnv,
  type DocsAccessConfig,
  type DocsAccessStatus,
} from "./access";

export const ADMIN_COOKIE = "benkyo_docs_admin";
const ADMIN_COOKIE_MAX_AGE = 8 * 60 * 60;

interface Override {
  config: DocsAccessConfig;
  updatedAt: string;
}

// One copy per process, shared by every route bundle that loads this module.
const g = globalThis as { __benkyoDocsOverride?: Override | null };

export function getOverride(): Override | null {
  return g.__benkyoDocsOverride ?? null;
}

export function setOverride(config: DocsAccessConfig | null) {
  g.__benkyoDocsOverride = config ? { config, updatedAt: new Date().toISOString() } : null;
}

export function getDocsStatus(now: Date = new Date()): DocsAccessStatus {
  const env = configFromEnv(process.env);
  const override = getOverride();
  const config = override?.config ?? env.config;
  const state = accessState(config, now);
  return {
    visible: state === "open",
    state,
    config,
    source: override ? "override" : "env",
    warnings: env.warnings,
  };
}

/* ------------------------------------------------------------------ admin */

/** Admin is off entirely unless DOCS_ADMIN_TOKEN is set. */
export function adminConfigured() {
  return Boolean(process.env.DOCS_ADMIN_TOKEN?.trim());
}

/** What the cookie holds: a digest of the token, never the token itself. */
function digest(token: string) {
  return createHash("sha256").update(`benkyo-docs-admin:${token}`).digest();
}

function matches(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function tokenIsValid(candidate: string) {
  const token = process.env.DOCS_ADMIN_TOKEN?.trim();
  if (!token || !candidate) return false;
  return matches(digest(candidate.trim()), digest(token));
}

export async function isAdmin() {
  const token = process.env.DOCS_ADMIN_TOKEN?.trim();
  if (!token) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value || !/^[0-9a-f]{64}$/.test(value)) return false;
  return matches(Buffer.from(value, "hex"), digest(token));
}

export async function grantAdminCookie() {
  const token = process.env.DOCS_ADMIN_TOKEN!.trim();
  (await cookies()).set(ADMIN_COOKIE, digest(token).toString("hex"), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/docs",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
}

export async function revokeAdminCookie() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/docs" });
}
