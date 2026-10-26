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
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  PROVIDER_FREE_TIER_KEYS,
  PROVIDER_STEP_KEYS,
} from "@/lib/i18n/providerMessages";
import { useStudyStore } from "@/store/useStudyStore";
import type { KeyValidationResult, ProviderId } from "@/lib/types";
import { cn } from "@/lib/utils";

const FACTS = [
  {
    icon: Laptop,
    titleKey: "byok.facts.device.title",
    bodyKey: "byok.facts.device.body",
  },
  {
    icon: Wallet,
    titleKey: "byok.facts.usage.title",
    bodyKey: "byok.facts.usage.body",
  },
  {
    icon: ShieldCheck,
    titleKey: "byok.facts.revoke.title",
    bodyKey: "byok.facts.revoke.body",
  },
] as const;

export function ByokSetup({
  onConnected,
  heading,
  showExplainer = true,
  submitLabel,
}: {
  onConnected?: () => void;
  heading?: string;
  showExplainer?: boolean;
  submitLabel?: string;
}) {
  const { t } = useT();
  const connectKey = useStudyStore((s) => s.connectKey);
  const [provider, setProvider] = useState<ProviderId>("google");
  const [key, setKey] = useState("");
  const [model, setModel] = useState("");
  const [reveal, setReveal] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<KeyValidationResult | null>(null);

  const info = getProvider(provider);
  const connected = result?.valid === true;
  const title = heading ?? t("byok.defaultHeading");
  const submit = submitLabel ?? t("byok.submit");
  const keyPrefix = provider === "google" ? "AIza… or AQ…" : `${info.keyPrefix}…`;

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
        message: t("byok.failure"),
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
              {title}
            </h2>
            <p className="text-[15px] leading-relaxed text-ink-soft">
              {t("byok.intro")}
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {FACTS.map(({ icon: Icon, titleKey, bodyKey }) => (
              <li key={titleKey} className="bg-surface p-4">
                <Icon className="mb-2.5 size-4 text-gold-500" />
                <p className="text-sm font-medium text-ink">{t(titleKey)}</p>
                <p className="mt-1 text-[13px] leading-snug text-ink-soft">{t(bodyKey)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">{t("byok.pickProvider")}</p>
          <Segmented
            ariaLabel={t("byok.providerAria")}
            full
            options={PROVIDERS.map((p) => ({ value: p.id, label: p.name }))}
            value={provider}
            onChange={(v) => {
              setProvider(v);
              setModel("");
              setResult(null);
            }}
          />
          <p className="text-[13px] text-ink-soft">
            {t(PROVIDER_FREE_TIER_KEYS[provider])}
          </p>
        </div>

        <ol className="space-y-0 overflow-hidden rounded-xl border border-line bg-surface">
          {PROVIDER_STEP_KEYS[provider].map((stepKey, i) => (
            <li
              key={stepKey}
              className="flex gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <span className="label-data mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-700">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-ink-soft">{t(stepKey)}</span>
            </li>
          ))}
        </ol>

        <a
          href={info.consoleUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-700 underline decoration-gold-200 underline-offset-4 transition-colors hover:decoration-gold-500"
        >
          {t("byok.openProvider", { name: info.name })}
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>

      {connected ? (
        <div className="animate-pop flex flex-wrap items-center gap-3 rounded-xl border border-sage-100 bg-sage-50 px-4 py-3.5">
          <CheckCircle2 className="size-5 text-sage-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">
              {t("byok.connected.title", { name: getProvider(result.provider).name })}
            </p>
            <p className="text-[13px] text-ink-soft">
              {t("byok.connected.body")}
            </p>
          </div>
          {onConnected && (
            <Button onClick={onConnected} size="sm">
              {t("byok.continue")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Field
            label={
              info.credentialLabel
                ? t("providers.ollama.credentialLabel")
                : t("byok.keyField.paste")
            }
            htmlFor="byok-key"
            hint={
              result && !result.valid
                ? undefined
                : t("byok.keyField.hint", { prefix: keyPrefix })
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
                aria-label={reveal ? t("byok.keyField.hide") : t("byok.keyField.show")}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint transition-colors hover:bg-sunk hover:text-ink"
              >
                {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          {info.defaultModel && (
            <Field
              label={t("byok.model.label")}
              htmlFor="byok-model"
              hint={t("byok.model.hint", { model: info.defaultModel })}
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
              {t("byok.notSaved")}
            </p>
          )}

          <Button
            onClick={handleValidate}
            loading={checking}
            disabled={!key.trim()}
            size="lg"
            full
          >
            {checking ? t("byok.checking", { name: info.name }) : submit}
          </Button>
        </div>
      )}
    </div>
  );
}
