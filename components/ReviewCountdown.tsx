import { formatClock } from "@/lib/format";

type Props = { remainingMs: number; name: string };

/** The real 10-minute countdown for "Let Bev review it". */
export function ReviewCountdown({ remainingMs, name }: Props) {
  const clock = formatClock(remainingMs);
  return (
    <div className="sticky-note -rotate-1 px-5 py-4 text-center">
      <p className="font-mono text-xs uppercase tracking-widest">Review in progress</p>
      <p className="font-mono text-5xl font-semibold tabular-nums sm:text-6xl" aria-hidden="true">
        {clock}
      </p>
      {/* Announce the time only once a minute, not every second. */}
      <p className="sr-only" aria-live="polite">
        {Math.ceil(remainingMs / 60_000)} minutes left
      </p>
      <p className="mt-1 text-sm">You can leave this tab open and come back. {name} will still be here.</p>
    </div>
  );
}
