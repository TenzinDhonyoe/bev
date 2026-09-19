/** 134000 -> "2m 14s", 9000 -> "9s" */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** 380 -> "0.38s" */
export function formatLatency(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(2)}s`;
}

/** 0.8812 -> "88%" */
export function formatPercent(p: number): string {
  return `${Math.round(Math.max(0, Math.min(1, p)) * 100)}%`;
}

/** 425000 -> "7:05" for the review countdown */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Under a minute: "10.42s". Longer: "2m 14s". */
export function formatSeconds(ms: number): string {
  // Truncate (not round) hundredths, so a split always matches the stopwatch face.
  return ms < 60_000 ? `${(Math.floor(Math.max(0, ms) / 10) / 100).toFixed(2)}s` : formatDuration(ms);
}

/** Stopwatch face: "00:10.42" */
export function formatStopwatch(ms: number): string {
  const t = Math.max(0, ms);
  const m = Math.floor(t / 60_000);
  const s = Math.floor((t % 60_000) / 1000);
  const cs = Math.floor((t % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
