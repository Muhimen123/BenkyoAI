import { cn } from "@/lib/utils";
import type { NodeStatus } from "@/lib/types";

/**
 * The app's one recurring visual device: mastery as ten discrete ticks rather
 * than a smooth bar, so a glance tells you how many steps are actually held.
 */
export function MasteryMeter({
  value,
  status = "in-progress",
  size = "md",
  showValue = false,
  className,
}: {
  value: number;
  status?: NodeStatus;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}) {
  const filled = Math.round(value / 10);
  const tone =
    status === "mastered"
      ? "bg-sage-500"
      : value === 0
        ? "bg-line-strong"
        : "bg-gold-500";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="flex items-end gap-[3px]"
        role="img"
        aria-label={`${value}% mastered`}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "rounded-[1px] transition-colors duration-300",
              size === "sm" ? "w-[3px]" : "w-[4px]",
              i < filled
                ? cn(tone, size === "sm" ? "h-2.5" : "h-3.5")
                : cn("bg-line-strong/60", size === "sm" ? "h-1.5" : "h-2"),
            )}
          />
        ))}
      </span>
      {showValue && (
        <span
          className={cn(
            "label-data tabular-nums",
            status === "mastered" ? "text-sage-700" : "text-ink-soft",
          )}
        >
          {value}%
        </span>
      )}
    </span>
  );
}

export function StatusDot({ status }: { status: NodeStatus }) {
  return (
    <span
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        status === "mastered"
          ? "bg-sage-500"
          : status === "in-progress"
            ? "bg-gold-500"
            : "bg-line-strong",
      )}
    />
  );
}
