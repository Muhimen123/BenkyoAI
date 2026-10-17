"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Laptop,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { PROVIDERS, getProvider } from "@/lib/api/providers";
import { validateApiKey } from "@/lib/api/byok";
import { useStudyStore } from "@/store/useStudyStore";
import type { KeyValidationResult, ProviderId } from "@/lib/types";
import { cn } from "@/lib/utils";

const FACTS = [
  {
    icon: Laptop,
    title: "Stays on this device",
    body: "The key is saved in this browser only. BenkyoAI has no server that holds it.",
  },
  {
    icon: Wallet,
    title: "Your usage, your cost",
    body: "Requests are billed to your provider account, at their rates. No subscription here.",
  },
  {
    icon: ShieldCheck,
    title: "Revoke whenever",
    body: "Delete the key at the provider and it stops working immediately, everywhere.",
  },
];

export function ByokSetup({
  onConnected,
  heading = "Connect your AI key",
  showExplainer = true,
  submitLabel = "Connect key",
}: {
  onConnected?: () => void;
  heading?: string;
  showExplainer?: boolean;
  submitLabel?: string;
}) {
  const connectKey = useStudyStore((s) => s.connectKey);
  const [provider, setProvider] = useState<ProviderId>("google");
  const [key, setKey] = useState("");
  const [model, setModel] = useState("");
  const [reveal, setReveal] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<KeyValidationResult | null>(null);

  const info = getProvider(provider);
  const connected = result?.valid === true;

  async function handleValidate() {
    setChecking(true);
    setResult(null);
    try {
      const chosenModel = info.defaultModel ? model.trim() || info.defaultModel : undefined;
      const outcome = await validateApiKey({ provider, apiKey: key, model: chosenModel });
      setResult(outcome);
      if (outcome.valid) {
        connectKey(provider, key.trim(), chosenModel);
        setKey("");
        setReveal(false);
      }
    } catch {
      setResult({
        valid: false,
        provider,
        message: "Couldn't reach the provider. Check your connection and try again.",
      });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-8">
      {showExplainer && (
        <div className="space-y-5">
          <div className="max-w-xl space-y-3">
            <h2 className="text-[22px] leading-snug font-semibold tracking-tight text-ink sm:text-[26px]">
              {heading}
            </h2>
            <p className="text-[15px] leading-relaxed text-ink-soft">
              BenkyoAI has no accounts and nothing to sign up for. It runs on an
              API key — a long string you get from an AI provider that lets this
              app ask questions on your behalf. Getting one takes about a minute
              and most providers start you off free.
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {FACTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="bg-surface p-4">
                <Icon className="mb-2.5 size-4 text-gold-500" />
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="mt-1 text-[13px] leading-snug text-ink-soft">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Pick a provider</p>
          <Segmented
            ariaLabel="AI provider"
            full
            options={PROVIDERS.map((p) => ({ value: p.id, label: p.name }))}
            value={provider}
            onChange={(v) => {
              setProvider(v);
              setModel("");
              setResult(null);
            }}
          />
          <p className="text-[13px] text-ink-soft">{info.freeTierNote}</p>
        </div>

        <ol className="space-y-0 overflow-hidden rounded-xl border border-line bg-surface">
          {info.steps.map((step, i) => (
            <li
              key={step}
              className="flex gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <span className="label-data mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-700">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-ink-soft">{step}</span>
            </li>
          ))}
        </ol>

        <a
          href={info.consoleUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-700 underline decoration-gold-200 underline-offset-4 transition-colors hover:decoration-gold-500"
        >
          Open {info.name}
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>

      {connected ? (
        <div className="animate-pop flex flex-wrap items-center gap-3 rounded-xl border border-sage-100 bg-sage-50 px-4 py-3.5">
          <CheckCircle2 className="size-5 text-sage-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">
              {getProvider(result.provider).name} connected
            </p>
            <p className="text-[13px] text-ink-soft">
              Saved to this browser. You won't see the key again — replace it any
              time in Settings.
            </p>
          </div>
          {onConnected && (
            <Button onClick={onConnected} size="sm">
              Continue
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Field
            label={info.credentialLabel ?? "Paste your key"}
            htmlFor="byok-key"
            hint={
              result && !result.valid ? undefined : (
                <>
                  Starts with{" "}
                  <span className="font-mono">
                    {provider === "google" ? "AIza… or AQ…" : info.keyPrefix}
                  </span>
                  . Checked as soon as you connect.
                </>
              )
            }
            error={result && !result.valid ? result.message : undefined}
          >
            <div className="relative">
              <Input
                id="byok-key"
                type={reveal || provider === "ollama" ? "text" : "password"}
                value={key}
                autoComplete="off"
                spellCheck={false}
                placeholder={
                  provider === "google"
                    ? "AIza… or AQ…"
                    : provider === "ollama"
                      ? "http://localhost:11434"
                      : `${info.keyPrefix}…`
                }
                onChange={(e) => {
                  setKey(e.target.value);
                  setResult(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && key.trim()) handleValidate();
                }}
                className={cn(
                  "pr-11 font-mono text-sm",
                  result && !result.valid && "border-clay-500",
                )}
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Hide key" : "Show key"}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint transition-colors hover:bg-sunk hover:text-ink"
              >
                {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          {info.defaultModel && (
            <Field
              label="Model"
              htmlFor="byok-model"
              hint={<>Leave blank for <span className="font-mono">{info.defaultModel}</span>.</>}
            >
              <Input
                id="byok-model"
                value={model}
                autoComplete="off"
                spellCheck={false}
                placeholder={info.defaultModel}
                onChange={(e) => {
                  setModel(e.target.value);
                  setResult(null);
                }}
                className="font-mono text-sm"
              />
            </Field>
          )}

          {result && !result.valid && (
            <p className="flex items-start gap-2 text-[13px] text-clay-700">
              <XCircle className="mt-px size-3.5 shrink-0" />
              Nothing was saved. Fix the key above and try again.
            </p>
          )}

          <Button
            onClick={handleValidate}
            loading={checking}
            disabled={!key.trim()}
            size="lg"
            full
          >
            {checking ? "Checking with " + info.name + "…" : submitLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
