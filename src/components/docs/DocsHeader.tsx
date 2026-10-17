import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/shell/Wordmark";

/** The thin top bar shared by /docs, its admin panel and the closed page. */
export function DocsHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="docs-chrome border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/">
          <Wordmark size="sm" />
        </Link>
        <nav className="flex items-center gap-4 text-[13px] font-medium text-ink-soft">
          {children}
          <a href="https://github.com/Muhimen123/BenkyoAI" className="hover:text-ink">
            GitHub
          </a>
          <Link href="/dashboard" className="hover:text-ink">
            Open the app
          </Link>
        </nav>
      </div>
    </header>
  );
}
