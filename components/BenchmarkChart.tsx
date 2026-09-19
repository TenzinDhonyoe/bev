// Jev vs Bev, as small multiples: each metric has its own unit and scale.
// Palette validated with the dataviz checker (lightness, chroma, CVD, contrast).

const SERIES = {
  jev: { name: "Jev", color: "#3b6ea5" },
  bev: { name: "Bev", color: "#b8862f" },
} as const;

type Metric = {
  title: string;
  note: string;
  jev: { value: string; width: number };
  bev: { value: string; width: number; offEdge?: boolean };
};

const METRICS: Metric[] = [
  {
    title: "Accuracy",
    note: "Relative to Jev. Identical, because Bev is Jev.",
    jev: { value: "100%", width: 100 },
    bev: { value: "100%", width: 100 },
  },
  {
    title: "Median latency",
    note: "Lower is faster. Bev's bar continues into the parking lot.",
    jev: { value: "0.38s", width: 0.6 },
    bev: { value: "2m 14s", width: 100, offEdge: true },
  },
  {
    title: "Felt smarter",
    note: "Survey of Bev's coworkers (n = 3, one was Doreen).",
    jev: { value: "12%", width: 12 },
    bev: { value: "97%", width: 97 },
  },
];

function Bar({ series, value, width, offEdge }: { series: keyof typeof SERIES; value: string; width: number; offEdge?: boolean }) {
  const s = SERIES[series];
  return (
    <div className="grid grid-cols-[2.5rem_1fr] items-center gap-2" title={`${s.name}: ${value}`}>
      <span className="text-sm text-ink-soft">{s.name}</span>
      {offEdge ? (
        // Runs past the panel edge (the panel clips it) and fades out.
        <div className="relative h-6">
          <div
            className="absolute inset-y-0 left-0 rounded-r-[4px]"
            style={{ width: "calc(100% + 4rem)", background: s.color, maskImage: "linear-gradient(to right, #000 80%, transparent)" }}
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-sm font-semibold text-ink">
            {value}...
          </span>
        </div>
      ) : (
        <div className="flex h-6 items-center gap-2">
          <div className="h-full flex-1">
            <div className="h-full rounded-r-[4px]" style={{ width: `max(${width}%, 3px)`, background: s.color }} />
          </div>
          <span className="w-12 shrink-0 font-mono text-sm">{value}</span>
        </div>
      )}
    </div>
  );
}

export function BenchmarkChart() {
  return (
    <figure className="rounded-lg border border-ink/15 bg-card p-5 sm:p-6">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-xl font-semibold">Jev vs Bev</span>
        <span className="flex gap-4 text-sm text-ink-soft" aria-hidden="true">
          {Object.values(SERIES).map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </span>
      </figcaption>

      <div className="mt-5 grid gap-6 md:grid-cols-3 md:gap-8" aria-hidden="true">
        {METRICS.map((m) => (
          <div key={m.title} className="min-w-0 overflow-hidden">
            <h3 className="font-semibold">{m.title}</h3>
            <div className="mt-2 space-y-[2px]">
              <Bar series="jev" {...m.jev} />
              <Bar series="bev" {...m.bev} />
            </div>
            <p className="mt-2 text-xs text-ink-soft">{m.note}</p>
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>Jev vs Bev benchmark</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Jev</th>
            <th scope="col">Bev</th>
          </tr>
        </thead>
        <tbody>
          {METRICS.map((m) => (
            <tr key={m.title}>
              <th scope="row">{m.title}</th>
              <td>{m.jev.value}</td>
              <td>{m.bev.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
