"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import { ByokSetup } from "@/components/byok/ByokSetup";
import { MemoryStrip, RoadmapPreview } from "@/components/onboarding/RoadmapPreview";
import {
  BuildingRoadmap,
  CalibrationStep,
  PurposeStep,
  TopicStep,
} from "@/components/onboarding/Steps";
import {
  Step1Loader,
  Step2Loader,
  Step3Loader,
  Step4Loader,
} from "@/components/onboarding/OnboardingLoaders";
import { generateRoadmap } from "@/lib/api/roadmap";
import { summarizeMaterial } from "@/lib/api/summarize";
import { useStudyStore } from "@/store/useStudyStore";

const STEPS = [
  { id: "key", label: "Connect a key" },
  { id: "topic", label: "Your topic" },
  { id: "level", label: "Your level" },
  { id: "purpose", label: "Your reason" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useStudyStore((s) => s.hydrated);
  const connection = useStudyStore((s) => s.connection);
  const roadmap = useStudyStore((s) => s.roadmap);
  const materials = useStudyStore((s) => s.materials);
  const draft = useStudyStore((s) => s.draft);
  const setDraft = useStudyStore((s) => s.setDraft);
  const setRoadmap = useStudyStore((s) => s.setRoadmap);
  const setSummary = useStudyStore((s) => s.setSummary);

  const [step, setStep] = useState(0);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only leave if there's both a roadmap AND a key. Without the key check this
  // ping-pongs against AppShell, which sends keyless visitors back here.
  useEffect(() => {
    if (hydrated && roadmap && connection) router.replace("/dashboard");
  }, [hydrated, roadmap, connection, router]);

  useEffect(() => {
    if (hydrated && connection && step === 0) setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Someone who removed their key still has everything else — they need step 0,
  // not the whole flow again.
  const reconnecting = Boolean(hydrated && roadmap && !connection);
  const canShow = hydrated && (!roadmap || !connection);

  const level = useMemo(() => {
    const levels = draft.calibration.map((a) => Number(a.optionId.split(":")[1] ?? 0));
    if (!levels.length) return 0;
    return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
  }, [draft.calibration]);

  async function build() {
    if (!draft.purpose) return;
    setBuilding(true);
    setError(null);
    try {
      const materialIds = materials.map((m) => m.id);
      const created = await generateRoadmap({
        topic: draft.topic,
        materialIds,
        calibration: draft.calibration,
        purpose: draft.purpose,
        deadline: draft.deadline || undefined,
      });
      if (materialIds.length) {
        setSummary(await summarizeMaterial({ materialIds, topic: created.title }));
      }
      setRoadmap(created);
      router.push("/dashboard");
    } catch {
      setBuilding(false);
      setError("The roadmap didn't come back. Check your key in step one and try again.");
    }
  }

  function renderStep() {
    if (building) return <BuildingRoadmap topic={draft.topic} />;
    if (step === 0)
      return (
        <ByokSetup
          heading={reconnecting ? "Reconnect an AI key" : "First, connect an AI key"}
          onConnected={() => (reconnecting ? router.replace("/dashboard") : setStep(1))}
        />
      );
    if (step === 1)
      return (
        <TopicStep
          topic={draft.topic}
          onTopicChange={(topic) => setDraft({ topic })}
          onNext={() => setStep(2)}
        />
      );
    if (step === 2)
      return (
        <CalibrationStep
          topic={draft.topic}
          answers={draft.calibration}
          onAnswer={(answer) =>
            setDraft({
              calibration: [
                ...draft.calibration.filter((a) => a.questionId !== answer.questionId),
                answer,
              ],
            })
          }
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      );
    return (
      <PurposeStep
        purpose={draft.purpose}
        deadline={draft.deadline}
        onPurposeChange={(purpose) => setDraft({ purpose })}
        onDeadlineChange={(deadline) => setDraft({ deadline })}
        onBack={() => setStep(2)}
        onSubmit={build}
        submitting={building}
      />
    );
  }

  const current = building ? 3 : step;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-paper text-ink">
      {/* ambient: a faint ruled grid, the way squared paper sits under notes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(120% 80% at 70% 0%, #000 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(120% 80% at 70% 0%, #000 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 size-[520px] rounded-full bg-gold-50 blur-3xl"
      />

      {/* a hairline that fills as the flow progresses — the only chrome up top */}
      <div className="fixed inset-x-0 top-0 z-40 h-0.5 bg-line">
        <div
          className="h-full bg-gold-500 transition-all duration-700"
          style={{ width: `${((current + (building ? 1 : 0)) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-8 sm:pt-14 lg:pt-20">
        <header className="flex items-center justify-end gap-4">
          <p className="label-data hidden text-ink-faint sm:block">
            No accounts · Runs on your key
          </p>
        </header>

        <div className="mt-10 grid gap-x-16 gap-y-8 border-b border-line pb-10 lg:mt-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:pb-14">
          <div>
            <h1 className="text-[34px] leading-[1.05] font-semibold tracking-tight text-ink sm:text-[46px] lg:text-[54px]">
              Study that
              <br />
              remembers what
              <br />
              <span className="relative inline-block">
                you got wrong
                <span className="absolute inset-x-0 -bottom-1 h-2 -skew-x-6 bg-maize-100" />
              </span>
              .
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-soft">
              A roadmap built around where you actually are. Practice at every
              step. Old mistakes folded quietly back in until they stop being
              mistakes.
            </p>

            {/* the four moves, as a typed sequence rather than a card grid */}
            <ol className="mt-8 flex flex-wrap items-center gap-x-1 gap-y-2">
              {STEPS.map((s, i) => (
                <li key={s.id} className="flex items-center gap-1">
                  <span
                    className={
                      i <= current
                        ? "label-data rounded-md bg-gold-50 px-1.5 py-0.5 text-gold-700 transition-colors"
                        : "label-data rounded-md px-1.5 py-0.5 text-ink-faint transition-colors"
                    }
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="text-ink-faint" aria-hidden>
                      &rarr;
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* the payoff, drawn live */}
          <div className="lg:pt-2">
            {canShow && (
              <RoadmapPreview
                step={0} // Always show logo card on all onboarding steps
                topic={draft.topic}
                level={level}
                purpose={draft.purpose}
                deadline={draft.deadline}
              />
            )}
            {canShow && <MemoryStrip active={step >= 1} />}
          </div>
        </div>
      </div>

      {/* FULL WIDTH bottom section with light geometric pattern background */}
      <div className="border-t border-line pattern-steps-bg bg-surface/30 py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <main className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              {!canShow ? (
                <div className="h-40" aria-hidden />
              ) : (
                <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-sm">
                  {reconnecting && step === 0 && (
                    <p className="mb-6 flex items-start gap-2.5 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-[13px] leading-snug text-gold-700">
                      <KeyRound className="mt-0.5 size-3.5 shrink-0" />
                      Your key was removed. Your roadmap, materials and progress are
                      untouched — connect a key and you&apos;ll land straight back on
                      them.
                    </p>
                  )}
                  {error && (
                    <p className="mb-6 rounded-lg border border-clay-100 bg-clay-50 px-4 py-3 text-[13px] text-clay-700">
                      {error}
                    </p>
                  )}
                  <div key={building ? "building" : step} className="animate-rise">
                    {renderStep()}
                  </div>
                </div>
              )}
            </div>

            <aside className="hidden lg:block space-y-6">
              {/* Step info card — loader now sits beside the number, inside this card */}
              <div className="rounded-2xl border border-sage-100 bg-sage-50 p-6 sm:p-8 shadow-sm h-fit">
                <div className="sticky top-24">
                  <p className="label-data text-sage-600 font-semibold">
                    Step {String(current + 1).padStart(2, "0")} of{" "}
                    {String(STEPS.length).padStart(2, "0")}
                  </p>

                  <div className="-mt-6 flex items-center gap-40">
                    <p
                      aria-hidden
                      className="text-[180px] leading-none font-bold tracking-tighter text-sage-200/90 select-none"
                    >
                      {current + 1}
                    </p>
                    <div aria-hidden className="flex w-16 shrink-0 items-center justify-center self-center">
                      {current === 0 && <Step1Loader />}
                      {current === 1 && <Step2Loader />}
                      {current === 2 && <Step3Loader />}
                      {current === 3 && <Step4Loader />}
                    </div>
                  </div>

                  <p className="-mt-4 max-w-[22ch] text-[13px] leading-snug font-medium text-sage-700">
                    {STEPS[current].label}
                  </p>
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
}
