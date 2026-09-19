"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Persona } from "@/lib/bevLines";
import {
  buildScript,
  progressAt,
  randomSeed,
  rankChoices,
  rushScript,
  visibleLines,
  type BevScript,
  type Effort,
} from "@/lib/bevScript";
import { ERRORS } from "@/lib/copy";
import { formatClock } from "@/lib/format";
import { PERSONA_NAME, todaysPersona } from "@/lib/friday";
import { PRESETS, REVIEW_CRITERIA } from "@/lib/presets";
import { validateClassifyRequest, type ClassifyMode } from "@/lib/validate";
import { InputForm, type FormState } from "./InputForm";
import { ProgressBar } from "./ProgressBar";
import { RevealCard } from "./RevealCard";
import { ReviewCountdown } from "./ReviewCountdown";
import { ThinkingPanel } from "./ThinkingPanel";
import { useTodaysPersona } from "./useTodaysPersona";

type ApiResult = { choice: string; probabilities: Record<string, number>; latencyMs: number };

type Run = {
  mode: ClassifyMode;
  text: string;
  persona: Persona;
  effort: Effort;
  startedAt: number;
  result?: ApiResult;
  script?: BevScript;
};

const INITIAL_FORM: FormState = {
  mode: "classify",
  text: "",
  preset: "support",
  options: [...PRESETS.support.options],
  effort: "medium",
};

export function BevApp({ initialMode = "classify" }: { initialMode?: ClassifyMode }) {
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM, mode: initialMode });
  const persona = useTodaysPersona();
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [rushNote, setRushNote] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const originalTitle = useRef<string | null>(null);

  const elapsed = run ? Math.max(0, now - run.startedAt) : 0;
  const script = run?.script;
  const done = !!script && elapsed >= script.totalMs;
  const thinking = !!run && !done;
  const name = PERSONA_NAME[run?.persona ?? persona];

  // Clock. Uses wall time, so a backgrounded tab catches up when you return.
  useEffect(() => {
    if (!thinking) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [thinking]);

  // Review mode: show the countdown in the tab title so people can wander off.
  useEffect(() => {
    if (!run || run.mode !== "review") return;
    originalTitle.current ??= document.title;
    document.title = done ? `${name}'s verdict is ready` : script ? `(${formatClock(script.totalMs - elapsed)}) ${name} is reviewing` : `${name} is reviewing`;
  }, [run, done, script, elapsed, name]);

  useEffect(() => {
    if (!run && originalTitle.current) {
      document.title = originalTitle.current;
      originalTitle.current = null;
    }
  }, [run]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = useCallback(async () => {
    const options = form.mode === "review" ? REVIEW_CRITERIA : form.options;
    const parsed = validateClassifyRequest({ text: form.text, options, mode: form.mode });
    if (!parsed.ok) return setError(parsed.message);

    setError(null);
    setRushNote(null);
    const startedAt = Date.now();
    const runPersona = todaysPersona();
    setNow(startedAt);
    setRun({ mode: form.mode, text: parsed.value.text, persona: runPersona, effort: form.effort, startedAt });

    // The real answer arrives in well under a second. Everything after is theatre.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: parsed.value.text, options, mode: form.mode }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : ERRORS.upstream);

      const result = data as ApiResult;
      const { winner, runnerUp } = rankChoices(result.choice, result.probabilities);
      const built = buildScript({
        text: parsed.value.text,
        winner,
        runnerUp,
        effort: form.effort,
        seed: randomSeed(),
        persona: runPersona,
        mode: form.mode,
      });
      setRun((r) => (r && r.startedAt === startedAt ? { ...r, result, script: built } : r));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setRun(null);
      setError(err instanceof Error && err.message ? err.message : ERRORS.upstream);
    }
  }, [form]);

  const rush = () => {
    if (!run?.script) return;
    const next = rushScript(run.script, Date.now() - run.startedAt);
    setRushNote(next.lines.findLast((l) => l.kind === "rushed")?.text ?? null);
    setRun({ ...run, script: next });
  };

  const reset = () => {
    abortRef.current?.abort();
    setRun(null);
    setRushNote(null);
  };

  if (!run) {
    return <InputForm value={form} onChange={setForm} onSubmit={submit} persona={persona} error={error} submitting={false} />;
  }

  const lines = script ? visibleLines(script, elapsed) : [];

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-ink/20 bg-card px-4 py-3">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{run.mode === "review" ? "Your draft" : "Your ticket"}</p>
        <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm">{run.text}</p>
      </div>

      {!done && (
        <>
          {run.mode === "review" ? (
            <ReviewCountdown remainingMs={script ? script.totalMs - elapsed : 600_000} name={name} />
          ) : (
            <ProgressBar value={script ? progressAt(script, elapsed) : 0} label={`${name}'s progress`} />
          )}
        </>
      )}

      <ThinkingPanel lines={lines} done={done} totalMs={script?.totalMs ?? 0} />

      {!done && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={rush}
            disabled={!script}
            className="rounded border-2 border-stamp bg-card px-4 py-2 font-semibold text-stamp hover:bg-stamp hover:text-card disabled:opacity-50"
          >
            Rush {name}
          </button>
          {run.mode === "review" && (
            <button type="button" onClick={reset} className="text-sm text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink">
              Take it back
            </button>
          )}
          {/* The panel already announces the rushed line, so this is visual only. */}
          {rushNote && (
            <p aria-hidden="true" className="text-sm font-medium text-stamp">
              {rushNote} (+10s)
            </p>
          )}
        </div>
      )}

      {done && run.result && script && (
        <RevealCard
          persona={run.persona}
          choice={run.result.choice}
          probabilities={run.result.probabilities}
          latencyMs={run.result.latencyMs}
          bevMs={script.totalMs}
          triplicate={script.triplicate}
          onAgain={reset}
        />
      )}
    </div>
  );
}
