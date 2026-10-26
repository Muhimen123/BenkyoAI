import type { ProviderId } from "@/lib/types";
import type { MessageKey } from "./t";

/**
 * Maps the static provider setup data (`src/lib/api/providers.ts`) onto message
 * keys. Written out explicitly rather than built from template literals so a
 * typo or a missing translation is a compile error, not a runtime lookup miss.
 */
export const PROVIDER_FREE_TIER_KEYS: Record<ProviderId, MessageKey> = {
  google: "providers.google.freeTierNote",
  openai: "providers.openai.freeTierNote",
  anthropic: "providers.anthropic.freeTierNote",
  ollama: "providers.ollama.freeTierNote",
};

/**
 * Setup steps, in display order. Every provider in `providers.ts` has four
 * steps with the same shape (sign in → create → copy → paste).
 */
export const PROVIDER_STEP_KEYS: Record<ProviderId, MessageKey[]> = {
  google: [
    "providers.google.steps.signIn",
    "providers.google.steps.create",
    "providers.google.steps.copy",
    "providers.google.steps.paste",
  ],
  openai: [
    "providers.openai.steps.signIn",
    "providers.openai.steps.create",
    "providers.openai.steps.copy",
    "providers.openai.steps.paste",
  ],
  anthropic: [
    "providers.anthropic.steps.signIn",
    "providers.anthropic.steps.create",
    "providers.anthropic.steps.copy",
    "providers.anthropic.steps.paste",
  ],
  ollama: [
    "providers.ollama.steps.signIn",
    "providers.ollama.steps.create",
    "providers.ollama.steps.copy",
    "providers.ollama.steps.paste",
  ],
};
