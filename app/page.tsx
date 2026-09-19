import Link from "next/link";
import type { ReactNode } from "react";
import { BenchmarkChart } from "@/components/BenchmarkChart";
import { BevApp } from "@/components/BevApp";
import { CopyCommand } from "@/components/CopyCommand";
import { HeroTerminal } from "@/components/HeroTerminal";

/** A full-width band: heading on the left, content on the right (stacked on phones). */
function Band({ id, title, children }: { id: string; title: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-rule py-14 sm:py-20">
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-10 [&>*]:min-w-0">
        <h2 id={id} className="font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl lg:col-span-4">
          {title}
        </h2>
        <div className="lg:col-span-8">{children}</div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:py-24 [&>*]:min-w-0">
        <div className="lg:col-span-5">
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Introducing System Three Models &amp; Bev
          </h1>
          <p className="mt-4 font-display text-xl text-ink-soft sm:text-2xl">Thinking, Slow and Slower.</p>
          <p className="mt-6 max-w-md leading-relaxed">
            Bev returns Jev&apos;s exact answer, at Jev&apos;s price. Then she takes her time, and tells you how long the
            real thinking took.
          </p>
          <div className="mt-8 max-w-md">
            <CopyCommand command={'npx bev-ai "I was charged twice"'} />
            <p className="mt-2 text-sm text-ink-soft">Node 22 or later. Works without a key in mock mode.</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href="/demo" className="rounded-md bg-ink px-4 py-2.5 font-medium text-card hover:bg-ink-soft">
              Watch Jev race Bev
            </Link>
            <Link href="/docs" className="font-medium underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              Read the docs
            </Link>
          </div>
        </div>
        <div className="lg:col-span-7">
          <HeroTerminal />
        </div>
      </section>

      <Band id="bench" title="Same price as Jev. Same accuracy as Jev (it is Jev). 200x the reasoning experience.">
        <BenchmarkChart />
      </Band>

      <Band id="why" title="Users told us Jev was too fast. It didn't feel like it was thinking.">
        <div className="max-w-2xl space-y-4 leading-relaxed">
          <p>
            Jev answers in 70 to 500 milliseconds. Years of reasoning models have taught all of us that waiting means
            intelligence: a spinner feels like diligence, and a wall of &ldquo;let me reconsider&rdquo; feels like care. So
            we hired Bev to provide the wait people have learned to trust. She has classified tickets since 1987, and she
            is always 97% confident.
          </p>
          <p>
            Bev was trained with <strong>Reinforcement Learning for Unhurried Decisions</strong>: rewarded for every
            second of visible effort, penalized for any sign of haste. The name comes from{" "}
            <strong>Bevons&apos; Paradox</strong>: the more efficient a process becomes, the more meetings are scheduled
            about it.
          </p>
          <p className="text-ink-soft">
            Need the answer right now? Use Jev directly. It is excellent. Bev is for when you would like to watch.
          </p>
        </div>
      </Band>

      <Band id="pricing" title="Pricing">
        <p className="max-w-2xl font-display text-2xl leading-snug sm:text-3xl">
          $0.042 per million input tokens. Waiting is free. Bev&apos;s time is priceless.
        </p>
        <p className="mt-3 text-ink-soft">You pay Jev&apos;s price with your own key. Bev does not charge for the minutes.</p>
      </Band>

      <section id="demo" aria-labelledby="demo-heading" className="scroll-mt-6 border-t border-rule py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 [&>*]:min-w-0">
          <div className="lg:col-span-4">
            <h2 id="demo-heading" className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Try Bev in your browser
            </h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Classify a support ticket, or have Bev review an email before you send it. The answer comes from Jev in
              under a second. The rest is Bev.
            </p>
          </div>
          <div className="rounded-lg border border-ink/15 bg-card p-5 sm:p-8 lg:col-span-8">
            <BevApp />
          </div>
        </div>
      </section>
    </div>
  );
}
