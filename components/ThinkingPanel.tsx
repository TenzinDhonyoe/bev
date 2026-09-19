"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ScriptLine } from "@/lib/bevScript";
import { formatClock, formatDuration } from "@/lib/format";

type Props = {
  lines: ScriptLine[];
  done: boolean;
  totalMs: number;
};

/** Collapsible "Thinking..." panel with a 1994 terminal look. New lines are announced politely. */
export function ThinkingPanel({ lines, done, totalMs }: Props) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, open]);

  return (
    <section className="overflow-hidden rounded-md border border-ink bg-term text-term-text">
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 border-b border-term-dim/40 px-3 py-2 text-left font-mono text-sm hover:bg-white/5"
        >
          <span>
            <span aria-hidden="true" className="mr-2 inline-block w-3 text-term-dim">
              {open ? "v" : ">"}
            </span>
            {done ? `Thought for ${formatDuration(totalMs)}` : "Thinking..."}
          </span>
          <span className="text-xs text-term-dim">{open ? "hide" : "show"}</span>
        </button>
      </h3>
      <div id={bodyId} hidden={!open} className="term-scanlines">
        <ol
          ref={listRef}
          aria-live="polite"
          aria-relevant="additions"
          className="max-h-72 space-y-1.5 overflow-y-auto px-3 py-3 font-mono text-[13px] leading-relaxed sm:text-sm"
        >
          {lines.map((line) => (
            <li key={`${line.atMs}-${line.text}`} className="line-in flex gap-2">
              <span aria-hidden="true" className="shrink-0 text-term-dim">
                [{formatClock(line.atMs)}]
              </span>
              <span className={line.kind === "final" ? "font-semibold text-[#ffe4a8]" : line.kind === "rushed" ? "text-[#ff9f8a]" : undefined}>
                {line.text}
              </span>
            </li>
          ))}
          {!done && (
            <li aria-hidden="true" className="text-term-dim">
              <span className="cursor-blink">_</span>
            </li>
          )}
        </ol>
      </div>
    </section>
  );
}
