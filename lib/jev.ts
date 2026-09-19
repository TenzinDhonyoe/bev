import { mockClassify, mockEvaluateImpl } from "./jevMock";
import type { Criteria } from "./validate";

// Thin adapter around Jev. The rest of the app only ever calls `classify`, so
// it never depends on which access path is in use.
//
// Backend selection: JEV_PROVIDER overrides; otherwise the first key present wins.
//   1. TYPESAFE_API_KEY   -> POST https://api.typesafe.ai/v1/systemone (first party)
//   2. AI_GATEWAY_API_KEY -> experimental_evaluate from `ai`, model "typesafe-ai/jev"
//   3. OPENROUTER_API_KEY -> POST https://openrouter.ai/api/alpha/decisions (alpha)
//   4. none               -> mock mode
//
// Never log user text. Error logs carry provider, status and latency only.

export type JevResult = {
  choice: string;
  probabilities: Record<string, number>;
  latencyMs: number;
};

export type JevProvider = "typesafe" | "gateway" | "openrouter" | "mock";

/** A question in TypeSafe's vocabulary. `noul` is yes/no (the AI SDK calls it `boolean`). */
export type JevQuestion =
  | { type: "choice"; instructions: string; criteria: Criteria }
  | { type: "noul"; instructions: string }
  | { type: "score"; instructions: string; levels: string[] };

export type JevAnswer =
  | { type: "noul"; noul: number }
  | { type: "choice"; choice: string; confidence: number; probabilities: Record<string, number> }
  | { type: "score"; score: number; confidence: number; probabilities: Record<string, number>; legend: Record<string, string> };

export type JevEvaluation = {
  answers: Record<string, JevAnswer>;
  latencyMs: number;
  inputTokens: number | null;
  /** USD for this request. Output tokens are free. */
  costUsd: number | null;
  provider: JevProvider;
};

/** Jev pricing: $0.042 per million input tokens, output free (AI Gateway /v1/models, TypeSafe docs). */
export const JEV_USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

export type JevErrorKind = "auth" | "rate_limited" | "overloaded" | "bad_request" | "timeout" | "upstream";

export class JevError extends Error {
  constructor(
    public kind: JevErrorKind,
    public provider: JevProvider,
    public status?: number,
  ) {
    super(`jev ${provider} ${kind}${status ? ` (${status})` : ""}`);
    this.name = "JevError";
  }
}

const TIMEOUT_MS = 10_000;
const QUESTION_ID = "verdict";

export function resolveProvider(env: NodeJS.ProcessEnv = process.env): JevProvider {
  const forced = env.JEV_PROVIDER?.trim().toLowerCase();
  if (forced === "typesafe" || forced === "gateway" || forced === "openrouter" || forced === "mock") {
    return forced;
  }
  if (env.TYPESAFE_API_KEY) return "typesafe";
  if (env.AI_GATEWAY_API_KEY) return "gateway";
  if (env.OPENROUTER_API_KEY) return "openrouter";
  return "mock";
}

export function isMockMode(): boolean {
  return resolveProvider() === "mock";
}

export type ClassifyOptions = {
  /** Question asked of Jev. Required by the API. */
  instructions?: string;
};

export const DEFAULT_INSTRUCTIONS = "Which category best fits this text?";

export async function classify(
  text: string,
  criteria: Criteria,
  { instructions = DEFAULT_INSTRUCTIONS }: ClassifyOptions = {},
): Promise<JevResult> {
  if (resolveProvider() === "mock") return mockClassify(text, criteria);
  const { answers, latencyMs } = await evaluate(text, { [QUESTION_ID]: { type: "choice", instructions, criteria } });
  const answer = answers[QUESTION_ID] as Extract<JevAnswer, { type: "choice" }>;
  return { choice: answer.choice, probabilities: answer.probabilities, latencyMs };
}

export type EvaluateOptions = {
  /** Answers to return in mock mode. Without it, mock answers are random but well formed. */
  mock?: () => Record<string, JevAnswer>;
};

/** Several typed questions about one shared state, in a single Jev request. */
export async function evaluate(
  state: string,
  questions: Record<string, JevQuestion>,
  { mock }: EvaluateOptions = {},
): Promise<JevEvaluation> {
  const provider = resolveProvider();
  if (provider === "mock") return mockEvaluate(state, questions, mock);

  const started = performance.now();
  try {
    const raw = provider === "gateway" ? await viaGateway(state, questions) : await viaFetch(provider, state, questions);
    const latencyMs = Math.round(performance.now() - started);
    const answers: Record<string, JevAnswer> = {};
    for (const [id, q] of Object.entries(questions)) {
      answers[id] = normalizeAnswer(raw.answers[id], q, provider);
    }
    const inputTokens = raw.inputTokens ?? null;
    const costUsd = raw.costUsd ?? (inputTokens === null ? null : inputTokens * JEV_USD_PER_INPUT_TOKEN);
    return { answers, latencyMs, inputTokens, costUsd, provider };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - started);
    const jevErr = toJevError(err, provider);
    // Deliberately no text, no questions, no upstream body.
    console.error(`[jev] provider=${provider} kind=${jevErr.kind} status=${jevErr.status ?? "-"} latencyMs=${latencyMs}`);
    throw jevErr;
  }
}

type RawAnswer = Record<string, unknown>;
type RawEvaluation = { answers: Record<string, RawAnswer | undefined>; inputTokens?: number; costUsd?: number };

function toWire(q: JevQuestion, provider: JevProvider) {
  switch (q.type) {
    case "choice":
      return { type: "choice" as const, instructions: q.instructions, criteria: q.criteria };
    case "noul":
      return { type: provider === "gateway" ? ("boolean" as const) : ("noul" as const), instructions: q.instructions };
    case "score":
      return { type: "score" as const, instructions: q.instructions, criteria: q.levels };
  }
}

function wireQuestions(questions: Record<string, JevQuestion>, provider: JevProvider) {
  return Object.fromEntries(Object.entries(questions).map(([id, q]) => [id, toWire(q, provider)]));
}

async function viaGateway(state: string, questions: Record<string, JevQuestion>): Promise<RawEvaluation> {
  // A plain model id string resolves through the default global provider,
  // which is the Vercel AI Gateway (reads AI_GATEWAY_API_KEY).
  // Loaded on demand: only the Gateway path needs the AI SDK, and the CLI starts faster without it.
  const { experimental_evaluate } = await import("ai");
  const result = await experimental_evaluate({
    model: process.env.JEV_GATEWAY_MODEL || "typesafe-ai/jev",
    state,
    // The union of wire shapes is exactly the SDK's EvaluationQuestion union.
    questions: wireQuestions(questions, "gateway") as Parameters<typeof import("ai").experimental_evaluate>[0]["questions"],
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return { answers: result.answers as Record<string, RawAnswer>, inputTokens: result.usage.inputTokens };
}

const FETCH_TARGETS = {
  typesafe: {
    url: "https://api.typesafe.ai/v1/systemone",
    keyEnv: "TYPESAFE_API_KEY",
    model: () => process.env.JEV_MODEL || "jev-latest",
  },
  openrouter: {
    url: "https://openrouter.ai/api/alpha/decisions",
    keyEnv: "OPENROUTER_API_KEY",
    model: () => process.env.JEV_OPENROUTER_MODEL || "typesafe/jev-1.13",
  },
} as const;

async function viaFetch(
  provider: "typesafe" | "openrouter",
  state: string,
  questions: Record<string, JevQuestion>,
): Promise<RawEvaluation> {
  const target = FETCH_TARGETS[provider];
  const key = process.env[target.keyEnv];
  if (!key) throw new JevError("auth", provider);

  const body = JSON.stringify({ model: target.model(), state, questions: wireQuestions(questions, provider) });

  // One retry with backoff on 529 (overloaded) or 503, as the TypeSafe docs suggest.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(target.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json()) as {
        answers?: Record<string, RawAnswer>;
        usage?: { input_tokens?: number; cost?: number };
      };
      if (!json.answers) throw new JevError("upstream", provider, res.status);
      return { answers: json.answers, inputTokens: json.usage?.input_tokens, costUsd: json.usage?.cost };
    }
    if ((res.status === 529 || res.status === 503) && attempt === 0) {
      await new Promise((r) => setTimeout(r, 400));
      continue;
    }
    throw new JevError(kindForStatus(res.status), provider, res.status);
  }
}

function kindForStatus(status: number): JevErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limited";
  if (status === 529 || status === 503) return "overloaded";
  if (status === 400 || status === 422) return "bad_request";
  return "upstream";
}

function toJevError(err: unknown, provider: JevProvider): JevError {
  if (err instanceof JevError) return err;
  if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
    return new JevError("timeout", provider);
  }
  // AI SDK errors (APICallError, RetryError) may carry a statusCode.
  const status =
    (err as { statusCode?: number })?.statusCode ??
    (err as { lastError?: { statusCode?: number } })?.lastError?.statusCode;
  return new JevError(status ? kindForStatus(status) : "upstream", provider, status);
}

const isProb = (p: unknown): p is number => typeof p === "number" && Number.isFinite(p) && p >= 0 && p <= 1;
const maxOf = (probs: Record<string, number>) => Math.max(0, ...Object.values(probs));

/** Fills every expected key; missing entries become 0. Returns null when no distribution was sent. */
function fillProbabilities(raw: unknown, keys: string[]): Record<string, number> | null {
  if (!raw || typeof raw !== "object") return null;
  const given = raw as Record<string, unknown>;
  return Object.fromEntries(keys.map((k) => [k, isProb(given[k]) ? given[k] : 0]));
}

/** Makes every path return the same shape: a known choice and a full probability map. */
export function normalize(raw: RawAnswer, criteria: Criteria, provider: JevProvider): Omit<JevResult, "latencyMs"> {
  const answer = normalizeAnswer(raw, { type: "choice", instructions: "", criteria }, provider);
  if (answer.type !== "choice") throw new JevError("upstream", provider);
  return { choice: answer.choice, probabilities: answer.probabilities };
}

export function normalizeAnswer(raw: RawAnswer | undefined, q: JevQuestion, provider: JevProvider): JevAnswer {
  if (!raw) throw new JevError("upstream", provider);

  if (q.type === "noul") {
    // TypeSafe and OpenRouter send `noul`; the AI SDK sends `probability`.
    const p = raw.noul ?? raw.probability;
    if (!isProb(p)) throw new JevError("upstream", provider);
    return { type: "noul", noul: p };
  }

  if (q.type === "choice") {
    const labels = Object.keys(q.criteria);
    const choice = typeof raw.choice === "string" ? raw.choice : "";
    if (!labels.includes(choice)) throw new JevError("upstream", provider);
    // Missing probabilities: winner 1.0, others 0.
    const probabilities = fillProbabilities(raw.probabilities, labels) ?? Object.fromEntries(labels.map((l) => [l, l === choice ? 1 : 0]));
    const confidence = isProb(raw.confidence) ? raw.confidence : probabilities[choice];
    return { type: "choice", choice, confidence, probabilities };
  }

  const levelKeys = q.levels.map((_, i) => String(i));
  const legend = Object.fromEntries(q.levels.map((l, i) => [String(i), l]));
  const rawScore = typeof raw.score === "number" && Number.isFinite(raw.score) ? raw.score : null;
  let probabilities = fillProbabilities(raw.probabilities, levelKeys);
  if (!probabilities) {
    if (rawScore === null) throw new JevError("upstream", provider);
    const nearest = String(Math.min(q.levels.length - 1, Math.max(0, Math.round(rawScore))));
    probabilities = Object.fromEntries(levelKeys.map((k) => [k, k === nearest ? 1 : 0]));
  }
  // Score is the probability-weighted mean level, per the TypeSafe docs.
  const score = rawScore ?? levelKeys.reduce((sum, k) => sum + Number(k) * probabilities[k], 0);
  const confidence = isProb(raw.confidence) ? raw.confidence : maxOf(probabilities);
  return { type: "score", score, confidence, probabilities, legend };
}

function mockEvaluate(
  state: string,
  questions: Record<string, JevQuestion>,
  fixture?: () => Record<string, JevAnswer>,
): Promise<JevEvaluation> {
  return mockEvaluateImpl(state, questions, fixture);
}
