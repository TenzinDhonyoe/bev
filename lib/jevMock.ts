import type { Criteria } from "./validate";
import type { JevAnswer, JevEvaluation, JevQuestion, JevResult } from "./jev";

// Mock Jev: used when no API key is configured. A keyword heuristic picks a
// plausible winner, then probabilities are randomized around it and sum to 1.

const HINTS: Record<string, string[]> = {
  billing: ["bill", "charge", "charged", "refund", "invoice", "payment", "pay", "card", "price", "subscription", "money", "fee", "receipt", "twice"],
  shipping: ["ship", "shipping", "package", "parcel", "delivery", "deliver", "delivered", "tracking", "arrive", "arrived", "courier", "late", "lost", "address", "box"],
  technical: ["error", "crash", "bug", "broken", "login", "log", "password", "app", "website", "site", "load", "loading", "install", "update", "screen", "button", "500", "404"],
  "good news": ["great", "good", "happy", "love", "won", "win", "promoted", "promotion", "congrats", "congratulations", "excited", "success", "approved", "yay", "thanks"],
  "bad news": ["sorry", "unfortunately", "cancel", "cancelled", "canceled", "lost", "failed", "fired", "layoff", "delay", "delayed", "sad", "regret", "denied", "rejected"],
  neutral: ["meeting", "reminder", "schedule", "update", "fyi", "note", "agenda", "tuesday", "calendar"],
  fine: ["thanks", "thank", "please", "appreciate", "hope", "cheers", "great"],
  "passive-aggressive": ["per", "previous", "reminder", "again", "noted", "clarify", "going forward", "as discussed", "friendly", "just"],
  furious: ["unacceptable", "ridiculous", "never", "worst", "angry", "furious", "!!", "seriously", "joke", "incompetent"],
  "will get you fired": ["quit", "idiot", "hate", "stupid", "boss", "resign", "screw", "damn", "useless", "moron"],
};

const WORD_RE = /[a-z0-9!']+/g;

export function keywordScores(text: string, labels: string[]): number[] {
  const lower = text.toLowerCase();
  const words = new Set(lower.match(WORD_RE) ?? []);
  return labels.map((label) => {
    const key = label.toLowerCase();
    const hints = [...(HINTS[key] ?? []), ...key.split(/[^a-z0-9]+/).filter((w) => w.length > 2)];
    let score = 0;
    for (const hint of hints) {
      if (hint.includes(" ") || hint.includes("!")) {
        if (lower.includes(hint)) score++;
      } else if (words.has(hint)) {
        score++;
      }
    }
    return score;
  });
}

export type MockDeps = {
  rng?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Fake Jev latency: 200 to 450ms. */
export function mockLatency(rng: () => number = Math.random): number {
  return Math.round(200 + rng() * 250);
}

/** Pure part of the mock: choice + probabilities, no waiting. */
export function mockDecide(
  text: string,
  criteria: Criteria,
  rng: () => number = Math.random,
): { choice: string; probabilities: Record<string, number> } {
  const labels = Object.keys(criteria);
  const scores = keywordScores(text, labels);
  const best = Math.max(...scores);

  // No keyword hits: prefer an "other"/"neutral"/"fine" style bucket if present, else random.
  let winnerIdx: number;
  if (best > 0) {
    const tied = scores.map((s, i) => (s === best ? i : -1)).filter((i) => i >= 0);
    winnerIdx = tied[Math.floor(rng() * tied.length)];
  } else {
    const fallback = labels.findIndex((l) => /^(other|neutral|fine|misc)/i.test(l));
    winnerIdx = fallback >= 0 ? fallback : Math.floor(rng() * labels.length);
  }

  // Winner gets 0.55 to 0.95 of the mass; the rest is spread randomly.
  const winnerMass = 0.55 + rng() * 0.4;
  const weights = labels.map((_, i) => (i === winnerIdx ? 0 : 0.05 + rng() + scores[i] * 0.5));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const probabilities: Record<string, number> = {};
  let assigned = 0;
  labels.forEach((label, i) => {
    if (i === winnerIdx) return;
    const p = Math.round(((1 - winnerMass) * weights[i]) / weightSum * 10000) / 10000;
    probabilities[label] = p;
    assigned += p;
  });
  // Winner absorbs rounding so the total is exactly 1 (to 4 decimals).
  probabilities[labels[winnerIdx]] = Math.round((1 - assigned) * 10000) / 10000;

  // Keep the original label order.
  const ordered: Record<string, number> = {};
  for (const label of labels) ordered[label] = probabilities[label];
  return { choice: labels[winnerIdx], probabilities: ordered };
}

export async function mockClassify(
  text: string,
  criteria: Criteria,
  { rng = Math.random, sleep = defaultSleep }: MockDeps = {},
): Promise<JevResult> {
  const started = performance.now();
  await sleep(mockLatency(rng));
  const decision = mockDecide(text, criteria, rng);
  return { ...decision, latencyMs: Math.round(performance.now() - started) };
}

/** Random but well formed: probabilities in range, distributions summing to 1. */
function randomAnswer(q: JevQuestion, rng: () => number): JevAnswer {
  if (q.type === "noul") return { type: "noul", noul: Math.round(rng() * 100) / 100 };
  const keys = q.type === "choice" ? Object.keys(q.criteria) : q.levels.map((_, i) => String(i));
  const weights = keys.map(() => rng() ** 3);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const probabilities = Object.fromEntries(keys.map((k, i) => [k, weights[i] / total]));
  const top = keys.reduce((a, b) => (probabilities[b] > probabilities[a] ? b : a));
  const confidence = probabilities[top];
  if (q.type === "choice") return { type: "choice", choice: top, confidence, probabilities };
  const score = keys.reduce((sum, k) => sum + Number(k) * probabilities[k], 0);
  const legend = Object.fromEntries(q.levels.map((l, i) => [String(i), l]));
  return { type: "score", score, confidence, probabilities, legend };
}

/** Mock for multi-question requests. Uses the caller's fixture when given. */
export async function mockEvaluateImpl(
  state: string,
  questions: Record<string, JevQuestion>,
  fixture?: () => Record<string, JevAnswer>,
  { rng = Math.random, sleep = defaultSleep }: MockDeps = {},
): Promise<JevEvaluation> {
  const started = performance.now();
  await sleep(mockLatency(rng));
  const fixed = fixture?.() ?? {};
  const answers = Object.fromEntries(Object.entries(questions).map(([id, q]) => [id, fixed[id] ?? randomAnswer(q, rng)]));
  // Rough token estimate (about 4 characters per token) so the cost line has something honest-looking in dev.
  const chars = state.length + JSON.stringify(questions).length;
  const inputTokens = Math.ceil(chars / 4);
  return {
    answers,
    latencyMs: Math.round(performance.now() - started),
    inputTokens,
    costUsd: inputTokens * (0.042 / 1_000_000),
    provider: "mock",
  };
}
