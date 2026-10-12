/**
 * Who can see /docs, and when.
 *
 * Pure rules only — no request, cookie or env access — so they run the same in
 * the page, the admin panel and the tests. Server wiring is in `accessServer.ts`.
 *
 * Without any configuration /docs stays public, exactly as before. A window
 * only applies once one is set (env vars, or an admin override).
 */

export interface DocsAccessConfig {
  /** Master switch. Off means hidden regardless of the window. */
  enabled: boolean;
  /** ISO timestamp the docs open at. Unset = already open. */
  start?: string;
  /** ISO timestamp the docs close at. Unset = never closes. */
  end?: string;
}

export type DocsAccessState = "open" | "disabled" | "scheduled" | "ended";

export interface DocsAccessStatus {
  visible: boolean;
  state: DocsAccessState;
  config: DocsAccessConfig;
  /** Where the config came from: env vars, or an admin override. */
  source: "env" | "override";
  /** Problems in the config that were ignored, for the admin panel. */
  warnings: string[];
}

export const PUBLIC_DEFAULT: DocsAccessConfig = { enabled: true };

function validDate(iso: string | undefined) {
  return Boolean(iso) && !Number.isNaN(new Date(iso!).getTime());
}

export function accessState(config: DocsAccessConfig, now: Date = new Date()): DocsAccessState {
  if (!config.enabled) return "disabled";
  const t = now.getTime();
  if (validDate(config.start) && t < new Date(config.start!).getTime()) return "scheduled";
  if (validDate(config.end) && t > new Date(config.end!).getTime()) return "ended";
  return "open";
}

/** Reads DOCS_ENABLED, DOCS_START, DOCS_END and DOCS_DURATION_HOURS. */
export function configFromEnv(env: Record<string, string | undefined>): {
  config: DocsAccessConfig;
  warnings: string[];
} {
  const warnings: string[] = [];
  const flag = env.DOCS_ENABLED?.trim().toLowerCase();
  const enabled = !flag || !["false", "0", "off", "no"].includes(flag);

  let start = env.DOCS_START?.trim() || undefined;
  let end = env.DOCS_END?.trim() || undefined;
  if (start && !validDate(start)) {
    warnings.push(`DOCS_START "${start}" is not a valid date and was ignored.`);
    start = undefined;
  }
  if (end && !validDate(end)) {
    warnings.push(`DOCS_END "${end}" is not a valid date and was ignored.`);
    end = undefined;
  }

  const hours = env.DOCS_DURATION_HOURS?.trim();
  if (hours && !end) {
    const n = Number(hours);
    if (!start) warnings.push("DOCS_DURATION_HOURS needs DOCS_START and was ignored.");
    else if (!Number.isFinite(n) || n <= 0)
      warnings.push(`DOCS_DURATION_HOURS "${hours}" is not a positive number and was ignored.`);
    else end = new Date(new Date(start).getTime() + n * 3_600_000).toISOString();
  }

  if (start && end && new Date(end) <= new Date(start)) {
    warnings.push("The end of the docs window is before its start, so the docs never open.");
  }
  return { config: { enabled, start, end }, warnings };
}

/**
 * The showcase window from the brief: June 10, 00:00 → June 14, 23:59, in the
 * next June that hasn't finished yet. Returned as local wall-clock strings for
 * `<input type="datetime-local">`, so it's read in the admin's own timezone.
 */
export function showcaseWindow(now: Date = new Date()) {
  const thisYearEnd = new Date(now.getFullYear(), 5, 14, 23, 59);
  const year = now > thisYearEnd ? now.getFullYear() + 1 : now.getFullYear();
  return { start: `${year}-06-10T00:00`, end: `${year}-06-14T23:59` };
}
