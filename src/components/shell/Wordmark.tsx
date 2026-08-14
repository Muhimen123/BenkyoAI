import Image from "next/image";
import { cn } from "@/lib/utils";

/** Navbar wordmark — icon (logo-mark.svg) + "BenkyoAI" text, height-capped to fit the h-14 header. */
export function Wordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo-mark.svg"
        alt=""
        width={80}
        height={40}
        className={cn(
          "w-auto object-contain",
          size === "sm" ? "h-6" : size === "lg" ? "h-9" : "h-7",
        )}
      />
      <span
        className={cn(
          "wordmark leading-none text-ink select-none",
          size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl",
        )}
      >
        BenkyoAI
      </span>
    </span>
  );
}

