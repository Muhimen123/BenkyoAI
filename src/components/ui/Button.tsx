"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "deep" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "btn-premium-gold bg-gold-200 text-ink border border-gold-300 active:translate-y-px shadow-sm",
  secondary:
    "btn-premium bg-surface text-ink border border-line-strong hover:border-ink-faint active:translate-y-px shadow-sm",
  ghost: "text-ink-soft hover:bg-sunk hover:text-ink border border-transparent",
  deep: "btn-premium bg-moss-900 text-[#f3f1e6] border border-moss-900 active:translate-y-px shadow-sm",
  danger:
    "bg-surface text-clay-700 border border-clay-100 hover:bg-clay-50 active:translate-y-px",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  full,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        full && "w-full",
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
