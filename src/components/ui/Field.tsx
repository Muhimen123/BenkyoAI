import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  optional,
}: {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
        </label>
        {optional && <span className="label-data text-ink-faint">optional</span>}
      </div>
      {children}
      {error ? (
        <p className="text-[13px] leading-snug text-clay-700">{error}</p>
      ) : hint ? (
        <p className="text-[13px] leading-snug text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

const base =
  "w-full rounded-lg border border-line-strong bg-surface px-3.5 text-ink placeholder:text-ink-faint transition-colors hover:border-ink-faint focus:border-gold-500 focus:outline-none disabled:opacity-50";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(base, "h-11 text-[15px]", className)} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...rest} className={cn(base, "py-3 text-[15px] leading-relaxed", className)} />
  );
}
