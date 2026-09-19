import { POOLS, STOPWORDS, type LinePools, type Persona } from "./bevLines";
import { mulberry32, randInt, shuffle } from "./rng";

// Builds the fake "thinking" for one run. Deterministic for a given seed, so
// two runs look different but a single run can be replayed and tested.

export type Effort = "low" | "medium" | "high" | "bev";
export type ScriptMode = "classify" | "review";
export type LineKind = "opener" | "wander" | "break" | "setback" | "runnerUp" | "preFinal" | "final" | "rushed";

export type ScriptLine = { atMs: number; text: string; kind: LineKind };

export type BevScript = {
  persona: Persona;
  mode: ScriptMode;
  effort: Effort;
  totalMs: number;
  lines: ScriptLine[];
  /** When the progress bar jumps backwards ("Bev put it in the wrong pile"). */
  setbackAtMs: number;
  /** 1 in 20 runs: "Bev has filed this in triplicate." */
  triplicate: boolean;
  rushCount: number;
};

export const EFFORT_RANGES_MS: Record<Effort, readonly [number, number]> = {
  low: [8_000, 12_000],
  medium: [25_000, 35_000],
  high: [80_000, 100_000],
  bev: [180_000, 300_000],
};

/** Review mode is a real, fixed 10-minute countdown. */
export const REVIEW_MS = 600_000;

/** Gary works a third of Bev's hours. */
export const GARY_SPEEDUP = 3;

export const RUSH_PENALTY_MS = 10_000;

const AVG_GAP_MS: Record<Effort | "review", number> = {
  low: 2_000,
  medium: 3_000,
  high: 5_500,
  bev: 7_000,
  review: 18_000,
};

export const EFFORT_LABELS: Record<Effort, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  bev: "Bev",
};

export function durationRange(effort: Effort, persona: Persona = "bev", mode: ScriptMode = "classify"): [number, number] {
  if (mode === "review") return [REVIEW_MS, REVIEW_MS];
  const [min, max] = EFFORT_RANGES_MS[effort];
  const div = persona === "gary" ? GARY_SPEEDUP : 1;
  return [Math.round(min / div), Math.round(max / div)];
}

const WORD_RE = /[A-Za-z][A-Za-z'-]*[A-Za-z]/g;

/** Meaningful words from the user's text: no stopwords, no tiny words, unique, original casing. */
export function extractWords(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of text.match(WORD_RE) ?? []) {
    const lower = match.toLowerCase();
    if (match.length < 4 || match.length > 20) continue;
    if (STOPWORDS.has(lower) || seen.has(lower)) continue;
    seen.add(lower);
    out.push(match);
  }
  return out;
}

/** Winner is Jev's choice; runner-up is the most probable other option. */
export function rankChoices(choice: string, probabilities: Record<string, number>): { winner: string; runnerUp: string } {
  const others = Object.entries(probabilities)
    .filter(([label]) => label !== choice)
    .sort((a, b) => b[1] - a[1]);
  return { winner: choice, runnerUp: others[0]?.[0] ?? choice };
}

export type BuildScriptInput = {
  text: string;
  winner: string;
  runnerUp: string;
  effort: Effort;
  seed: number;
  persona?: Persona;
  mode?: ScriptMode;
};

export function buildScript({
  text,
  winner,
  runnerUp,
  effort,
  seed,
  persona = "bev",
  mode = "classify",
}: BuildScriptInput): BevScript {
  const rng = mulberry32(seed);
  const pools: LinePools = POOLS[persona];
  const words = shuffle(rng, extractWords(text));
  let wordIdx = 0;

  const fill = (template: string) =>
    template
      .replaceAll("{winner}", winner)
      .replaceAll("{runnerUp}", runnerUp)
      .replace(/\{word\}/g, () => words[wordIdx++ % words.length]);
  const usable = (t: string) => words.length > 0 || !t.includes("{word}");

  const [minMs, maxMs] = durationRange(effort, persona, mode);
  const totalMs = randInt(rng, minMs, maxMs);

  // Middle pool: wander lines (plus review notes in review mode) and a capped number of breaks.
  const wanderPool = shuffle(rng, [...pools.wander, ...(mode === "review" ? pools.review : [])].filter(usable));
  const avgGap = AVG_GAP_MS[mode === "review" ? "review" : effort];
  const target = Math.max(4, Math.round(totalMs / avgGap));
  const maxBreaks = target >= 25 ? 2 : 1;
  const breaks = shuffle(rng, pools.breaks).slice(0, target >= 6 ? maxBreaks : 0);

  const wantPreFinal = target >= 7;
  const wantSecondRunnerUp = target >= 20 && pools.runnerUp.length > 1;
  const fixedCount = 4 + (wantPreFinal ? 1 : 0) + (wantSecondRunnerUp ? 1 : 0); // opener, setback, runnerUp, final
  const middleCount = Math.max(0, Math.min(target - fixedCount, wanderPool.length + breaks.length));

  const middleTemplates = shuffle(rng, [...wanderPool.slice(0, Math.max(0, middleCount - breaks.length)), ...breaks]).slice(0, middleCount);
  const body: { text: string; kind: LineKind }[] = middleTemplates.map((t) => ({
    text: fill(t),
    kind: pools.breaks.includes(t) ? "break" : "wander",
  }));

  // Setback somewhere in the middle; runner-up late, so Bev "reconsiders" before resolving.
  const runnerUps = shuffle(rng, pools.runnerUp);
  body.splice(Math.floor(body.length * (0.35 + rng() * 0.25)), 0, { text: fill(pools.setback[0]), kind: "setback" });
  if (wantSecondRunnerUp) {
    body.splice(Math.floor(body.length * (0.3 + rng() * 0.15)), 0, { text: fill(runnerUps[1]), kind: "runnerUp" });
  }
  body.splice(Math.ceil(body.length * (0.75 + rng() * 0.2)), 0, { text: fill(runnerUps[0]), kind: "runnerUp" });

  const opener = mode === "review" ? pools.reviewOpeners : pools.openers;
  const finals = mode === "review" ? pools.reviewFinals : pools.finals;
  const sequence: { text: string; kind: LineKind }[] = [
    { text: fill(opener[randInt(rng, 0, opener.length - 1)]), kind: "opener" },
    ...body,
    ...(wantPreFinal ? [{ text: fill(pools.preFinal[randInt(rng, 0, pools.preFinal.length - 1)]), kind: "preFinal" as const }] : []),
    { text: fill(finals[randInt(rng, 0, finals.length - 1)]), kind: "final" },
  ];

  // Timing: first line almost immediately, last line exactly at totalMs, jittered gaps between.
  const firstAt = randInt(rng, 300, 900);
  const weights = sequence.slice(1).map(() => 0.35 + rng() * 1.3);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  let t = firstAt;
  const lines: ScriptLine[] = sequence.map((line, i) => {
    if (i > 0) t += ((totalMs - firstAt) * weights[i - 1]) / weightSum;
    return { ...line, atMs: i === sequence.length - 1 ? totalMs : Math.round(t) };
  });

  const setbackAtMs = lines.find((l) => l.kind === "setback")!.atMs;
  return { persona, mode, effort, totalMs, lines, setbackAtMs, triplicate: rng() < 0.05, rushCount: 0 };
}

/** "Rush Bev": insert a grumpy line now and push everything still pending back by 10 seconds. */
export function rushScript(script: BevScript, elapsedMs: number): BevScript {
  const pools = POOLS[script.persona];
  const n = script.rushCount;
  const name = script.persona === "gary" ? "Gary" : "Bev";
  const text = n < pools.rushed.length ? pools.rushed[n] : `${name} has now been rushed ${n + 1} times. ${name} is keeping count.`;
  const at = Math.min(Math.max(0, Math.round(elapsedMs)), script.totalMs);

  const shifted = script.lines.map((l) => (l.atMs > at ? { ...l, atMs: l.atMs + RUSH_PENALTY_MS } : l));
  const insertAt = shifted.findIndex((l) => l.atMs > at);
  const rushLine: ScriptLine = { atMs: at, text, kind: "rushed" };
  const lines = insertAt === -1 ? [...shifted, rushLine] : [...shifted.slice(0, insertAt), rushLine, ...shifted.slice(insertAt)];

  return {
    ...script,
    lines,
    totalMs: script.totalMs + RUSH_PENALTY_MS,
    setbackAtMs: script.setbackAtMs > at ? script.setbackAtMs + RUSH_PENALTY_MS : script.setbackAtMs,
    rushCount: n + 1,
  };
}

/** Lines visible at a given moment. */
export function visibleLines(script: BevScript, elapsedMs: number): ScriptLine[] {
  return script.lines.filter((l) => l.atMs <= elapsedMs);
}

const SETBACK_DROP = 0.22;

/**
 * Progress bar value in [0, 1]. Eases out so it crawls near the end, and once
 * per run drops back sharply at the setback, then slowly recovers.
 */
export function progressAt(script: BevScript, elapsedMs: number): number {
  if (elapsedMs >= script.totalMs) return 1;
  const t = Math.max(0, elapsedMs / script.totalMs);
  let p = 0.97 * (1 - Math.pow(1 - t, 2.2));
  if (elapsedMs >= script.setbackAtMs) {
    const since = (elapsedMs - script.setbackAtMs) / (script.totalMs - script.setbackAtMs || 1);
    p -= SETBACK_DROP * Math.pow(1 - since, 1.5);
  }
  return Math.min(0.99, Math.max(0, p));
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}
