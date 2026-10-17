import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-line/70", className)}
      aria-hidden
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-dashed border-line-strong px-5 py-8 sm:px-8",
        className,
      )}
    >
      {icon && <span className="text-gold-500">{icon}</span>}
      <div className="space-y-1">
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("label-data text-ink-faint", className)}>{children}</p>
  );
}

/** A failed request, said plainly, with an optional way to try again. */
export function ErrorNote({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-clay-100 bg-clay-50 px-4 py-3 text-[13px] text-clay-700",
        className,
      )}
    >
      <p>{children}</p>
      {action}
    </div>
  );
}
