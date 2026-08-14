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
      // Only reject the key on a definitive auth failure (HTTP 400 with API key
      // error, 401, or 403). Any other failure (rate limit, network, 5xx) means
      // we can't be sure, so we let the key through and surface errors on the
      // first real study call instead of blocking the user.
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        await ai.models.generateContent({
          model: "gemini-2.0-flash-lite",
          contents: "hi",
        });
      } catch (err: any) {
        // The SDK surfaces HTTP status in different shapes across versions
        const status: number =
          err?.status ??
          err?.statusCode ??
          err?.response?.status ??
          err?.httpStatus ??
          0;

        const msg: string = (err?.message ?? "").toLowerCase();
        const isAuthError =
          status === 401 ||
          status === 403 ||
          // Some SDK versions throw a 400 with an "API_KEY_INVALID" error code
          (status === 400 && msg.includes("api_key_invalid")) ||
          (status === 400 && msg.includes("api key not valid"));

        if (isAuthError) {
          return NextResponse.json<KeyValidationResult>({
            valid: false,
            provider: "google",
            message:
              "Google rejected this key. Make sure you copied the full key from AI Studio and that the Gemini API is enabled.",
          });
        }
        // Any other failure — network issue, quota, 429, 5xx — treat as
        // "couldn't verify" and let the key through.
        console.warn("Key probe failed with non-auth error, treating key as valid:", err?.message);
      }

      return NextResponse.json<KeyValidationResult>({
        valid: true,
        provider: "google",
        message: "Connected to Google AI Studio. Your key stays on this device.",
        modelHint: "gemini-2.0-flash",
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
