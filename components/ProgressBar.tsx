type Props = { value: number; label: string };

/** Crawls, and once per run jumps backwards. The math lives in lib/bevScript `progressAt`. */
export function ProgressBar({ value, label }: Props) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-xs text-ink-soft">
        <span>{label}</span>
        <span aria-hidden="true">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-4 overflow-hidden rounded-sm border border-ink/30 bg-card"
      >
        <div
          className="h-full bg-folder transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `${pct}%`,
            backgroundImage: "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.18) 0 8px, transparent 8px 16px)",
          }}
        />
      </div>
    </div>
  );
}
