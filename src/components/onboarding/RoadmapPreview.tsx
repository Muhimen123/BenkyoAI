"use client";

import Image from "next/image";
import { useState } from "react";
import { Flag, Lock } from "lucide-react";
import type { Purpose } from "@/lib/types";
import { cn, daysUntil, titleCase } from "@/lib/utils";


/**
 * The onboarding's signature element: the roadmap card assembles itself as the
 * user answers. It shows the real structure they're about to get — the same
 * ledger rows and tick meters used everywhere else in the app — so the payoff is
 * visible before they commit to anything.
 */

const SKELETON_ROWS = [
  { title: "Ground rules", milestone: false },
  { title: "Core mechanics", milestone: true },
  { title: "Applying it under pressure", milestone: false },
  { title: "Depth and connections", milestone: true },
  { title: "Bringing it together", milestone: false },
];

const PACING: Record<Purpose, { label: string; sessions: string }> = {
  exam: { label: "Tight cycles, heavy recall", sessions: "5 sessions a week · 35 min" },
  project: { label: "Deep where you'll build", sessions: "3 sessions a week · 45 min" },
  job: { label: "Front-loads the assumed basics", sessions: "4 sessions a week · 30 min" },
  curiosity: { label: "Unhurried, follows your interest", sessions: "2 sessions a week · 25 min" },
};

export function RoadmapPreview({
  step,
  topic,
  level,
  purpose,
  deadline,
}: {
  /** 0 key · 1 topic · 2 calibration · 3 purpose · 4 building */
  step: number;
  topic: string;
  /** Average calibration level, 1–4. 0 while unanswered. */
  level: number;
  purpose: Purpose | null;
  deadline?: string;
}) {
  const hasTopic = step >= 2 && topic.trim().length > 2;
  const rowsVisible = step === 0 ? 0 : step === 1 ? 2 : SKELETON_ROWS.length;
  const days = daysUntil(deadline);

  /* ── step 0: 3D brand card ── */
  if (step === 0) return <BrandCard />;


  return (
    <figure className="space-y-3">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-surface transition-colors duration-500",
          step === 0 ? "border-line" : "border-line-strong",
        )}
      >
        {/* card header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
          <div className="min-w-0">
            <p className="label-data text-ink-faint">Your roadmap</p>
            {hasTopic ? (
              <p className="animate-fade mt-1 truncate text-[15px] leading-snug font-semibold tracking-tight text-ink">
                {titleCase(topic).slice(0, 42)}
              </p>
            ) : (
              <div className="mt-2 h-3 w-32 rounded-full bg-line" />
            )}
          </div>
          {step === 0 ? (
            <Lock className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
          ) : (
            <span className="label-data shrink-0 tabular-nums text-ink-faint">
              {rowsVisible} topics
            </span>
          )}
        </div>

        {/* ledger rows */}
        <ul className="divide-y divide-line">
          {SKELETON_ROWS.map((row, i) => {
            const visible = i < rowsVisible;
            // Calibration gives the earliest rows a head start.
            const filled =
              level > 0 ? Math.max(0, Math.round((level - 1) * 2.2) - i * 2) : 0;
            return (
              <li
                key={row.title}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-all duration-500",
                  visible ? "opacity-100" : "translate-y-1 opacity-25",
                )}
                style={visible ? { animationDelay: `${i * 70}ms` } : undefined}
              >
                <span className="label-data w-4 shrink-0 tabular-nums text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  {visible && step >= 2 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] text-ink-soft">
                        {row.title}
                      </span>
                      {row.milestone && (
                        <Flag className="size-2.5 shrink-0 text-gold-500" />
                      )}
                    </span>
                  ) : (
                    <span
                      className="block h-2 rounded-full bg-line"
                      style={{ width: `${72 - i * 9}%` }}
                    />
                  )}
                </span>
                <span className="flex shrink-0 items-end gap-[3px]" aria-hidden>
                  {Array.from({ length: 10 }).map((_, tick) => (
                    <span
                      key={tick}
                      className={cn(
                        "w-[3px] rounded-[1px] transition-all duration-500",
                        tick < filled
                          ? "h-2.5 bg-gold-500"
                          : "h-1.5 bg-line-strong/60",
                      )}
                      style={{ transitionDelay: `${tick * 25}ms` }}
                    />
                  ))}
                </span>
              </li>
            );
          })}
        </ul>

        {/* pacing footer */}
        <div
          className={cn(
            "border-t border-line px-4 py-3 transition-all duration-500",
            purpose ? "bg-gold-50 opacity-100" : "bg-sunk opacity-60",
          )}
        >
          {purpose ? (
            <div className="animate-fade space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="label-data text-gold-700">
                  {PACING[purpose].sessions}
                </span>
                {days !== null && days > 0 && (
                  <span className="label-data tabular-nums text-ink-faint">
                    {days} days left
                  </span>
                )}
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-gold-100">
                <div
                  className="h-full rounded-full bg-gold-500 transition-all duration-700"
                  style={{ width: days !== null && days > 0 ? "34%" : "18%" }}
                />
              </div>
              <p className="text-[13px] leading-snug text-ink-soft">
                {PACING[purpose].label}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-1 flex-1 rounded-full bg-line" />
              <span className="label-data text-ink-faint">pacing</span>
            </div>
          )}
        </div>


      </div>

      <figcaption className="text-[13px] leading-snug text-ink-faint">
        {step === 0
          ? "Topics land here once you tell BenkyoAI what you're learning."
          : step === 1
            ? "Structure first — your material reshapes it in the next step."
            : step === 2
              ? "Ticks show mastery. Your answers set where the first ones start."
              : "Purpose sets the pace. A deadline tightens it."}
      </figcaption>
    </figure>
  );
}

/**
 * The second half of the promise, shown as a small timeline: a missed item
 * doesn't go in a review pile, it comes back inside later lessons until it holds.
 */
export function MemoryStrip({ active }: { active: boolean }) {
  const stages = [
    { label: "missed", tone: "clay" as const, day: "day 1" },
    { label: "blended back in", tone: "maize" as const, day: "day 3" },
    { label: "held, unaided", tone: "sage" as const, day: "day 9" },
  ];

  const TONE = {
    clay: "border-clay-100 bg-clay-50 text-clay-700",
    maize: "border-maize-100 bg-maize-50 text-maize-700",
    sage: "border-sage-100 bg-sage-50 text-sage-700",
  };

  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="label-data text-ink-faint">One mistake, over three sessions</p>
      <ol className="mt-3 flex items-center gap-1.5">
        {stages.map((stage, i) => (
          <li key={stage.label} className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                "label-data inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-all duration-700",
                TONE[stage.tone],
                active ? "opacity-100" : "opacity-40",
              )}
              style={{ transitionDelay: `${i * 220}ms` }}
            >
              <span
                className={cn(
                  "size-1 rounded-full",
                  stage.tone === "clay"
                    ? "bg-clay-500"
                    : stage.tone === "maize"
                      ? "bg-maize-700"
                      : "bg-sage-500",
                )}
              />
              <span className="truncate">{stage.label}</span>
            </span>
            {i < stages.length - 1 && (
              <span className="h-px w-3 shrink-0 bg-line-strong" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * 3D brand card shown on onboarding step 0.
 * Inspired by Uiverse.io/Smit-Prajapati — adapted to BenkyoAI's gold/green palette.
 */
function BrandCard() {
  const [hovered, setHovered] = useState(false);

  const circleBase = (width: string, background: string, delay: string, zNormal: number, zHover: number): React.CSSProperties => ({
    display: "block",
    position: "absolute",
    borderRadius: "50%",
    width,
    height: width,
    left: "50%",
    top: "40%",
    background,
    transition: "transform 0.5s ease-in-out",
    transitionDelay: delay,
    transform: hovered
      ? `translate(-50%, -50%) translate3d(0, 0, ${zHover}px)`
      : `translate(-50%, -50%) translate3d(0, 0, ${zNormal}px)`,
    boxShadow: "rgba(10, 40, 0, 0.1) -2px 4px 10px 0px",
  });

  return (
    <figure className="space-y-4">
      {/* perspective wrapper */}
      <div
        style={{ perspective: "1000px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full flex justify-center py-6"
      >
        {/* square green card deck */}
        <div
          style={{
            position: "relative",
            width: "380px",
            height: "380px",
            borderRadius: "32px",
            background:
              "linear-gradient(135deg, #1b2e0e 0%, #243d12 45%, #6b5214 100%)",
            transformStyle: "preserve-3d",
            transform: hovered
              ? "rotate3d(1, 1, 0, 20deg)"
              : "rotate3d(0, 0, 0, 0deg)",
            transition: "transform 0.5s ease-in-out, box-shadow 0.5s ease-in-out",
            boxShadow: hovered
              ? "rgba(8, 40, 0, 0.35) 28px 48px 25px -40px, rgba(8, 40, 0, 0.15) 0px 25px 30px 0px"
              : "rgba(8, 40, 0, 0.22) 0px 20px 25px -5px",
          }}
        >
          {/* subtle inner glass frame to look like a deck edge */}
          <div
            style={{
              position: "absolute",
              inset: "10px",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              pointerEvents: "none",
              transform: "translate3d(0, 0, 10px)",
            }}
          />

          {/* ── concentric gold circles centered behind the book ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              pointerEvents: "none",
            }}
          >
            {/* circle 1 — outermost */}
            <span style={circleBase("260px", "rgba(221, 156, 0, 0.08)", "0s", 15, 25)} />
            {/* circle 2 */}
            <span style={circleBase("210px", "rgba(221, 156, 0, 0.12)", "0.1s", 30, 50)} />
            {/* circle 3 */}
            <span style={circleBase("160px", "rgba(221, 156, 0, 0.18)", "0.2s", 45, 75)} />
            {/* circle 4 */}
            <span style={circleBase("110px", "rgba(221, 156, 0, 0.25)", "0.3s", 60, 100)} />
            {/* circle 5 — innermost, holds sparkle */}
            <span
              style={{
                ...circleBase("54px", "rgba(221, 156, 0, 0.45)", "0.4s", 75, 120),
                display: "grid",
                placeContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
                  fill="white"
                  opacity="0.95"
                />
              </svg>
            </span>
          </div>

          {/* ── transparent book SVG & typography centered and floating ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              transform: hovered ? "translate3d(0, 0, 50px)" : "translate3d(0, 0, 35px)",
              transformStyle: "preserve-3d",
              transition: "transform 0.5s ease-in-out",
            }}
          >
            {/* Inline transparent SVG Book (scaled up) */}
            <svg
              viewBox="80 20 320 320"
              className="h-32 w-32 drop-shadow-2xl transition-transform duration-500"
              style={{
                transform: hovered ? "scale(1.06)" : "scale(1)",
              }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Open book – left page (Harvest Gold) */}
              <path
                d="M 232 276 L 118 276 L 118 138 Q 175 112 232 116 Z"
                fill="#DD9C00"
              />
              {/* Left page inner highlight strip near spine */}
              <path
                d="M 206 276 L 188 276 L 188 119 Q 210 114 232 116 L 232 276 Z"
                fill="#FAE45E"
                opacity="0.30"
              />
              {/* Left page ruled lines */}
              <line x1="131" y1="155" x2="223" y2="150" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
              <line x1="131" y1="172" x2="223" y2="168" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
              <line x1="131" y1="189" x2="223" y2="185" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
              <line x1="131" y1="206" x2="223" y2="203" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
              <line x1="131" y1="223" x2="223" y2="221" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.30" />
              {/* Open book – right page (Maize) */}
              <path
                d="M 248 276 L 362 276 L 362 138 Q 305 112 248 116 Z"
                fill="#FAE45E"
              />
              {/* Right page inner shadow strip near spine */}
              <path
                d="M 274 276 L 292 276 L 292 119 Q 270 114 248 116 L 248 276 Z"
                fill="#DD9C00"
                opacity="0.35"
              />
              {/* Right page ruled lines */}
              <line x1="349" y1="155" x2="257" y2="150" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
              <line x1="349" y1="172" x2="257" y2="168" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
              <line x1="349" y1="189" x2="257" y2="185" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
              <line x1="349" y1="206" x2="257" y2="203" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
              <line x1="349" y1="223" x2="257" y2="221" stroke="#563D23" strokeWidth="2.5" strokeLinecap="round" opacity="0.22" />
              {/* Spine shadow */}
              <rect x="232" y="116" width="16" height="160" fill="#563D23" opacity="0.18" />
              {/* Book bottom shadow ellipse */}
              <ellipse cx="240" cy="278" rx="72" ry="7" fill="#1A2B06" opacity="0.5" />
              {/* AI spark at spine top */}
              <circle cx="240" cy="104" r="18" fill="#FAE45E" opacity="0.12" />
              <circle cx="240" cy="104" r="13" fill="#FAE45E" opacity="0.18" />
              {/* 4-point star */}
              <path
                d="M 240 88 L 243.5 100.5 L 256 104 L 243.5 107.5 L 240 120 L 236.5 107.5 L 224 104 L 236.5 100.5 Z"
                fill="#FAE45E"
              />
              {/* Tiny satellite dots — AI / neural feel */}
              <circle cx="265" cy="91" r="2.8" fill="#A7A865" opacity="0.9" />
              <circle cx="215" cy="91" r="2.8" fill="#A7A865" opacity="0.9" />
              <circle cx="270" cy="116" r="2" fill="#A7A865" opacity="0.65" />
              <circle cx="210" cy="116" r="2" fill="#A7A865" opacity="0.65" />
            </svg>

            {/* Typography */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              <span
                style={{
                  fontSize: "30px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "rgba(255, 255, 255, 0.95)",
                  lineHeight: 1,
                }}
              >
                Benkyo<span style={{ color: "#f0d69b" }}>AI</span>
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "rgba(255, 255, 255, 0.35)",
                  letterSpacing: "0.25em",
                  marginRight: "-0.25em",
                  lineHeight: 1.2,
                }}
              >
                勉強
              </span>
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255, 255, 255, 0.45)",
                  fontWeight: 500,
                  marginTop: "2px",
                }}
              >
                Study smarter
              </span>
            </div>
          </div>
        </div>
      </div>

      <figcaption className="text-[13px] leading-snug text-ink-faint text-center">
        Topics land here once you tell BenkyoAI what you&apos;re learning.
      </figcaption>
    </figure>
  );
}
