"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { AppShell, PageHead } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import { Eyebrow, Skeleton } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { DepthControl } from "@/components/DepthControl";
import { ByokSetup } from "@/components/byok/ByokSetup";
import { getProvider } from "@/lib/api/providers";
import { useStudyStore } from "@/store/useStudyStore";
import { daysUntil, formatDate, relativeTime } from "@/lib/utils";

export default function SettingsPage() {
  const hydrated = useStudyStore((s) => s.hydrated);
  const connection = useStudyStore((s) => s.connection);
  const roadmap = useStudyStore((s) => s.roadmap);
  const disconnectKey = useStudyStore((s) => s.disconnectKey);
  const setRoadmap = useStudyStore((s) => s.setRoadmap);
  const resetVault = useStudyStore((s) => s.resetVault);

  const [replacing, setReplacing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRemoveKey, setConfirmRemoveKey] = useState(false);

  if (!hydrated) {
    return (
      <AppShell>
        <Skeleton className="h-9 w-44" />
        <Skeleton className="mt-6 h-48 w-full" />
      </AppShell>
    );
  }

  const provider = connection ? getProvider(connection.provider) : null;
  const days = daysUntil(roadmap?.deadline);

  return (
    <AppShell>
      <PageHead
        eyebrow="Settings"
        title="How BenkyoAI runs"
        lede="Three things live here: the key it runs on, how much explanation you want by default, and your deadline."
      />

      <div className="max-w-2xl space-y-6">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Eyebrow className="flex items-center gap-1.5">
                <KeyRound className="size-3" /> Your AI key
              </Eyebrow>
              <p className="mt-2 text-[17px] font-semibold tracking-tight text-ink">
                {provider ? provider.name : "No key connected"}
              </p>
              {connection && (
                <p className="mt-1 text-[13px] text-ink-soft">
                  Ends in <span className="font-mono">{connection.keyTail}</span> ·
                  connected {relativeTime(connection.connectedAt)}
                </p>
              )}
            </div>
            <Badge tone={connection?.status === "connected" ? "sage" : "clay"}>
              {connection?.status === "connected" ? "working" : "needs a key"}
            </Badge>
          </div>

          <p className="flex items-start gap-2 rounded-lg border border-line bg-sunk px-3.5 py-2.5 text-[13px] leading-snug text-ink-soft">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-sage-700" />
            The key is stored in this browser and sent only to your provider. It's
            never shown again after you paste it — swapping in a new one is a
            normal thing to do, not a recovery step.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setReplacing(true)}>
              {connection ? "Replace key or provider" : "Connect a key"}
            </Button>
            {connection && (
              <Button variant="danger" size="sm" onClick={() => setConfirmRemoveKey(true)}>
                Remove key
              </Button>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <Eyebrow>Default explanation depth</Eyebrow>
          <DepthControl size="md" />
          <p className="border-t border-line pt-4 text-[13px] leading-snug text-ink-soft">
            Applies to every new step. You can still change it inside a step
            without affecting this default.
          </p>
        </Card>

        {roadmap && (
          <Card className="space-y-4">
            <Eyebrow>Deadline</Eyebrow>
            <Field
              label={roadmap.title}
              htmlFor="deadline"
              hint={
                days === null
                  ? "No date set. Pacing follows your purpose instead."
                  : days > 0
                    ? `${days} days out — ${formatDate(roadmap.deadline)}. The roadmap paces itself to fit.`
                    : "That date has passed. Set a new one or clear it."
              }
            >
              <Input
                id="deadline"
                type="date"
                value={roadmap.deadline?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  setRoadmap({
                    ...roadmap,
                    deadline: e.target.value || undefined,
                    updatedAt: new Date().toISOString(),
                  })
                }
              />
            </Field>
          </Card>
        )}

        <Card tone="sunk" className="space-y-3">
          <Eyebrow>This browser</Eyebrow>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Your roadmap, materials, sessions and progress live here and nowhere
            else. Clearing them can't be undone, and there's no backup to restore
            from.
          </p>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="size-3.5" />}
            onClick={() => setConfirmClear(true)}
          >
            Clear my vault
          </Button>
        </Card>
      </div>

      <Modal
        open={replacing}
        onClose={() => setReplacing(false)}
        title="Connect a different key"
        description="Pick any supported provider. The old key is replaced the moment the new one checks out."
        width="lg"
      >
        <p className="mb-5 flex items-start gap-2 rounded-lg border border-line bg-sunk px-3.5 py-2.5 text-[13px] leading-snug text-ink-soft">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-sage-700" />
          Your roadmap, materials, sessions and progress all stay exactly as
          they are — swapping the key or provider only changes what the app
          talks to, not what it remembers.
        </p>
        <ByokSetup
          showExplainer={false}
          submitLabel="Save this key"
          onConnected={() => setReplacing(false)}
        />
      </Modal>

      <Modal
        open={confirmRemoveKey}
        onClose={() => setConfirmRemoveKey(false)}
        title="Remove your key?"
        description="The app won't be able to make AI requests until you connect a key again."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveKey(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                disconnectKey();
                setConfirmRemoveKey(false);
              }}
            >
              Remove key
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Your roadmap, materials, sessions and progress are <strong>not</strong>{" "}
          affected and stay saved in this browser. You'll be sent back to the
          key step, where you can reconnect the same key or a different one at
          any time — this doesn't touch your data.
        </p>
      </Modal>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear your vault?"
        description="Roadmap, materials, sessions and progress will be deleted from this browser. Your key stays connected."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetVault();
                setConfirmClear(false);
              }}
            >
              Clear everything
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Every roadmap, material, session and summary is deleted from this
          browser — there's no backup to restore from. Your connected key is{" "}
          <strong>not</strong> affected; you'll start again from the topic
          step still signed in. Nothing here is recoverable afterwards.
        </p>
      </Modal>
    </AppShell>
  );
}
