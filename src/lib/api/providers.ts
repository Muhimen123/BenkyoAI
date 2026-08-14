import type { ProviderInfo, ProviderId } from "@/lib/types";

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "google",
    name: "Google AI Studio",
    consoleUrl: "https://aistudio.google.com/apikey",
    keyPrefix: "AI",
    freeTierNote: "Has a free tier that covers ordinary studying.",
    steps: [
      "Open aistudio.google.com/apikey and sign in with a Google account.",
      "Select Create API key, then pick or create a project.",
      "Copy the key it shows you — it starts with AIza or AQ.",
      "Paste it below. BenkyoAI checks it right away.",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    consoleUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
    freeTierNote: "Pay as you go. Add a small credit balance before you start.",
    steps: [
      "Open platform.openai.com/api-keys and sign in.",
      "Select Create new secret key and give it a name like BenkyoAI.",
      "Copy the key straight away — OpenAI shows it once.",
      "Paste it below. BenkyoAI checks it right away.",
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    keyPrefix: "sk-ant-",
    freeTierNote: "Pay as you go. Add a small credit balance before you start.",
    steps: [
      "Open console.anthropic.com/settings/keys and sign in.",
      "Select Create key and give it a name like BenkyoAI.",
      "Copy the key it shows you — it starts with sk-ant-.",
      "Paste it below. BenkyoAI checks it right away.",
    ],
  },
];

export function getProvider(id: ProviderId): ProviderInfo {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}
