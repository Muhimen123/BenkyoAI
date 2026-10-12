import Image from "next/image";
import { Mail } from "lucide-react";
import type { TeamMember } from "@/lib/docs/content";

const AVATAR = 96;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** Every card the same size; photos cropped to one square frame, initials when missing. */
export function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <li
          key={m.name}
          className="flex flex-col items-center rounded-xl border border-line bg-surface px-4 py-6 text-center"
        >
          <span className="relative block size-24 overflow-hidden rounded-full border-2 border-gold-200 bg-gold-50 ring-4 ring-surface">
            {m.photo ? (
              <Image
                src={m.photo}
                alt={`Photo of ${m.name}`}
                width={AVATAR}
                height={AVATAR}
                className="size-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-full items-center justify-center text-[26px] font-semibold tracking-tight text-gold-700"
              >
                {initials(m.name)}
              </span>
            )}
          </span>
          <p className="mt-4 text-[15px] font-semibold text-ink">{m.name}</p>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {m.role}
            {m.todo && <TodoTag />}
          </p>
          {m.email ? (
            <a
              href={`mailto:${m.email}`}
              className="mt-3 inline-flex max-w-full items-center gap-1.5 truncate text-[13px] text-gold-700 hover:underline"
            >
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{m.email}</span>
            </a>
          ) : (
            <p className="mt-3 text-[12px] text-ink-faint">Email to fill in</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function TodoTag() {
  return (
    <span className="ml-1.5 inline-block rounded border border-maize-100 bg-maize-50 px-1.5 py-px align-middle text-[10px] font-medium tracking-wide text-maize-700 uppercase">
      to fill in
    </span>
  );
}
