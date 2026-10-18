"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import { getProvider } from "@/lib/api/providers";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LocaleProvider";

/** Always-visible answer to "is my key working right now". */
export function KeyStatus({ className }: { className?: string }) {
  const connection = useStudyStore((s) => s.connection);
  const hydrated = useStudyStore((s) => s.hydrated);
  const { t } = useT();

  if (!hydrated) return <span className={cn("h-7 w-24", className)} />;

  const invalid = !connection || connection.status === "invalid";
  const provider = connection ? getProvider(connection.provider).name : null;

  return (
    <Link
      href="/settings"
      aria-label={
        connection
          ? t("shell.keyStatus.ariaConnected", { provider: getProvider(connection.provider).name })
          : t("shell.keyStatus.ariaNone")
      }
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors",
        invalid
          ? "border-clay-100 bg-clay-50 hover:border-clay-500"
          : "border-line bg-surface hover:border-line-strong",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span
          className={cn(
            "absolute inline-flex size-full rounded-full",
            invalid ? "bg-clay-500" : "bg-sage-500",
          )}
        />
        {!invalid && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage-500 opacity-40" />
        )}
      </span>
      <span
        className={cn(
          "label-data hidden sm:inline",
          invalid ? "text-clay-700" : "text-ink-soft",
        )}
      >
        {connection ? provider : t("shell.keyStatus.noKey")}
      </span>
      <KeyRound
        className={cn(
          "size-3.5 sm:hidden",
          invalid ? "text-clay-700" : "text-ink-soft",
        )}
      />
    </Link>
  );
}
