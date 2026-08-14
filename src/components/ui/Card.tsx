import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "plain" | "sunk" | "accent" | "review";
  inset?: boolean;
}

const TONES = {
  plain: "bg-surface border-line",
  sunk: "bg-sunk border-line",
  accent: "bg-gold-50 border-gold-200",
  review: "bg-maize-50 border-maize-100",
};

export function Card({ tone = "plain", inset = true, className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn("rounded-xl border", TONES[tone], inset && "p-5 sm:p-6", className)}
    />
  );
}
