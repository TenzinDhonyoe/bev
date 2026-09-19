import { progressAt, rushScript, type BevScript, type ScriptLine } from "../../../lib/bevScript";

// Plays a Bev script in real time: each line is emitted at its scheduled
// moment, and "rush" pushes everything still pending back by 10 seconds.

export type PlayHooks = {
  onThought?: (line: ScriptLine) => void;
  /** Called about four times a second with the crawling, occasionally backwards, progress bar value. */
  onProgress?: (progress: number, elapsedMs: number) => void;
  signal?: AbortSignal;
};

export type Playback = {
  done: Promise<BevScript>;
  rush: () => void;
};

const PROGRESS_EVERY_MS = 250;

export function play(initial: BevScript, startedAt: number, { onThought, onProgress, signal }: PlayHooks = {}): Playback {
  let script = initial;
  let emitted = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ticker: ReturnType<typeof setInterval> | undefined;
  let finish!: (s: BevScript) => void;
  let fail!: (e: unknown) => void;
  const done = new Promise<BevScript>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });

  const elapsed = () => Date.now() - startedAt;

  const cleanup = () => {
    clearTimeout(timer);
    clearInterval(ticker);
    signal?.removeEventListener("abort", onAbort);
  };

  function onAbort() {
    cleanup();
    fail(signal?.reason ?? new DOMException("Bev was interrupted.", "AbortError"));
  }

  function step() {
    const now = elapsed();
    while (emitted < script.lines.length && script.lines[emitted].atMs <= now) {
      onThought?.(script.lines[emitted++]);
    }
    if (emitted >= script.lines.length) {
      onProgress?.(1, now);
      cleanup();
      finish(script);
      return;
    }
    timer = setTimeout(step, Math.max(0, script.lines[emitted].atMs - elapsed()));
  }

  if (signal?.aborted) {
    onAbort();
  } else {
    signal?.addEventListener("abort", onAbort, { once: true });
    if (onProgress) ticker = setInterval(() => onProgress(progressAt(script, elapsed()), elapsed()), PROGRESS_EVERY_MS);
    step();
  }

  return {
    done,
    rush() {
      if (emitted >= script.lines.length) return;
      script = rushScript(script, elapsed());
      clearTimeout(timer);
      step();
    },
  };
}
