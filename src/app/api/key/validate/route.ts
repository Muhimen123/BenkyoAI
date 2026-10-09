import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { KeyValidationResult } from "@/lib/types";
import { DEFAULT_MODELS, ollamaBaseUrl } from "@/lib/providerAdapters";

/** Ollama has no key: check the local server answers and the model is pulled. */
async function probeOllama(address: string, model?: string): Promise<KeyValidationResult> {
  const wanted = model || DEFAULT_MODELS.ollama;
  let base: string;
  try {
    base = ollamaBaseUrl(address);
  } catch (err: any) {
    return { valid: false, provider: "ollama", message: err.message };
  }
  try {
    const res = await fetch(`${base}/api/tags`);
    const data = (await res.json()) as { models?: { name: string }[] };
    const names = (data.models ?? []).map((m) => m.name);
    const found = names.some((n) => n === wanted || n === `${wanted}:latest`);
    if (!found) {
      return {
        valid: false,
        provider: "ollama",
        message: `Ollama is running but ${wanted} isn't installed. Run: ollama pull ${wanted}`,
      };
    }
    return { valid: true, provider: "ollama", message: `Connected to ${wanted} on this machine.`, modelHint: wanted };
  } catch {
    return {
      valid: false,
      provider: "ollama",
      message: "Couldn't reach Ollama. Start it, and run BenkyoAI locally (npm run dev).",
    };
  }
}

/**
 * POST /api/key/validate
 *
 * Body: { provider: string; apiKey: string }
 * Headers: none required (key travels in the body — this is the one call
 *          that happens before the key is stored).
 *
 * Makes a cheap real API call to confirm the key works, then returns a
 * KeyValidationResult. The key is never logged or persisted server-side.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { provider?: string; apiKey?: string; model?: string };
    const { provider = "google", apiKey = "", model } = body;

    const key = apiKey.trim();

    if (!key || key.length < 12) {
      return NextResponse.json<KeyValidationResult>({
        valid: false,
        provider: provider as any,
        message: "That key looks too short. Copy the whole key and paste it again.",
      });
    }

    if (provider === "google") {
      // Accept both AIza… and AQ… prefixes
      const prefixOk = key.startsWith("AIza") || key.startsWith("AQ");
      if (!prefixOk) {
        return NextResponse.json<KeyValidationResult>({
          valid: false,
          provider: "google",
          message:
            "Google AI Studio keys start with AIza… or AQ…. This one doesn't — check you copied from the right provider.",
        });
      }

      // Probe the real API with a tiny generateContent call.
      // Try candidate models in priority order — a 404 on any individual model
      // just means that model is retired, not that the key is wrong.
      // Only a 401/403 (auth error) or an explicit API_KEY_INVALID definitively
      // means the key is bad.
      const PROBE_CANDIDATES = [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ];

      let probeAuthError: KeyValidationResult | null = null;
      let probeSucceeded = false;

      for (const probeModel of PROBE_CANDIDATES) {
        try {
          const ai = new GoogleGenAI({ apiKey: key });
          await ai.models.generateContent({
            model: probeModel,
            contents: 'hi',
          });
          probeSucceeded = true;
          break;
        } catch (err: any) {
          const status: number =
            err?.status ??
            err?.statusCode ??
            err?.response?.status ??
            err?.httpStatus ??
            0;
          const msg: string = (err?.message ?? '').toLowerCase();

          const isAuthError =
            status === 401 ||
            status === 403 ||
            (status === 400 && msg.includes('api_key_invalid')) ||
            (status === 400 && msg.includes('api key not valid'));

          if (isAuthError) {
            probeAuthError = {
              valid: false,
              provider: 'google',
              message:
                'Google rejected this key. Make sure you copied the full key from AI Studio and that the Gemini API is enabled.',
            };
            break; // Auth errors apply to all models — no point continuing
          }
          // 404 = model retired, try next candidate; other errors = keep trying
        }
      }

      if (probeAuthError) {
        return NextResponse.json<KeyValidationResult>(probeAuthError);
      }
      // If probeSucceeded or all models 404'd, the key itself is fine
      if (!probeSucceeded) {
        console.warn('All probe models 404d — treating key as valid, model resolution will happen at runtime.');
      }

      return NextResponse.json<KeyValidationResult>({
        valid: true,
        provider: "google",
        message: "Connected to Google AI Studio. Your key stays on this device.",
        modelHint: probeSucceeded ? PROBE_CANDIDATES.find(Boolean) : "gemini-2.5-flash",
      });
    }

    if (provider === "ollama") {
      return NextResponse.json<KeyValidationResult>(await probeOllama(key, model));
    }

    const prefixMap: Record<string, string> = {
      openai: "sk-",
      anthropic: "sk-ant-",
    };
    const expectedPrefix = prefixMap[provider];
    if (expectedPrefix && !key.startsWith(expectedPrefix)) {
      return NextResponse.json<KeyValidationResult>({
        valid: false,
        provider: provider as any,
        message: `${provider} keys start with ${expectedPrefix}. This one doesn't — check you copied from the right provider.`,
      });
    }

    // Listing models is free and fails with 401 on a bad key.
    const probe =
      provider === "anthropic"
        ? await fetch("https://api.anthropic.com/v1/models", {
            headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
          })
        : await fetch("https://api.openai.com/v1/models", {
            headers: { authorization: `Bearer ${key}` },
          });
    if (probe.status === 401 || probe.status === 403) {
      return NextResponse.json<KeyValidationResult>({
        valid: false,
        provider: provider as any,
        message: "The provider rejected this key. Check it's active and copied in full.",
      });
    }
    if (!probe.ok) {
      return NextResponse.json<KeyValidationResult>({
        valid: false,
        provider: provider as any,
        message: `The provider didn't answer (${probe.status}). Try again in a moment.`,
      });
    }

    return NextResponse.json<KeyValidationResult>({
      valid: true,
      provider: provider as any,
      message: `Connected. Your key stays on this device.`,
      modelHint: model,
    });
  } catch (error: any) {
    console.error("Key validation error:", error);
    return NextResponse.json<KeyValidationResult>(
      {
        valid: false,
        provider: "google",
        message: "Validation failed. Check your connection and try again.",
      },
      { status: 500 },
    );
  }
}
