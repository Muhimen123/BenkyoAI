"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Renders a Mermaid definition client-side (strict security: no scripts, no HTML injection). */
export function Mermaid({ definition, className }: { definition: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const renderId = `mmd${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: "inherit",
          flowchart: { htmlLabels: true, curve: "basis" },
        });
        const { svg } = await mermaid.render(renderId, definition);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not draw the diagram.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [definition, renderId]);

  if (error) return <p className="text-[13px] text-clay-700">{error}</p>;
  return (
    <div
      ref={ref}
      className={`overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full ${className ?? ""}`}
    />
  );
}
