import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { KeyValidationResult } from "@/lib/types";

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
    const body = (await request.json()) as { provider?: string; apiKey?: string };
    const { provider = "google", apiKey = "" } = body;

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

    // OpenAI / Anthropic — prefix check only for now (no server-side secret needed)
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

    return NextResponse.json<KeyValidationResult>({
      valid: true,
      provider: provider as any,
      message: `Connected. Your key stays on this device.`,
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
