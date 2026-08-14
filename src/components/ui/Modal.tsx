"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="animate-fade absolute inset-0 bg-[#2e2112]/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-rise relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface sm:rounded-2xl",
          width === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h2>
            {description && (
              <p className="mt-1 text-[13px] leading-snug text-ink-soft">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-md p-1 text-ink-faint transition-colors hover:bg-sunk hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-line bg-sunk px-5 py-3.5 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
