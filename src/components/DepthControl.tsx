"use client";

import { Segmented } from "@/components/ui/Segmented";
import { useStudyStore } from "@/store/useStudyStore";
import type { Depth } from "@/lib/types";
import { cn } from "@/lib/utils";

const NOTE: Record<Depth, string> = {
  brief: "The shortest version that's still true. Good for revision.",
  balanced: "Explanation, one example, one edge case.",
  deep: "Derivations, why it works, and where it breaks.",
};

/** Explanation depth — an effort dial, not a settings switch. */
export function DepthControl({
  size = "sm",
  showNote = true,
  className,
}: {
  size?: "sm" | "md";
  showNote?: boolean;
  className?: string;
}) {
  const depth = useStudyStore((s) => s.depth);
  const setDepth = useStudyStore((s) => s.setDepth);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2.5">
        <span className="label-data shrink-0 text-ink-faint">Depth</span>
        <Segmented<Depth>
          ariaLabel="Explanation depth"
          size={size}
          value={depth}
          onChange={setDepth}
          options={[
            { value: "brief", label: "Brief" },
            { value: "balanced", label: "Balanced" },
            { value: "deep", label: "Deep" },
          ]}
        />
      </div>
      {showNote && <p className="text-[13px] text-ink-soft">{NOTE[depth]}</p>}
    </div>
  );
}
