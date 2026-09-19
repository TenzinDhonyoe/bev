"use client";

import { useEffect, useState } from "react";

// A real `npx bev-ai` run, replayed once at Bev's actual pace. The lines come
// from Bev's line library; the timing matches the timestamps.

type Line = { atMs: number; text: string; tone?: "dim" | "verdict" | "punchline" | "cmd" };

const RUN: Line[] = [
  { atMs: 0, text: '$ npx bev-ai "I was charged twice for my subscription"', tone: "cmd" },
  { atMs: 400, text: "Thinking...", tone: "dim" },
  { atMs: 1_000, text: "[0:01] Bev has taken a number for your ticket. It is number 4,512." },
  { atMs: 2_600, text: "[0:03] Bev is looking for her reading glasses." },
  { atMs: 4_200, text: "[0:04] Bev put it in the wrong pile. Bev is starting that part over." },
  { atMs: 6_800, text: "[0:07] What about technical? Bev is considering it. Bev is done considering it." },
  { atMs: 9_000, text: "[0:09] Decision made: billing. Bev is stamping it." },
  { atMs: 9_600, text: "Verdict  BILLING", tone: "verdict" },
  { atMs: 9_800, text: "Bev is 97% confident. (Jev's actual confidence: 88%)" },
  { atMs: 10_000, text: "Bev thought for 9s. Actual thinking time: 0.38s.", tone: "punchline" },
];

const TONE: Record<NonNullable<Line["tone"]>, string> = {
  cmd: "text-card",
  dim: "text-term-dim",
  verdict: "mt-3 font-semibold text-[#ff9f8a]",
  punchline: "font-semibold text-[#ffe4a8]",
};

export function HeroTerminal() {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    // With reduced motion, everything appears at once.
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = RUN.slice(1).map((line, i) => setTimeout(() => setShown(i + 2), instant ? 0 : line.atMs));
    return () => timers.forEach(clearTimeout);
  }, []);

  const done = shown >= RUN.length;
  return (
    <figure className="overflow-hidden rounded-lg bg-term shadow-[0_24px_48px_-24px_rgb(43_37_29/0.6)]">
      <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-3" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
      </div>
      <div
        className="term-scanlines min-h-[21rem] px-5 py-4 font-mono text-[12.5px] leading-[1.75] text-term-text sm:text-[13px]"
        aria-label="Example: Bev classifying a support ticket in the terminal"
        role="img"
      >
        {RUN.slice(0, shown).map((line) => (
          <p key={line.atMs} className={`line-in ${line.tone ? TONE[line.tone] : ""}`}>
            {line.text}
          </p>
        ))}
        {!done && <span className="cursor-blink text-term-dim">_</span>}
      </div>
    </figure>
  );
}
