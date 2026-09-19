import type { Metadata } from "next";
import { CopyCommand } from "@/components/CopyCommand";

export const metadata: Metadata = {
  title: "Docs",
  description: "Use Bev from your terminal or your code. npx bev-ai. Real Jev answers, delivered slowly.",
};

function Code({ children, label }: { children: string; label: string }) {
  return (
    <figure className="mt-3">
      <figcaption className="font-mono text-xs uppercase tracking-widest text-ink-soft">{label}</figcaption>
      <pre className="mt-1 overflow-x-auto rounded-md border-2 border-ink bg-term p-4 font-mono text-[13px] leading-relaxed text-term-text">
        <code>{children}</code>
      </pre>
    </figure>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 font-display text-2xl font-semibold">
      {children}
    </h2>
  );
}

const FLAGS: [string, string][] = [
  ["-o, --options <a,b,c>", "2 to 8 comma-separated options. Default: billing, shipping, technical, other."],
  ["-p, --preset <name>", "support (default) or vibe (good news, bad news, neutral)."],
  ["-e, --effort <level>", "low (about 10s), medium (about 30s, default), high (about 90s), bev (3 to 5 minutes)."],
  ["--json", "Print the result as JSON on stdout. Bev's thinking still goes to stderr."],
  ["-q, --quiet", "Do not print Bev's thinking. Bev still does it."],
  ["--gary", "Let Gary handle it. Gary covers Fridays, takes a third of the time, and has seen worse."],
];

const KEYS: [string, string][] = [
  ["TYPESAFE_API_KEY", "TypeSafe direct"],
  ["AI_GATEWAY_API_KEY", "Vercel AI Gateway (typesafe-ai/jev)"],
  ["OPENROUTER_API_KEY", "OpenRouter (typesafe/jev-1.13)"],
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Docs · bev-ai 0.1</p>
      <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Using Bev</h1>
      <p className="mt-4 text-lg leading-relaxed">
        Bev runs in your terminal and in your code. She asks Jev, gets the real answer in under a second, then takes her
        time. Requires Node 22 or later.
      </p>
      <div className="mt-6">
        <CopyCommand command={'npx bev-ai "I was charged twice for my subscription"'} />
      </div>

      <section className="mt-12" aria-labelledby="cli">
        <H2 id="cli">Command line</H2>
        <Code label="Examples">{`npx bev-ai "Where is my package?"                    # support queues
npx bev-ai "Great news, I got promoted" -p vibe      # good news / bad news / neutral
npx bev-ai "Ship it?" -o "yes,no,after lunch"        # your own options
npx bev-ai "Where is my package?" -e bev             # 3 to 5 minutes of reasoning
npx bev-ai review "Per my last email..."             # 10-minute tone review
echo "Refund please" | npx bev-ai --json > out.json  # JSON on stdout`}</Code>
        <p className="mt-4 leading-relaxed">
          While Bev thinks, press <kbd className="rounded border border-ink/30 bg-card px-1.5 font-mono text-sm">r</kbd> to
          rush her. Each rush adds 10 seconds. Bev does not appreciate being rushed.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink">
                <th scope="col" className="py-2 pr-4">Flag</th>
                <th scope="col" className="py-2">What it does</th>
              </tr>
            </thead>
            <tbody>
              {FLAGS.map(([flag, desc]) => (
                <tr key={flag} className="border-b border-rule align-top">
                  <td className="whitespace-nowrap py-2 pr-4 font-mono">{flag}</td>
                  <td className="py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="lib">
        <H2 id="lib">In your code</H2>
        <Code label="npm install bev-ai">{`import { classify } from "bev-ai";

const result = await classify(
  "My package never arrived",
  ["billing", "shipping", "technical", "other"],
  { effort: "low", onThought: (t) => console.log(t.text) },
);

result.choice;         // "shipping", straight from Jev
result.probabilities;  // Jev's real probabilities
result.bevConfidence;  // 0.97, always
result.jevConfidence;  // what Jev actually thought
result.bevMs;          // how long Bev took
result.actualMs;       // how long Jev took`}</Code>
        <p className="mt-4 leading-relaxed">
          <code className="font-mono">startClassify</code> and <code className="font-mono">startReview</code> return{" "}
          <code className="font-mono">{"{ result, rush }"}</code> so you can rush Bev from your own UI. Options can be an array of
          labels or an object of <code className="font-mono">{"{ label: description }"}</code>. Pass{" "}
          <code className="font-mono">signal</code> to stop waiting. Errors are <code className="font-mono">BevError</code>s, in
          Bev&apos;s voice.
        </p>
      </section>

      <section className="mt-12" aria-labelledby="keys">
        <H2 id="keys">Jev keys</H2>
        <p className="mt-3 leading-relaxed">
          Bring your own Jev key. Set one of these; the first one found wins. With none, Bev runs in mock mode and says so.
        </p>
        <dl className="mt-3 divide-y divide-rule border-y border-rule">
          {KEYS.map(([key, backend]) => (
            <div key={key} className="grid gap-1 py-2 sm:grid-cols-[14rem_1fr]">
              <dt className="font-mono text-sm font-semibold">{key}</dt>
              <dd className="text-sm">{backend}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink-soft">
          Your text only goes to the backend you configured. Bev stores nothing. Bev has a filing cabinet, but your ticket
          is not in it.
        </p>
      </section>

      <section className="mt-12" aria-labelledby="fax">
        <H2 id="fax">
          <span className="line-through decoration-stamp decoration-2">POST /fax</span>{" "}
          <span className="align-middle font-mono text-sm font-normal text-ink-soft">deprecated</span>
        </H2>
        <p className="mt-3 leading-relaxed">
          The fax endpoint has been retired. Bev is still upset about it. Existing faxes will be answered in the order they
          were received, which is to say eventually.
        </p>
        <p className="sticky-note mt-5 -rotate-1 px-4 py-3 text-sm">
          The real decision comes from Jev by TypeSafe AI, which has actual docs and an actual API. If you need the answer
          quickly, use Jev directly. Bev will understand.
        </p>
      </section>
    </div>
  );
}
