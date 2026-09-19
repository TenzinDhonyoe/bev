"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Persona } from "@/lib/bevLines";
import { randomSeed } from "@/lib/bevScript";
import { ERRORS } from "@/lib/copy";
import { formatLatency, formatSeconds, formatStopwatch } from "@/lib/format";
import { PERSONA_NAME, todaysPersona } from "@/lib/friday";
import { QUESTIONS, TICKET_ID, TICKET_SUBJECT, TICKET_TEXT, type ShowdownResult } from "@/lib/showdown";
import { answerBlock, answerLine, formatCost } from "@/lib/showdownFormat";
import { buildShowdownScript, rushShowdown, visibleChars, type ShowdownScript } from "@/lib/showdownScript";
import { useTodaysPersona } from "./useTodaysPersona";

type Race = {
  persona: Persona;
  /** Set once Jev's answers are loaded, so both racers and the clock start together. */
  startedAt: number | null;
  result?: ShowdownResult;
  /** Built from the answers once they arrive: Bev streams exactly Jev's JSON. */
  script?: ShowdownScript;
  error?: string;
};

const LAST_ID = QUESTIONS[QUESTIONS.length - 1].id;
/** How long a "Rush Bev" remark stays in the panel footer. */
const RUSH_NOTE_MS = 4_000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** With reduced motion, reveal whole lines instead of streaming tokens. */
function shownText(text: string, chars: number, wholeLines: boolean) {
  if (!wholeLines || chars >= text.length) return text.slice(0, chars);
  const cut = text.lastIndexOf("\n", chars);
  return cut < 0 ? "" : text.slice(0, cut);
}

export function Showdown() {
  const persona = useTodaysPersona();
  const [race, setRace] = useState<Race | null>(null);
  const [now, setNow] = useState(0);
  /** null follows the model (open while thinking, collapsed after); a boolean is the viewer's choice. */
  const [thinkingOpen, setThinkingOpen] = useState<boolean | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const bevBodyRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const script = race?.script;
  const result = race?.result;
  const elapsed = race?.startedAt ? Math.max(0, now - race.startedAt) : 0;
  // Jev finishes at its real measured latency after the start.
  const jevRevealAt = race?.startedAt && result ? result.latencyMs : null;
  const jevDone = jevRevealAt !== null && elapsed >= jevRevealAt;
  const bevDone = !!script && elapsed >= script.totalMs;
  const running = !!race && !race.error && !bevDone;
  const name = PERSONA_NAME[race?.persona ?? persona];

  useEffect(() => {
    if (!running) return;
    // Animation frames keep the stopwatch smooth; wall time keeps it honest in a background tab.
    let frame = 0;
    const tick = () => {
      setNow(Date.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function start() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const racePersona = todaysPersona();
    const token = { persona: racePersona, startedAt: null } satisfies Race;
    setRace(token);
    setThinkingOpen(null);

    try {
      // Usually a CDN cache hit. The clock starts only once the answers are here,
      // so a slow page load is never counted as Jev's time.
      const res = await fetch("/api/showdown", { signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : ERRORS.upstream);
      const loaded = data as ShowdownResult;
      const built = buildShowdownScript({
        seed: randomSeed(),
        persona: racePersona,
        answerText: answerBlock(QUESTIONS, loaded.answers),
      });
      const startedAt = Date.now();
      setNow(startedAt);
      setRace((r) => (r === token ? { ...r, result: loaded, script: built, startedAt } : r));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const message = err instanceof Error && err.message ? err.message : ERRORS.upstream;
      setRace((r) => (r === token ? { ...r, error: message } : r));
    }
  }

  function rush() {
    if (!race?.startedAt || !race.script) return;
    setRace({ ...race, script: rushShowdown(race.script, Date.now() - race.startedAt) });
  }

  // Bev's streams so far.
  const thinkingStarted = !!script && elapsed >= script.thinking.startMs;
  const thinkingDone = !!script && elapsed >= script.thinking.endMs;
  const thinkingText = script ? shownText(script.thinking.text, visibleChars(script.thinking, elapsed), reducedMotion) : "";
  const answerText = script ? shownText(script.answer.text, visibleChars(script.answer, elapsed), reducedMotion) : "";
  const showThinking = thinkingOpen ?? !thinkingDone;
  // Lines finished so far, minus the opening brace.
  const answered = bevDone ? 27 : Math.max(0, Math.min(27, (answerText.match(/\n/g)?.length ?? 0) - 1));
  const coffee = /coffee/i.test(thinkingText) ? 1 : 0;
  const lastRush = script?.rushes.at(-1);
  const rushNote = lastRush && elapsed - lastRush.atMs < RUSH_NOTE_MS ? lastRush.text : null;

  useEffect(() => {
    const el = bevBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thinkingText.length, answerText.length, showThinking, bevDone]);

  const bevMs = script?.totalMs ?? 0;
  const ratio = result && result.latencyMs > 0 ? Math.round(bevMs / result.latencyMs) : null;

  return (
    <div className="space-y-5">
      <details className="group rounded-lg border border-ink/15 bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 font-mono text-sm">
          <span aria-hidden="true" className="text-ink-soft group-open:rotate-90 motion-safe:transition-transform">
            &gt;
          </span>
          <span className="min-w-0 truncate">
            <span className="font-semibold">Ticket #{TICKET_ID}:</span> {TICKET_SUBJECT}
          </span>
        </summary>
        <pre className="whitespace-pre-wrap border-t border-rule px-4 py-3 font-sans text-sm leading-relaxed">{TICKET_TEXT}</pre>
      </details>

      <div className="text-center font-mono">
        <p className="font-semibold">Same 27 questions. Same order.</p>
      </div>

      <div className="flex flex-wrap items-stretch justify-center gap-3">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="rounded-md border border-ink bg-ink px-5 py-2.5 font-semibold text-card hover:bg-ink-soft"
          >
            {race ? "Race again" : "Start the race"}
          </button>
        ) : (
          <button
            type="button"
            onClick={rush}
            disabled={!script}
            className="rounded-md border border-stamp bg-card px-5 py-2.5 font-semibold text-stamp hover:bg-stamp hover:text-card disabled:opacity-50"
          >
            Rush {name}
          </button>
        )}
        <Stopwatch
          ms={bevDone ? bevMs : elapsed}
          running={running}
          splits={[
            { who: "Jev", ms: jevDone ? jevRevealAt : null },
            { who: name, ms: bevDone ? bevMs : null },
          ]}
        />
      </div>

      <div className="grid gap-9 md:grid-cols-2 md:gap-5">
        <Panel
          title="JEV"
          footer={result?.model ?? "jev-1.13"}
          label="Jev's output"
          status={
            jevDone && result ? (
              <>
                <div>cost {formatCost(result.costUsd)}</div>
                <div>completed in {formatLatency(result.latencyMs)}</div>
              </>
            ) : race && !race.error ? (
              <div className="text-term-dim">waiting for Jev...</div>
            ) : null
          }
        >
          <Line>$ npx bev-race ask jev</Line>
          <Blank />
          {race && <Line dim>Sending request to parallel Jev API...</Line>}
          {race?.error && <Line error>error: {race.error}</Line>}
          {jevDone && result && (
            <>
              <Blank />
              <Line>{"{"}</Line>
              {QUESTIONS.map((q) => (
                <AnswerRow key={q.id} text={answerLine(q.label, result.answers[q.id], q.id === LAST_ID)} />
              ))}
              <Line>{"}"}</Line>
            </>
          )}
        </Panel>

        <Panel
          title={(race?.persona ?? persona) === "gary" ? "BEV (GARY COVERING)" : "BEV"}
          footer={`${name.toLowerCase()} (powered by jev-1.13)`}
          label={`${name}'s output`}
          bodyRef={bevBodyRef}
          status={
            bevDone && result ? (
              <>
                <div>cost {formatCost(result.costUsd)} (the same request as Jev)</div>
                <div>completed in {formatSeconds(bevMs)}</div>
              </>
            ) : running && script ? (
              <div className="text-term-dim">
                {rushNote ? (
                  <span className="text-[#ff9f8a]">{rushNote} (+10s)</span>
                ) : (
                  <>
                    elapsed {formatSeconds(elapsed)} · {thinkingDone ? `${answered} of 27 answered` : "thinking"}
                  </>
                )}
              </div>
            ) : null
          }
        >
          <Line>$ npx bev-race ask bev</Line>
          <Blank />
          {race && (
            <Line dim>
              Sending request to autoregressive {name} API.{!thinkingStarted && !race.error ? " Waiting for first token..." : ""}
            </Line>
          )}
          {race?.error && <Line dim>{`${name} cannot start without Jev. ${name} is going on break.`}</Line>}
          {script && thinkingStarted && (
            <>
              <Blank />
              <ThinkingBlock
                text={thinkingText}
                streaming={!thinkingDone}
                thoughtForMs={script.thinking.endMs}
                open={showThinking}
                onToggle={() => setThinkingOpen(!showThinking)}
              />
            </>
          )}
          {answerText && (
            <>
              <Blank />
              {answerText.split("\n").map((line, i, all) => (
                // Hanging indent: a wrapped answer line continues under its own text, not at the margin.
                <div key={i} className="whitespace-pre-wrap break-words pl-[4ch] -indent-[4ch]">
                  {line}
                  {!bevDone && i === all.length - 1 && <span className="cursor-blink">|</span>}
                </div>
              ))}
              {bevDone && script?.triplicate && <Line comment>{`// ${name} has filed this in triplicate.`}</Line>}
            </>
          )}
        </Panel>
      </div>

      <p className="sr-only" role="status">
        {jevDone && result ? `Jev answered all 27 questions in ${formatLatency(result.latencyMs)}. ` : ""}
        {script ? (bevDone ? `${name} answered all 27 questions in ${formatSeconds(bevMs)}.` : thinkingDone ? `${name} has answered ${answered} of 27.` : `${name} is thinking.`) : ""}
      </p>

      <Receipts
        name={name}
        result={result}
        jevDone={jevDone}
        bevDone={bevDone}
        bevMs={bevDone ? bevMs : elapsed}
        answered={answered}
        coffee={coffee}
        ratio={ratio}
      />

      {result && (
        <p className="text-center text-xs text-ink-soft">
          Jev&apos;s time and cost are real: one live request, measured {result.mock ? "in mock mode" : `on ${new Date(result.fetchedAt).toLocaleDateString()}`}{" "}
          and cached for a day. {name}&apos;s time is {name}&apos;s.
        </p>
      )}
    </div>
  );
}

/** A reasoning-model "Thinking..." block that collapses to "Thought for 6.12s" when done. */
function ThinkingBlock({
  text,
  streaming,
  thoughtForMs,
  open,
  onToggle,
}: {
  text: string;
  streaming: boolean;
  thoughtForMs: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex items-center gap-2 text-left text-term-dim hover:text-term-text">
        <span aria-hidden="true" className="inline-block w-3">
          {open ? "v" : ">"}
        </span>
        {streaming ? <span className="animate-pulse motion-reduce:animate-none">Thinking...</span> : <span>Thought for {formatSeconds(thoughtForMs)}</span>}
      </button>
      {open && (
        <div className="mt-1 ml-1.5 whitespace-pre-wrap border-l border-term-dim/40 pl-3 italic text-term-dim">
          {text}
          {streaming && <span className="cursor-blink not-italic">|</span>}
        </div>
      )}
    </div>
  );
}

/** Race clock beside the start button. Records each side's time the moment it finishes. */
function Stopwatch({ ms, running, splits }: { ms: number; running: boolean; splits: { who: string; ms: number | null }[] }) {
  return (
    <div
      role="timer"
      aria-label="Race clock"
      className="flex items-center gap-3 rounded-md border border-ink bg-ink px-4 py-1.5 text-card"
    >
      <span className={`font-mono text-lg font-semibold tabular-nums ${running ? "text-term-text" : ""}`} aria-hidden="true">
        {formatStopwatch(ms)}
      </span>
      <span aria-hidden="true" className="h-6 w-px bg-card/25" />
      <ul className="flex items-center gap-2 font-mono text-xs">
        {splits.map((s) => (
          <li
            key={s.who}
            className={`rounded px-2 py-1 tabular-nums ${s.ms !== null ? "bg-sticky font-semibold text-ink" : "text-card/60"}`}
          >
            {s.who.toUpperCase()} {s.ms !== null ? formatSeconds(s.ms) : "--"}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Receipts({
  name,
  result,
  jevDone,
  bevDone,
  bevMs,
  answered,
  coffee,
  ratio,
}: {
  name: string;
  result?: ShowdownResult;
  jevDone: boolean;
  bevDone: boolean;
  bevMs: number;
  answered: number;
  coffee: number;
  ratio: number | null;
}) {
  const cost = result ? formatCost(result.costUsd) : "...";
  const tokens = result?.inputTokens ? result.inputTokens.toLocaleString() : "...";
  const rows = (items: [string, string][]) => (
    <dl className="mt-2 divide-y divide-dotted divide-rule font-mono text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-1.5">
          <dt className="text-ink-soft">{k}</dt>
          <dd className="text-right font-semibold tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <section aria-label="Receipts" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-ink bg-card p-4">
          <h3 className="font-semibold">Jev</h3>
          {rows([
            ["Requests", "1"],
            ["Input tokens", tokens],
            ["Answers", jevDone ? "27 of 27" : "0 of 27"],
            ["Time", jevDone && result ? formatLatency(result.latencyMs) : "..."],
            ["Cost", cost],
          ])}
        </div>
        <div className="rounded-md border border-ink bg-card p-4">
          <h3 className="font-semibold">{name}</h3>
          {rows([
            ["Requests", "1 (the same one)"],
            ["Input tokens", tokens],
            ["Answers", `${answered} of 27`],
            ["Time", result ? formatSeconds(bevMs) : "..."],
            ["Cost", `${cost}${coffee ? ` + ${coffee} coffee${coffee > 1 ? "s" : ""} (not billed)` : ""}`],
          ])}
        </div>
      </div>
      {bevDone && result && (
        <p className="sticky-note mx-auto max-w-xl -rotate-1 px-5 py-3 text-center font-semibold">
          Same 27 answers. Same {cost}. {ratio ? `${ratio.toLocaleString()}x the wait.` : "Much more waiting."}
        </p>
      )}
    </section>
  );
}

function Panel({
  title,
  footer,
  label,
  children,
  bodyRef,
  status,
}: {
  title: string;
  footer: string;
  label: string;
  children: ReactNode;
  bodyRef?: React.Ref<HTMLDivElement>;
  /** Pinned below the scrolling output: cost and time are always visible. */
  status?: ReactNode;
}) {
  return (
    <section aria-label={label} className="relative min-w-0 rounded-md border border-ink bg-term pb-3 pt-4 text-term-text">
      <p className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-paper px-2 font-mono text-sm font-semibold text-ink">
        <span aria-hidden="true">-- </span>
        {title}
        <span aria-hidden="true"> --</span>
      </p>
      <div ref={bodyRef} className="term-scanlines h-[24rem] overflow-y-auto px-4 font-mono text-[12px] leading-[1.7] md:h-[34rem]">
        {children}
      </div>
      <div className="mx-4 mt-2 min-h-[3.4rem] border-t border-term-dim/30 pt-2 font-mono text-[13px] font-semibold leading-[1.6] text-[#ffe4a8]">
        {status}
      </div>
      <p className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-paper px-2 font-mono text-xs text-ink-soft">
        {footer}
      </p>
    </section>
  );
}

function Line({ children, dim, strong, error, comment }: { children: ReactNode; dim?: boolean; strong?: boolean; error?: boolean; comment?: boolean }) {
  const tone = error ? "text-[#ff9f8a]" : comment ? "pl-4 italic text-term-dim" : dim ? "text-term-dim" : strong ? "font-semibold text-[#ffe4a8]" : "";
  return <div className={`whitespace-pre-wrap ${tone}`}>{children}</div>;
}

function Blank() {
  return <div aria-hidden="true">&nbsp;</div>;
}

/** One JSON line, truncated like a real terminal. Optionally typed out a character at a time. */
function AnswerRow({ text, typedChars }: { text: string; typedChars?: number }) {
  const typing = typedChars !== undefined && typedChars < text.length;
  const shown = typing ? text.slice(0, Math.max(0, typedChars)) : text;
  return (
    <div className="truncate pl-4" title={text}>
      {shown}
      {typing && <span className="cursor-blink">|</span>}
    </div>
  );
}
