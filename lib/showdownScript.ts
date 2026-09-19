import type { Persona } from "./bevLines";
import { GARY_SPEEDUP, RUSH_PENALTY_MS } from "./bevScript";
import { mulberry32, randInt, shuffle } from "./rng";
import { TICKET_ID } from "./showdown";

// Bev's side of the race, staged like a reasoning LLM: a wait for the first
// token, a "Thinking..." block that streams her reasoning, then the JSON answer
// streamed token by token. The answer text is exactly Jev's answers. The
// thinking is about Bev's process, never an answer's value, so it can never
// contradict Jev.

/** A block of text revealed token by token. times[i] is when ends[i] characters are visible. */
export type TokenStream = {
  text: string;
  ends: number[];
  times: number[];
  startMs: number;
  endMs: number;
};

export type ShowdownScript = {
  persona: Persona;
  totalMs: number;
  thinking: TokenStream;
  answer: TokenStream;
  /** "Rush Bev" notes, newest last. */
  rushes: { atMs: number; text: string }[];
  triplicate: boolean;
};

const BEV_RACE_MS = [14_000, 16_000] as const;

/** About 15 seconds for Bev, a third of that for Gary. */
export const SHOWDOWN_RANGE_MS: Record<Persona, readonly [number, number]> = {
  bev: BEV_RACE_MS,
  gary: [Math.round(BEV_RACE_MS[0] / GARY_SPEEDUP), Math.round(BEV_RACE_MS[1] / GARY_SPEEDUP)],
};

type Thought = { text: string; required?: boolean };

const THINKING: Record<Persona, { open: string; middle: Thought[]; close: string; picks: number }> = {
  bev: {
    open: `Bev is reading ticket #${TICKET_ID}. It is from Dana, Head of Support Ops.`,
    middle: [
      { text: "Dana says the classifier takes 3 to 5 minutes per request. Bev would call that thorough." },
      { text: "\"It gets every answer right.\" Bev is putting this on the fridge.", required: true },
      { text: "The status logs mention reading glasses. Bev found them. They were on her head." },
      { text: "\"Who is Doreen?\" Bev knows exactly who Doreen is. Bev will answer the way Jev did.", required: true },
      { text: "Dana mentions switching to Jev. Bev and Jev go way back." },
      { text: "A partner launch at 9am. Bev does not do mornings." },
      { text: "Hmm. Wait. Bev would like to reconsider." },
      { text: "Actually, Bev is reconsidering that reconsideration." },
      { text: "2,400 tickets in the queue. Bev will take them one at a time." },
      { text: "Bev is checking with her supervisor, Doreen. Doreen is in a meeting." },
      { text: "URGENT is in capital letters. Bev noticed." },
      { text: "Bev is warming up her coffee. 45 seconds." },
    ],
    close: "Okay. Bev will answer all 27 questions, in order.",
    picks: 6,
  },
  gary: {
    open: `Gary grabbed ticket #${TICKET_ID} off Bev's desk.`,
    middle: [
      { text: "Gary skimmed it." },
      { text: "Gary does not know who Doreen is either.", required: true },
      { text: "Gary would also switch to Jev." },
      { text: "Gary agrees. Bev is slow." },
    ],
    close: "Gary is done thinking. Gary was always done thinking.",
    picks: 2,
  },
};

const RUSHED: Record<Persona, string[]> = {
  bev: [
    "Bev does not appreciate being rushed.",
    "Bev still does not appreciate being rushed.",
    "Bev has made a note of this.",
    "Bev is telling Doreen about this.",
  ],
  gary: ["Gary does not appreciate being rushed either.", "Gary is slowing down out of spite."],
};

/** Rough LLM tokens: words with their leading space, or single punctuation marks. */
export function tokenEnds(text: string): number[] {
  const ends: number[] = [];
  for (const m of text.matchAll(/\s*(?:[A-Za-z0-9_.'#%$-]+|[^\sA-Za-z0-9_.'#%$-])/g)) ends.push(m.index + m[0].length);
  if (ends.at(-1) !== text.length) ends.push(text.length);
  return ends;
}

/** Spread tokens over [startMs, endMs] with jitter and the occasional stall, like a real stream. */
function stream(rng: () => number, text: string, startMs: number, endMs: number): TokenStream {
  const ends = tokenEnds(text);
  const weights = ends.map(() => (rng() < 0.03 ? 4 + rng() * 6 : 0.5 + rng()));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = startMs;
  const times = weights.map((w, i) => {
    t += ((endMs - startMs) * w) / total;
    return i === weights.length - 1 ? endMs : Math.round(t);
  });
  return { text, ends, times, startMs, endMs };
}

export function buildShowdownScript({
  seed,
  persona = "bev",
  answerText,
}: {
  seed: number;
  persona?: Persona;
  /** The full JSON Bev will stream: Jev's answers, formatted. */
  answerText: string;
}): ShowdownScript {
  const rng = mulberry32(seed);
  const [minMs, maxMs] = SHOWDOWN_RANGE_MS[persona];
  const totalMs = randInt(rng, minMs, maxMs);

  const t = THINKING[persona];
  const required = t.middle.filter((m) => m.required);
  const optional = shuffle(rng, t.middle.filter((m) => !m.required)).slice(0, Math.max(0, t.picks - required.length));
  // Keep the library's order so the reasoning reads naturally, just with some thoughts skipped.
  const middle = t.middle.filter((m) => required.includes(m) || optional.includes(m)).map((m) => m.text);
  const thinkingText = [t.open, ...middle, t.close].join("\n");

  // Time to first token, then roughly 40% thinking and 60% streaming the answer.
  const firstToken = Math.round(totalMs * (0.04 + rng() * 0.02));
  const thinkEnd = Math.round(totalMs * (0.38 + rng() * 0.06));
  const answerStart = thinkEnd + Math.round(totalMs * 0.02);

  return {
    persona,
    totalMs,
    thinking: stream(rng, thinkingText, firstToken, thinkEnd),
    answer: stream(rng, answerText, answerStart, totalMs),
    rushes: [],
    triplicate: rng() < 0.05,
  };
}

/** Characters of a stream visible at `elapsedMs`. */
export function visibleChars(s: TokenStream, elapsedMs: number): number {
  let lo = 0;
  let hi = s.times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (s.times[mid] <= elapsedMs) lo = mid + 1;
    else hi = mid;
  }
  return lo === 0 ? 0 : s.ends[lo - 1];
}

function shift(s: TokenStream, at: number, by: number): TokenStream {
  return {
    ...s,
    times: s.times.map((x) => (x > at ? x + by : x)),
    startMs: s.startMs > at ? s.startMs + by : s.startMs,
    endMs: s.endMs > at ? s.endMs + by : s.endMs,
  };
}

/** "Rush Bev": the stream stalls for 10 seconds and Bev says something about it. */
export function rushShowdown(script: ShowdownScript, elapsedMs: number): ShowdownScript {
  const lines = RUSHED[script.persona];
  const n = script.rushes.length;
  const name = script.persona === "gary" ? "Gary" : "Bev";
  const text = n < lines.length ? lines[n] : `${name} has now been rushed ${n + 1} times. ${name} is keeping count.`;
  const at = Math.min(Math.max(0, Math.round(elapsedMs)), script.totalMs);
  return {
    ...script,
    thinking: shift(script.thinking, at, RUSH_PENALTY_MS),
    answer: shift(script.answer, at, RUSH_PENALTY_MS),
    totalMs: script.totalMs + RUSH_PENALTY_MS,
    rushes: [...script.rushes, { atMs: at, text }],
  };
}
