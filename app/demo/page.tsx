import type { Metadata } from "next";
import { Showdown } from "@/components/Showdown";

export const metadata: Metadata = {
  title: "Jev vs Bev",
  description: "Same 27 questions. Same request. Same price. Jev answers in under a second. Bev thinks it over.",
};

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Jev vs Bev</h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          A customer has written in about a very slow classifier. Both get the same ticket and the same 27 questions.
          Jev reads it once. Bev reads it very carefully.
        </p>
      </div>
      <div className="mt-10">
        <Showdown />
      </div>
    </div>
  );
}
