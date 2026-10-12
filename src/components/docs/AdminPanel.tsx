"use client";

import { useActionState, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ErrorNote } from "@/components/ui/Feedback";
import {
  resetVisibility,
  saveVisibility,
  signIn,
  type ActionResult,
} from "@/app/docs/admin/actions";
import { showcaseWindow, type DocsAccessConfig, type DocsAccessStatus } from "@/lib/docs/access";

export function AdminSignIn() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(signIn, null);
  return (
    <Card>
      <form action={action} className="space-y-4">
        <Field label="Admin token" htmlFor="docs-token" hint="The value of DOCS_ADMIN_TOKEN on this server.">
          <Input id="docs-token" name="token" type="password" autoComplete="current-password" required />
        </Field>
        {state && !state.ok && <ErrorNote>{state.message}</ErrorNote>}
        <Button type="submit" loading={pending}>
          Sign in
        </Button>
      </form>
    </Card>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → the local wall-clock value a datetime-local input expects. */
function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value → ISO, read in this browser's timezone. */
function toIso(local: string) {
  return local ? new Date(local).toISOString() : undefined;
}

function when(iso?: string) {
  return iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";
}

const STATE_LABEL: Record<DocsAccessStatus["state"], { label: string; tone: "sage" | "clay" | "gold" }> = {
  open: { label: "public now", tone: "sage" },
  disabled: { label: "turned off", tone: "clay" },
  scheduled: { label: "scheduled", tone: "gold" },
  ended: { label: "window ended", tone: "clay" },
};

function describe(config: DocsAccessConfig) {
  if (!config.enabled) return "Hidden from everyone but admins.";
  if (config.start && config.end) return `Public from ${when(config.start)} to ${when(config.end)}.`;
  if (config.start) return `Public from ${when(config.start)}, no end.`;
  if (config.end) return `Public until ${when(config.end)}.`;
  return "Public, always.";
}

export function VisibilityPanel({
  status,
  envConfig,
  overrideUpdatedAt,
}: {
  status: DocsAccessStatus;
  envConfig: DocsAccessConfig;
  overrideUpdatedAt?: string;
}) {
  const [enabled, setEnabled] = useState(status.config.enabled);
  const [start, setStart] = useState(toLocalInput(status.config.start));
  const [end, setEnd] = useState(toLocalInput(status.config.end));
  const [hours, setHours] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const badge = STATE_LABEL[status.state];

  function run(action: () => Promise<ActionResult>) {
    setResult(null);
    startTransition(async () => setResult(await action()));
  }

  function save(next: { enabled: boolean; start: string; end: string }) {
    // A duration, when given, sets the end from the start.
    const computedEnd =
      hours && next.start && Number(hours) > 0
        ? new Date(new Date(next.start).getTime() + Number(hours) * 3_600_000).toISOString()
        : toIso(next.end);
    run(() => saveVisibility({ enabled: next.enabled, start: toIso(next.start), end: computedEnd }));
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-semibold text-ink">Right now</p>
          <Badge tone={badge.tone}>{badge.label}</Badge>
          <Badge tone="neutral">{status.source === "override" ? "admin override" : "server defaults"}</Badge>
        </div>
        <p className="text-[14px] text-ink-soft" suppressHydrationWarning>
          {describe(status.config)}
          {status.source === "override" && overrideUpdatedAt && (
            <> Set {when(overrideUpdatedAt)}.</>
          )}
        </p>
        {status.source === "override" && (
          <p className="text-[13px] text-ink-faint" suppressHydrationWarning>
            Server defaults underneath: {describe(envConfig)}
          </p>
        )}
        {status.warnings.map((w) => (
          <ErrorNote key={w}>{w}</ErrorNote>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => save({ enabled: true, start: "", end: "" })}
          >
            Make public now
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => save({ enabled: false, start, end })}
          >
            Turn off now
          </Button>
          {status.source === "override" && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(resetVisibility)}>
              Back to server defaults
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save({ enabled, start, end });
          }}
        >
          <p className="text-[15px] font-semibold text-ink">Schedule</p>
          <label className="flex items-center gap-2.5 text-[14px] text-ink">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="size-4 accent-gold-500"
            />
            Docs are on (off hides them whatever the window says)
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Opens" htmlFor="docs-start" optional>
              <Input id="docs-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Closes" htmlFor="docs-end" optional>
              <Input
                id="docs-end"
                type="datetime-local"
                value={end}
                disabled={Boolean(hours)}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </div>
          <Field
            label="Or: open for this many hours"
            htmlFor="docs-hours"
            optional
            hint="Counts from the opening time and replaces the closing time."
          >
            <Input
              id="docs-hours"
              type="number"
              min={1}
              step={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="sm:w-40"
            />
          </Field>
          <p className="text-[13px] text-ink-faint" suppressHydrationWarning>
            Times are in your timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={pending}>
              Save schedule
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const w = showcaseWindow();
                setEnabled(true);
                setStart(w.start);
                setEnd(w.end);
                setHours("");
              }}
            >
              Fill showcase window (Jun 10–14)
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        result.ok ? (
          <p role="status" className="rounded-lg border border-sage-100 bg-sage-50 px-4 py-3 text-[13px] text-sage-700">
            {result.message}
          </p>
        ) : (
          <ErrorNote>{result.message}</ErrorNote>
        )
      )}

      <p className="text-[13px] leading-relaxed text-ink-faint">
        Admin changes are held in server memory: they last until the server restarts, and on
        serverless hosting each instance keeps its own copy. For a window that must hold, set the
        DOCS_* env vars as well.
      </p>
    </div>
  );
}
