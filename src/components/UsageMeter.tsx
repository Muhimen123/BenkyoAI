"use client";

import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Feedback";
import { formatCost, formatTokens, totals } from "@/lib/pricing";
import { useStudyStore } from "@/store/useStudyStore";

/**
 * BYOK cost meter. Every AI call reports its token usage back to the browser,
 * so the learner can see what their own key is spending — on this roadmap and
 * today — without any server keeping a record.
 */
export function UsageMeter({ roadmapId }: { roadmapId: string }) {
  const usage = useStudyStore((s) => s.usage);
  const today = new Date().toDateString();

  const roadmap = totals(usage.filter((u) => u.roadmapId === roadmapId));
  const day = totals(usage.filter((u) => new Date(u.at).toDateString() === today));

  return (
    <Card className="space-y-4">
      <div>
        <Eyebrow>AI usage on your key</Eyebrow>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[24px] leading-none font-semibold tracking-tight text-ink tabular-nums">
            {formatCost(roadmap.cost)}
          </span>
          <span className="text-[13px] text-ink-soft">est. on this roadmap</span>
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t border-line pt-4 text-[13px]">
        <Stat label="Calls" value={String(roadmap.calls)} />
        <Stat label="Tokens in" value={formatTokens(roadmap.inputTokens)} />
        <Stat label="Tokens out" value={formatTokens(roadmap.outputTokens)} />
      </dl>
      <p className="text-[12px] leading-snug text-ink-faint">
        Today across all roadmaps: {day.calls} calls, {formatCost(day.cost)}. Gemini is
        estimated at paid-tier list prices (free-tier keys are not charged), local
        Ollama models are free, and other providers are counted in tokens only.
      </p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  );
}
