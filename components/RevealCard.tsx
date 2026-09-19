"use client";

import { useEffect, useRef } from "react";
import type { Persona } from "@/lib/bevLines";
import { PERSONA_NAME } from "@/lib/friday";
import { formatDuration, formatLatency, formatPercent } from "@/lib/format";
import { ShareButton } from "./ShareButton";

type Props = {
  persona: Persona;
  choice: string;
  probabilities: Record<string, number>;
  latencyMs: number;
  bevMs: number;
  triplicate: boolean;
  onAgain: () => void;
};

export function RevealCard({ persona, choice, probabilities, latencyMs, bevMs, triplicate, onAgain }: Props) {
  const name = PERSONA_NAME[persona];
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  const bevTime = formatDuration(bevMs);
  const actualTime = formatLatency(latencyMs);
  const sorted = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <section aria-labelledby="verdict-heading" className="ruled rounded-md border-2 border-ink bg-card p-5 shadow-[4px_4px_0_0_var(--color-ink)] sm:p-7">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Verdict</p>
      <h2 id="verdict-heading" ref={headingRef} tabIndex={-1} className="mt-2 outline-none">
        <span className="inline-block -rotate-2 rounded border-4 border-double border-stamp px-3 py-1 font-display text-3xl font-bold uppercase tracking-wide text-stamp sm:text-4xl">
          {choice}
        </span>
      </h2>

      <p className="mt-5 text-lg font-semibold">{name} is 97% confident.</p>
      <p className="text-sm text-ink-soft">Jev&apos;s actual confidence: {formatPercent(probabilities[choice] ?? 0)}</p>

      <p className="sticky-note mt-5 -rotate-1 px-4 py-3 font-medium">
        {name} thought for {bevTime}. Actual thinking time: {actualTime}.
      </p>

      {triplicate && <p className="mt-4 font-mono text-sm">{name} has filed this in triplicate.</p>}

      <details className="mt-5 text-sm">
        <summary className="cursor-pointer text-ink-soft hover:text-ink">See Jev&apos;s actual working</summary>
        <ul className="mt-2 space-y-1 font-mono">
          {sorted.map(([label, p]) => (
            <li key={label} className="flex justify-between gap-4 border-b border-dotted border-rule py-1">
              <span>{label}</span>
              <span>{formatPercent(p)}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-6 flex flex-wrap gap-3">
        <ShareButton persona={persona} verdict={choice} bevTime={bevTime} actualTime={actualTime} />
        <button
          type="button"
          onClick={onAgain}
          className="rounded border-2 border-ink bg-card px-4 py-2 font-medium hover:bg-paper"
        >
          Ask {name} again
        </button>
      </div>
    </section>
  );
}
