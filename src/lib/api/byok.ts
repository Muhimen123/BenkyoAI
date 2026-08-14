/**
 * POST /api/key/validate — the one call that carries a key the Vault hasn't
 * stored yet, so it takes the credential as an argument instead of reading it
 * back out of storage. Nothing is persisted until the check comes back valid.
 */
import { request } from "./client";
import { getProvider } from "./providers";
import type { KeyValidationResult, ProviderId } from "@/lib/types";

export interface ValidateKeyPayload {
  provider: ProviderId;
  apiKey: string;
}

export async function validateApiKey(
  payload: ValidateKeyPayload,
): Promise<KeyValidationResult> {
  return request<ValidateKeyPayload, KeyValidationResult>(
    "/api/key/validate",
    payload,
    ({ provider, apiKey }) => {
      const info = getProvider(provider);
      const key = apiKey.trim();

      if (key.length < 12) {
        return {
          valid: false,
          provider,
          message: "That key looks too short. Copy the whole key and paste it again.",
        };
      }

      // Google keys start with AIza... or AQ...; other providers have a single fixed prefix.
      const prefixOk =
        provider === "google"
          ? key.startsWith("AIza") || key.startsWith("AQ")
          : key.startsWith(info.keyPrefix);

      if (!prefixOk) {
        const expectedDesc =
          provider === "google"
            ? "AIza… or AQ…"
            : info.keyPrefix;
        return {
          valid: false,
          provider,
          message: `${info.name} keys start with ${expectedDesc}. This one doesn't — check you copied from the right provider.`,
        };
      }
      if (key.toLowerCase().includes("test")) {
        return {
          valid: false,
          provider,
          message: `${info.name} rejected this key. Create a new one and paste it here.`,
        };
      }
      return {
        valid: true,
        provider,
        message: `Connected to ${info.name}. Your key stays on this device.`,
        modelHint: provider === "google" ? "gemini-2.5-flash" : undefined,
      };
    },
    { requiresKey: false, latency: 900 },
  );
}
