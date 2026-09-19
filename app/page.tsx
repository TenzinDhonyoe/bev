import Link from "next/link";
import { BenchmarkChart } from "@/components/BenchmarkChart";
import { BevApp } from "@/components/BevApp";
import { CopyCommand } from "@/components/CopyCommand";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <header className="pb-10 pt-12 sm:pt-20">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Office memo 1987-B · Announcements</p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Introducing System Three Models &amp; Bev
        </h1>
        <p className="mt-4 font-display text-2xl italic text-ink-soft sm:text-3xl">Thinking, Slow and Slower.</p>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed">
          Bev returns the same typed classification as Jev, at the same price, with the same accuracy. Then she takes her
          time. Minutes of visible, thorough, unhurried reasoning, before revealing the answer she had all along.
        </p>
        <div className="mt-8 max-w-xl">
          <CopyCommand command={'npx bev-ai "I was charged twice for my subscription"'} />
          <p className="mt-2 text-sm text-ink-soft">
            A CLI and a library. Bring your own Jev key, or try it in mock mode. Node 22+.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/demo" className="rounded-md border-2 border-ink bg-ink px-5 py-2.5 font-semibold text-card hover:bg-ink-soft">
            Watch Jev vs Bev
          </Link>
          <a href="#demo" className="rounded-md border-2 border-ink bg-card px-5 py-2.5 font-semibold hover:bg-paper">
            Give Bev a ticket
          </a>
          <Link href="/docs" className="rounded-md px-3 py-2.5 font-semibold underline decoration-dotted underline-offset-4 hover:text-ink-soft">
            Read the docs
          </Link>
        </div>
      </header>

      <div className="space-y-14">
        <section aria-labelledby="why">
          <h2 id="why" className="font-display text-2xl font-semibold sm:text-3xl">Why we built Bev</h2>
          <blockquote className="sticky-note mt-5 -rotate-1 px-5 py-4 font-display text-xl italic">
            &ldquo;Users told us Jev was too fast. It didn&apos;t feel like it was thinking.&rdquo;
          </blockquote>
          <p className="mt-5 leading-relaxed">
            Jev answers in 70 to 500 milliseconds. That is wonderful, and it is also a problem, because years of reasoning
            models have taught all of us that waiting means intelligence. A spinner feels like diligence. A wall of
            &ldquo;Hmm, let me reconsider&rdquo; feels like care. So we hired Bev to provide the wait people have learned to
            trust.
          </p>
          <p className="mt-4 leading-relaxed">
            Bev has classified tickets since 1987. She is thorough. She is unhurried. She is always 97% confident.
          </p>
        </section>

        <section aria-labelledby="how">
          <h2 id="how" className="font-display text-2xl font-semibold sm:text-3xl">How Bev works</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              ["1", "Jev decides", "Your text goes to Jev, which returns a choice and calibrated probabilities in well under a second."],
              ["2", "Bev deliberates", "Bev looks for her reading glasses, consults Doreen, reconsiders the runner-up, and puts it in the wrong pile once."],
              ["3", "Bev reveals", "You get Jev's answer, plus exactly how long Bev took and how long the thinking actually took."],
            ].map(([n, title, body]) => (
              <li key={n} className="ruled rounded-md border border-ink/20 bg-card p-4">
                <p className="font-mono text-sm text-ink-soft">Step {n}</p>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="rlud">
          <h2 id="rlud" className="font-display text-2xl font-semibold sm:text-3xl">Trained with RLUD</h2>
          <p className="mt-4 leading-relaxed">
            Bev was trained with <strong>Reinforcement Learning for Unhurried Decisions</strong>. Each episode, Bev was
            rewarded for every second of visible effort and penalized for any sign of haste. Over thousands of episodes,
            Bev learned to refill her coffee at exactly the right moment.
          </p>
          <p className="mt-4 leading-relaxed">
            The name comes from <strong>Bevons&apos; Paradox</strong>: the more efficient a process becomes, the more
            meetings are scheduled about it.
          </p>
        </section>

        <section aria-labelledby="bench">
          <h2 id="bench" className="font-display text-2xl font-semibold sm:text-3xl">Benchmarks</h2>
          <p className="mt-4 text-xl font-medium leading-relaxed">
            Same price as Jev. Same accuracy as Jev (it is Jev). 200x the reasoning experience.
          </p>
          <div className="mt-6">
            <BenchmarkChart />
          </div>
        </section>

        <section aria-labelledby="pricing">
          <h2 id="pricing" className="font-display text-2xl font-semibold sm:text-3xl">Pricing</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              ["$0.042", "per million input tokens"],
              ["Free", "waiting"],
              ["Priceless", "Bev's time"],
            ].map(([big, small]) => (
              <div key={small} className="rounded-md border-2 border-ink bg-card p-4 text-center">
                <p className="font-display text-3xl font-bold">{big}</p>
                <p className="mt-1 text-sm text-ink-soft">{small}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 leading-relaxed">$0.042 per million input tokens. Waiting is free. Bev&apos;s time is priceless.</p>
        </section>

        <section id="demo" aria-labelledby="demo-heading" className="scroll-mt-6">
          <h2 id="demo-heading" className="font-display text-2xl font-semibold sm:text-3xl">Give Bev a ticket</h2>
          <p className="mt-2 text-ink-soft">
            Need the answer right now? Jev is right there, and it is excellent. Bev is for when you would like to watch.
          </p>
          <div className="mt-6 rounded-md border-2 border-ink/20 bg-card/50 p-4 sm:p-6">
            <BevApp />
          </div>
        </section>
      </div>
    </div>
  );
}
