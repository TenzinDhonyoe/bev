import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Bev, answered at Bev's pace.",
};

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Can Bev run in real time?",
    a: "Bev does not know what that means.",
  },
  {
    q: "Why is Bev slow?",
    a: (
      <>
        Because slow feels smart. In 2011, Ryan Buell and Michael Norton described the{" "}
        <a
          className="underline decoration-dotted underline-offset-4"
          href="https://doi.org/10.1287/mnsc.1110.1376"
          rel="noreferrer"
          target="_blank"
        >
          labor illusion
        </a>
        : people value a service more when they can see the effort behind it, even when the result is the same. Travel
        sites that showed their search working were rated higher than ones that returned instant results. Bev is that
        finding, with a cardigan.
      </>
    ),
  },
  {
    q: "Is Bev actually thinking?",
    a: "No. Jev makes the decision in well under a second. Everything after that is theatre, written from a library of lines about coffee, printers, and Doreen. That is why every result tells you the actual thinking time.",
  },
  {
    q: "Is Bev more accurate than Jev?",
    a: "Bev is exactly as accurate as Jev, because Bev is Jev. The minutes of reasoning add nothing except atmosphere.",
  },
  {
    q: "Why is Bev always 97% confident?",
    a: "Bev has been 97% confident since 1987. If you want the real number, it is right underneath: Jev's actual confidence.",
  },
  {
    q: "What happens to my text?",
    a: "It is sent to Jev to be classified, and the answer comes back. Nothing is stored and nothing is logged. Bev has a filing cabinet, but your ticket is not in it.",
  },
  {
    q: "Can I rush Bev?",
    a: "You can try. Each time adds 10 seconds. Bev does not appreciate being rushed.",
  },
  {
    q: "Who is Gary?",
    a: "Gary covers for Bev on Fridays. Gary takes about a third of the time and has seen worse.",
  },
  {
    q: "Is Bev affiliated with TypeSafe AI?",
    a: "No. Bev is an affectionate parody built on top of Jev. Bev just works here.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Frequently asked questions</h1>
      <p className="mt-4 text-lg text-ink-soft">Answered at Bev&apos;s pace, but printed here for yours.</p>
      <div className="mt-8 divide-y divide-rule border-y border-rule">
        {FAQ.map(({ q, a }, i) => (
          <details key={q} open={i < 2} className="group py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-display text-xl font-semibold">
              {q}
              <span aria-hidden="true" className="mt-1 font-mono text-base text-ink-soft group-open:rotate-45 motion-safe:transition-transform">
                +
              </span>
            </summary>
            <div className="mt-3 max-w-2xl leading-relaxed">{a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
