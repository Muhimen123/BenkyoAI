"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { Compass, KeyRound, Library, Settings2 } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Wordmark";
import { KeyStatus } from "./KeyStatus";
import { GitHubLink } from "./GitHubLink";
import { ByokSetup } from "@/components/byok/ByokSetup";
import { LanguageToggle } from "@/components/shell/LanguageToggle";
import { useT } from "@/lib/i18n/LocaleProvider";

const NAV = [
  { href: "/dashboard", labelKey: "shell.nav.today", icon: Compass },
  { href: "/vault", labelKey: "shell.nav.vault", icon: Library },
  { href: "/settings", labelKey: "shell.nav.settings", icon: Settings2 },
] as const;

export function AppShell({
  children,
  width = "default",
  /** Screens that run their own full-bleed layout (exam night, practice). */
  bare = false,
}: {
  children: ReactNode;
  width?: "default" | "wide";
  bare?: boolean;
}) {
  const pathname = usePathname();
  const hydrated = useStudyStore((s) => s.hydrated);
  const connection = useStudyStore((s) => s.connection);
  const examNight = useStudyStore((s) => s.examNight);
  const { t } = useT();

  // No accounts to check — the only gate is whether a key is connected. The
  // gate renders in place rather than redirecting: bouncing between routes on a
  // missing key is what caused the loop when someone removed their key.
  const gated = hydrated && !connection;
  const navItems = NAV.map((n) => ({ ...n, label: t(n.labelKey) }));

  return (
    <div
      data-mode={examNight ? "exam-night" : undefined}
      className="min-h-dvh bg-paper text-ink"
    >
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
        <div
          className={cn(
            "mx-auto flex h-14 items-center gap-6 px-4 sm:px-6",
            width === "wide" ? "max-w-7xl" : "max-w-5xl",
          )}
        >
          <Link href="/dashboard" className="shrink-0">
            <Wordmark size="sm" />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-sunk font-medium text-ink"
                      : "text-ink-soft hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto sm:ml-0 flex items-center gap-2">
            <LanguageToggle />
            <GitHubLink />
            <KeyStatus />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto px-4 pb-28 sm:px-6 sm:pb-16",
          bare ? "pt-0" : "pt-6 sm:pt-10",
          width === "wide" ? "max-w-7xl" : "max-w-5xl",
        )}
      >
        {gated ? <KeyGate /> : children}

        <footer className="mx-auto mt-10 max-w-5xl pb-24 text-center text-[11px] text-ink-faint sm:pb-6">
          {t("common.footerCopyright", { year: new Date().getFullYear() })}
        </footer>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                  active ? "text-ink" : "text-ink-faint",
                )}
              >
                <Icon className={cn("size-5", active && "text-gold-500")} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}

/** Page-level heading used across screens — keeps type hierarchy consistent. */
export function PageHead({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="max-w-xl">
        {eyebrow && <p className="label-data mb-2 text-gold-700">{eyebrow}</p>}
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-ink sm:text-[32px]">
          {title}
        </h1>
        {lede && (
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{lede}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

/** Shown in place of any screen's content while no key is connected. */
function KeyGate() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-6 flex items-start gap-2.5 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-[13px] leading-snug text-gold-700">
        <KeyRound className="mt-0.5 size-3.5 shrink-0" />
        {t("shell.keyGate.body")}
      </p>
      <ByokSetup heading={t("shell.keyGate.heading")} submitLabel={t("common.connectKey")} />
    </div>
  );
}
