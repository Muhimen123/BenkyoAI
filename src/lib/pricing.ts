/**
 * Cost estimates for the BYOK meter.
 *
 * Rates are Google's paid-tier list prices in USD per million tokens. On the
 * free tier the real cost is zero, so the meter is labelled as an estimate.
 * Unknown Gemini models fall back to the closest family (pro / lite / flash).
 * Local Ollama models cost nothing; other providers are counted in tokens but
 * not priced, rather than guessed.
 */
import type { UsageEntry } from "./types";

interface Rate {
  input: number;
  output: number;
}

const RATES: [prefix: string, rate: Rate][] = [
  ["gemini-2.5-pro", { input: 1.25, output: 10 }],
  ["gemini-2.5-flash-lite", { input: 0.1, output: 0.4 }],
  ["gemini-2.5-flash", { input: 0.3, output: 2.5 }],
  ["gemini-2.0-flash-lite", { input: 0.075, output: 0.3 }],
  ["gemini-2.0-flash", { input: 0.1, output: 0.4 }],
];

const FAMILY: [match: string, rate: Rate][] = [
  ["pro", { input: 1.25, output: 10 }],
  ["lite", { input: 0.1, output: 0.4 }],
  ["flash", { input: 0.3, output: 2.5 }],
];

export function rateFor(model: string): Rate {
  return (
    RATES.find(([prefix]) => model.startsWith(prefix))?.[1] ??
    FAMILY.find(([match]) => model.includes(match))?.[1] ??
    FAMILY[2][1]
  );
}

export function costOf(entry: Pick<UsageEntry, "provider" | "model" | "inputTokens" | "outputTokens">) {
  if (entry.provider && entry.provider !== "google") return 0;
  const rate = rateFor(entry.model);
  return (entry.inputTokens * rate.input + entry.outputTokens * rate.output) / 1_000_000;
}

export function totals(entries: UsageEntry[]) {
  return entries.reduce(
    (sum, e) => ({
      calls: sum.calls + 1,
      inputTokens: sum.inputTokens + e.inputTokens,
      outputTokens: sum.outputTokens + e.outputTokens,
      cost: sum.cost + costOf(e),
    }),
    { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
  );
}

export function formatCost(usd: number) {
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return "< $0.01";
  return `$${usd.toFixed(2)}`;
}

export function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
