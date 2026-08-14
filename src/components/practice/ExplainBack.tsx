"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, CheckCircle2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { evaluateExplanation } from "@/lib/api/practice";
import type { ExplanationEvaluation } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The checkpoint that replaces a quiz question. Deliberately slower: no options
 * to pick from, a wider writing surface, and a verdict that can send you back.
 */
export function ExplainBack({
  subtopicId,
  prompt,
  onDone,
}: {
  subtopicId: string;
  prompt: string;
  onDone: (evaluation: ExplanationEvaluation) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [evaluation, setEvaluation] = useState<ExplanationEvaluation | null>(null);
  const recognitionRef = useRef<any>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setVoiceSupported(Boolean(SR));
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setText((current) => (current ? `${current} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => recognition.stop?.();
  }, []);

  function toggleVoice() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      recognition.start();
      setListening(true);
    }
  }

  async function submit() {
    setBusy(true);
    try {
      const outcome = await evaluateExplanation({
        subtopicId,
        text,
        source: listening ? "spoken" : "typed",
      });
      setEvaluation(outcome);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 rounded-xl border border-gold-200 bg-gold-50/60 p-5 sm:p-6">
      <div className="space-y-1.5">
        <p className="label-data flex items-center gap-1.5 text-gold-700">
          <AudioLines className="size-3" />
          Checkpoint
        </p>
        <p className="text-[19px] leading-snug font-medium tracking-tight text-ink sm:text-[21px]">
          {prompt}
        </p>
        <p className="text-[13px] text-ink-soft">
          No options this time. Say it the way you'd say it to a friend — the gaps
          show up in the telling.
        </p>
      </div>

      {!evaluation ? (
        <>
          <div className="relative">
            <Textarea
              rows={6}
              value={text}
              disabled={busy}
              placeholder="It works like this…"
              onChange={(e) => setText(e.target.value)}
              className="pb-12"
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Button
                size="sm"
                variant={listening ? "primary" : "secondary"}
                onClick={toggleVoice}
                disabled={!voiceSupported}
                icon={
                  listening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />
                }
              >
                {listening ? "Stop" : "Speak it"}
              </Button>
              <span className="label-data text-ink-faint">
                {voiceSupported
                  ? listening
                    ? "listening…"
                    : "or type it"
                  : "voice not supported in this browser"}
              </span>
            </div>
          </div>
          <Button size="lg" onClick={submit} loading={busy} disabled={!text.trim()} full>
            Check my explanation
          </Button>
        </>
      ) : (
        <div className="animate-rise space-y-4">
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-4 py-3",
              evaluation.verdict === "pass"
                ? "border-sage-100 bg-sage-50"
                : "border-maize-100 bg-maize-50",
            )}
          >
            <CheckCircle2
              className={cn(
                "size-4",
                evaluation.verdict === "pass" ? "text-sage-700" : "text-maize-700",
              )}
            />
            <p className="text-sm font-medium text-ink">
              {evaluation.verdict === "pass"
                ? "That holds up — you can teach this one."
                : "Close, but a listener would still have questions."}
            </p>
          </div>

          {evaluation.gaps.length > 0 && (
            <ul className="space-y-2">
              {evaluation.gaps.map((gap) => (
                <li key={gap} className="flex gap-2.5 text-sm leading-snug text-ink-soft">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-maize-700" />
                  {gap}
                </li>
              ))}
            </ul>
          )}

          {evaluation.followUp && (
            <p className="text-[13px] leading-relaxed text-ink-soft">{evaluation.followUp}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onDone(evaluation)}>Continue</Button>
            {evaluation.verdict !== "pass" && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEvaluation(null);
                  setText("");
                }}
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
