/**
 * POST /api/key/validate — carries the key explicitly since it hasn't been
 * stored yet. Nothing is persisted until the check comes back valid.
 */
import { request } from "./client";
import type { KeyValidationResult, ProviderId } from "@/lib/types";

export interface ValidateKeyPayload {
  provider: ProviderId;
  apiKey: string;
  model?: string;
}

export async function validateApiKey(
  payload: ValidateKeyPayload,
): Promise<KeyValidationResult> {
  return request<ValidateKeyPayload, KeyValidationResult>(
    "/api/key/validate",
    payload,
    { requiresKey: false },
  );
}
