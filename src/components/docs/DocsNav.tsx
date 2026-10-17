"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Download, Link2, Printer, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavSection {
  id: string;
  title: string;
  group: string;
}

/**
 * Section nav, search and export for /docs. The sections themselves are
 * server-rendered; search hides the ones whose text doesn't match.
 */
export function DocsNav({ sections, markdown }: { sections: NavSection[]; markdown: string }) {
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(sections[0]?.id);
  const [copied, setCopied] = useState(false);

  // Filter sections by their rendered text.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    const next = new Set<string>();
    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (!el) continue;
      const match = !q || (el.textContent ?? "").toLowerCase().includes(q);
      el.hidden = !match;
      if (!match) next.add(id);
    }
    // Group headings disappear when every section under them is filtered out.
    for (const group of new Set(sections.map((s) => s.group))) {
      const heading = document.getElementById(`group-${group}`);
      if (heading) heading.hidden = sections.filter((s) => s.group === group).every((s) => next.has(s.id));
    }
    // Syncing an external system (the server-rendered DOM) back into React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(next);
  }, [query, sections]);

  // Highlight the section in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  function downloadMarkdown() {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "benkyoai-docs.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context): the address bar still works.
    }
  }

  const groups = [...new Set(sections.map((s) => s.group))];
  const allHidden = hidden.size === sections.length;

  return (
    <div className="docs-chrome sticky top-0 z-20 -mx-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-6 lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <label className="relative block">
        <span className="sr-only">Search the docs</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the docs"
          className="h-9 w-full rounded-lg border border-line-strong bg-surface pr-3 pl-8 text-[13px] text-ink placeholder:text-ink-faint focus:border-gold-500 focus:outline-none"
        />
      </label>
      {allHidden && <p className="mt-2 text-[12px] text-ink-faint">Nothing matches “{query}”.</p>}

      {/* phones: one scrolling row of jump links; desktop: the full outline */}
      <nav aria-label="Sections" className="mt-3 -mx-1 flex gap-1 overflow-x-auto lg:mx-0 lg:block lg:max-h-[calc(100dvh-14rem)] lg:space-y-4 lg:overflow-y-auto">
        {groups.map((group) => (
          <div key={group} className="contents lg:block">
            <p className="label-data hidden px-2 text-ink-faint lg:block">{group}</p>
            <ul className="contents lg:mt-1 lg:block lg:space-y-0.5">
              {sections
                .filter((s) => s.group === group && !hidden.has(s.id))
                .map((s) => (
                  <li key={s.id} className="shrink-0">
                    <a
                      href={`#${s.id}`}
                      className={cn(
                        "block rounded-md px-2 py-1 text-[13px] whitespace-nowrap transition-colors",
                        active === s.id ? "bg-gold-50 text-ink" : "text-ink-soft hover:text-ink",
                      )}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-3 flex flex-wrap gap-1.5 lg:mt-5">
        <ToolButton onClick={downloadMarkdown} icon={<Download className="size-3.5" />}>
          Markdown
        </ToolButton>
        <ToolButton onClick={() => window.print()} icon={<Printer className="size-3.5" />}>
          PDF
        </ToolButton>
        <ToolButton
          onClick={copyLink}
          icon={copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
        >
          {copied ? "Copied" : "Copy link"}
        </ToolButton>
      </div>
    </div>
  );
}

function ToolButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[12px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
    >
      {icon}
      {children}
    </button>
  );
}
