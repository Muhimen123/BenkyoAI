"use client";

import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Feedback";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatCost, formatTokens, totals } from "@/lib/pricing";
import { useStudyStore } from "@/store/useStudyStore";

/**
 * BYOK cost meter. Every AI call reports its token usage back to the browser,
 * so the learner can see what their own key is spending — on this roadmap and
 * today — without any server keeping a record.
 */
export function UsageMeter({ roadmapId }: { roadmapId: string }) {
  const { t } = useT();
  const usage = useStudyStore((s) => s.usage);
  const today = new Date().toDateString();

  const roadmap = totals(usage.filter((u) => u.roadmapId === roadmapId));
  const day = totals(usage.filter((u) => new Date(u.at).toDateString() === today));

  return (
    <Card className="space-y-4">
      <div>
        <Eyebrow>{t("usage.eyebrow")}</Eyebrow>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[24px] leading-none font-semibold tracking-tight text-ink tabular-nums">
            {formatCost(roadmap.cost)}
          </span>
          <span className="text-[13px] text-ink-soft">{t("usage.estOnRoadmap")}</span>
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t border-line pt-4 text-[13px]">
        <Stat label={t("usage.calls")} value={String(roadmap.calls)} />
        <Stat label={t("usage.tokensIn")} value={formatTokens(roadmap.inputTokens)} />
        <Stat label={t("usage.tokensOut")} value={formatTokens(roadmap.outputTokens)} />
      </dl>
      <p className="text-[12px] leading-snug text-ink-faint">
        {t("usage.todayNote", { calls: day.calls, cost: formatCost(day.cost) })}
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
