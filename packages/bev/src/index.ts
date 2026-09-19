import { buildScript, durationRange, randomSeed, rankChoices, type BevScript, type Effort, type ScriptLine } from "../../../lib/bevScript";
import type { Persona } from "../../../lib/bevLines";
import { todaysPersona } from "../../../lib/friday";
import { classify as jevClassify, JevError, resolveProvider, type JevProvider } from "../../../lib/jev";
import { REVIEW_CRITERIA } from "../../../lib/presets";
import { validateClassifyRequest, type Criteria } from "../../../lib/validate";
import { play } from "./play";

// Bev: the slowest classifier in the world, at Jev prices.
//
// Every call gets the real answer from Jev immediately, then waits while Bev
// "thinks" before handing it over. The result always says how long the real
// thinking took.

export type { Effort, Persona, ScriptLine as Thought, JevProvider };

export type BevResult = {
  /** Jev's choice. Bev never overrules Jev. */
  choice: string;
  /** Jev's probability for every option. */
  probabilities: Record<string, number>;
  /** Bev is always 97% confident. */
  bevConfidence: 0.97;
  /** What Jev actually thought: probabilities[choice]. */
  jevConfidence: number;
  /** How long Bev took, rushes included. */
  bevMs: number;
  /** How long Jev actually took. */
  actualMs: number;
  /** Everything Bev said while thinking, in order. */
  thoughts: string[];
  persona: Persona;
  provider: JevProvider;
  /** About 1 run in 20. */
  filedInTriplicate: boolean;
};

export type BevOptions = {
  /** How long Bev thinks. low about 10s, medium about 30s, high about 90s, bev 3 to 5 minutes. Default "medium". */
  effort?: Effort;
  /** The question Jev is asked. */
  instructions?: string;
  /** Each line of Bev's thinking, as it happens. */
  onThought?: (thought: ScriptLine) => void;
  /** Progress bar value from 0 to 1. It crawls, and once per run it goes backwards. */
  onProgress?: (progress: number, elapsedMs: number) => void;
  /** Stops waiting. The promise rejects with an AbortError. */
  signal?: AbortSignal;
  /** Bev, or Gary (who covers on Fridays and takes a third of the time). Default: Gary on Fridays. */
  persona?: Persona;
};

export type BevRun = {
  result: Promise<BevResult>;
  /** Adds 10 seconds. Bev does not appreciate being rushed. */
  rush: () => void;
};

/** Thrown for bad input or when Jev cannot be reached. `message` is in Bev's voice. */
export class BevError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_input" | "jev_unavailable",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "BevError";
  }
}

const JEV_ERRORS: Record<string, string> = {
  auth: "Bev cannot log in to Jev. Check your API key.",
  rate_limited: "The office is very busy. Bev will be with you shortly. Please try again.",
  overloaded: "The office is very busy. Bev will be with you shortly. Please try again.",
  timeout: "Bev's computer froze. Please try again.",
};

function start(
  text: string,
  options: string[] | Record<string, string>,
  mode: "classify" | "review",
  { effort = "medium", instructions, onThought, onProgress, signal, persona = todaysPersona() }: BevOptions,
): BevRun {
  const parsed = validateClassifyRequest({ text, options, mode });
  let rushQueued = 0;
  let playback: ReturnType<typeof play> | undefined;

  const result = (async (): Promise<BevResult> => {
    if (!parsed.ok) throw new BevError(parsed.message, "invalid_input");
    const { criteria } = parsed.value;
    const startedAt = Date.now();

    // The real answer, straight away.
    let jev;
    try {
      jev = await jevClassify(parsed.value.text, criteria as Criteria, {
        instructions: instructions ?? (mode === "review" ? "How is the recipient most likely to read this message?" : undefined),
      });
    } catch (err) {
      const kind = err instanceof JevError ? err.kind : "upstream";
      throw new BevError(JEV_ERRORS[kind] ?? "Bev's computer is updating. Please try again.", "jev_unavailable", { cause: err });
    }
    signal?.throwIfAborted();

    // Then the theatre.
    const { winner, runnerUp } = rankChoices(jev.choice, jev.probabilities);
    const script: BevScript = buildScript({ text: parsed.value.text, winner, runnerUp, effort, seed: randomSeed(), persona, mode });
    const thoughts: string[] = [];
    playback = play(script, startedAt, {
      onThought: (line) => {
        thoughts.push(line.text);
        onThought?.(line);
      },
      onProgress,
      signal,
    });
    for (; rushQueued > 0; rushQueued--) playback.rush();
    const finished = await playback.done;

    return {
      choice: jev.choice,
      probabilities: jev.probabilities,
      bevConfidence: 0.97,
      jevConfidence: jev.probabilities[jev.choice] ?? 0,
      bevMs: Math.max(finished.totalMs, Date.now() - startedAt),
      actualMs: jev.latencyMs,
      thoughts,
      persona,
      provider: resolveProvider(),
      filedInTriplicate: finished.triplicate,
    };
  })();

  return {
    result,
    rush: () => (playback ? playback.rush() : rushQueued++),
  };
}

/** Classify `text` into one of `options`. Resolves after Bev has finished thinking. */
export function startClassify(text: string, options: string[] | Record<string, string>, opts: BevOptions = {}): BevRun {
  return start(text, options, "classify", opts);
}

/** Classify `text` into one of `options`. Resolves after Bev has finished thinking. */
export function classify(text: string, options: string[] | Record<string, string>, opts: BevOptions = {}): Promise<BevResult> {
  return startClassify(text, options, opts).result;
}

/** "Let Bev review it": fine, passive-aggressive, furious, or will get you fired. Always takes 10 minutes. */
export function startReview(message: string, opts: Omit<BevOptions, "effort"> = {}): BevRun {
  return start(message, REVIEW_CRITERIA as Record<string, string>, "review", opts);
}

/** "Let Bev review it": fine, passive-aggressive, furious, or will get you fired. Always takes 10 minutes. */
export function review(message: string, opts: Omit<BevOptions, "effort"> = {}): Promise<BevResult> {
  return startReview(message, opts).result;
}

/** How long Bev will take, as [minMs, maxMs]. */
export function thinkingTime(effort: Effort = "medium", persona: Persona = todaysPersona()): [number, number] {
  return durationRange(effort, persona);
}

/** Which backend Bev will use for Jev, based on the environment. "mock" means no key was found. */
export function provider(): JevProvider {
  return resolveProvider();
}

const bev = { classify, startClassify, review, startReview, thinkingTime, provider };
export default bev;
