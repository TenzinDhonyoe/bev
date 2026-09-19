import type { Metadata } from "next";
import { Showdown } from "@/components/Showdown";

export const metadata: Metadata = {
  title: "Jev vs Bev",
  description: "Same 27 questions. Same request. Same price. Jev answers in under a second. Bev takes 3 to 5 minutes.",
};

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#3b6ea5]" />
          Live race · real Jev answers
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Jev <span className="font-medium italic text-ink-soft">vs</span> Bev
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          A customer has written in about a very slow classifier. Jev reads the ticket once. Bev reads it very carefully.
        </p>
      </div>
      <div className="mt-8">
        <Showdown />
      </div>
    </div>
  );
}
