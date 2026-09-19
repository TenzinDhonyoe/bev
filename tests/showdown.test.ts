import { describe, expect, it } from "vitest";
import { buildShowdownScript, rushShowdown, SHOWDOWN_RANGE_MS, tokenEnds, visibleChars } from "@/lib/showdownScript";
import { mockShowdownAnswers, QUESTIONS, questionMap } from "@/lib/showdown";
import { answerBlock, answerJson, formatCost, num } from "@/lib/showdownFormat";
import { GARY_SPEEDUP, RUSH_PENALTY_MS } from "@/lib/bevScript";
import { normalizeAnswer } from "@/lib/jev";

describe("showdown questions", () => {
  it("has 15 yes/no, 7 choice, 5 score questions, opening with the original's first question", () => {
    const count = (t: string) => QUESTIONS.filter((q) => q.type === t).length;
    expect([count("noul"), count("choice"), count("score")]).toEqual([15, 7, 5]);
    expect(QUESTIONS[0].label).toBe("Revenue currently impacted?");
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(27);
    for (const q of QUESTIONS) if (q.type === "score") expect(q.levels).toHaveLength(5);
  });

  it("mock fixture answers every question with valid distributions", () => {
    const answers = mockShowdownAnswers();
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      expect(a.type).toBe(q.type);
      if (a.type === "choice" || a.type === "score") {
        expect(Object.values(a.probabilities).reduce((x, y) => x + y, 0)).toBeCloseTo(1, 6);
      }
    }
    // Low answers exist, so the column does not look fake.
    expect(answers.refund_requested).toMatchObject({ type: "noul" });
    expect((answers.refund_requested as { noul: number }).noul).toBeLessThan(0.1);
  });

  it("questionMap strips display labels", () => {
    const m = questionMap();
    expect(Object.keys(m)).toHaveLength(27);
    expect(m.revenue_impacted).toEqual({ type: "noul", instructions: "Revenue currently impacted?" });
  });
});

describe("Bev's showdown script", () => {
  const seeds = Array.from({ length: 200 }, (_, i) => i * 104729 + 3);
  const answerText = answerBlock(QUESTIONS, mockShowdownAnswers());
  const build = (seed: number, persona: "bev" | "gary" = "bev") => buildShowdownScript({ seed, persona, answerText });

  it("streams exactly Jev's answers, finishing at totalMs within the race range", () => {
    for (const persona of ["bev", "gary"] as const) {
      for (const seed of seeds) {
        const s = build(seed, persona);
        const [min, max] = SHOWDOWN_RANGE_MS[persona];
        expect(s.totalMs).toBeGreaterThanOrEqual(min);
        expect(s.totalMs).toBeLessThanOrEqual(max);
        expect(s.answer.text).toBe(answerText);
        expect(s.answer.endMs).toBe(s.totalMs);
        expect(visibleChars(s.answer, s.totalMs)).toBe(answerText.length);
        expect(visibleChars(s.answer, s.answer.startMs - 1)).toBe(0);
      }
    }
  });

  it("waits for a first token, thinks, then answers, with tokens in order", () => {
    for (const seed of seeds) {
      const s = build(seed);
      expect(s.thinking.startMs).toBeGreaterThan(0);
      expect(s.thinking.endMs).toBeLessThan(s.answer.startMs);
      for (const stream of [s.thinking, s.answer]) {
        for (let i = 1; i < stream.times.length; i++) {
          expect(stream.times[i]).toBeGreaterThanOrEqual(stream.times[i - 1]);
          expect(stream.ends[i]).toBeGreaterThan(stream.ends[i - 1]);
        }
      }
    }
  });

  it("thinks in third person, with no repeats, slots or em dashes, and always mentions Doreen", () => {
    for (const persona of ["bev", "gary"] as const) {
      for (const seed of seeds) {
        const lines = build(seed, persona).thinking.text.split("\n");
        expect(new Set(lines).size).toBe(lines.length);
        expect(lines.join(" ")).toMatch(/Doreen/);
        for (const t of lines) {
          expect(t).not.toMatch(/[{}\u2014\u2013]/);
          expect(t).not.toMatch(/\b(I|I'm|me|my)\b/);
        }
      }
    }
  });

  it("Bev takes about 15 seconds, like a thinking LLM; Gary a third of that", () => {
    expect(SHOWDOWN_RANGE_MS.bev).toEqual([14_000, 16_000]);
    expect(SHOWDOWN_RANGE_MS.gary.map((ms) => Math.round((ms * GARY_SPEEDUP) / 1000))).toEqual([14, 16]);
  });

  it("rushing stalls the stream by 10 seconds and still delivers every character", () => {
    let s = build(7);
    const total = s.totalMs;
    const shownAt3s = visibleChars(s.thinking, 3_000);
    for (let i = 0; i < 3; i++) s = rushShowdown(s, 3_000);
    expect(s.totalMs).toBe(total + 3 * RUSH_PENALTY_MS);
    expect(visibleChars(s.thinking, 3_000)).toBe(shownAt3s);
    expect(visibleChars(s.answer, s.totalMs)).toBe(answerText.length);
    expect(s.rushes.map((r) => r.text)[0]).toBe("Bev does not appreciate being rushed.");
  });

  it("tokenizes into word-ish chunks that cover the whole text", () => {
    const text = '  "Revenue currently impacted?": {"noul": 0.68, "type": "noul"},';
    const ends = tokenEnds(text);
    expect(ends.at(-1)).toBe(text.length);
    expect(ends.length).toBeGreaterThan(10);
  });
});

describe("answer normalization across providers", () => {
  const noul = { type: "noul" as const, instructions: "x" };
  const score = { type: "score" as const, instructions: "x", levels: ["a", "b", "c"] };

  it("reads TypeSafe `noul` and AI SDK `probability`", () => {
    expect(normalizeAnswer({ type: "noul", noul: 0.85 }, noul, "typesafe")).toEqual({ type: "noul", noul: 0.85 });
    expect(normalizeAnswer({ type: "boolean", probability: 0.2 }, noul, "gateway")).toEqual({ type: "noul", noul: 0.2 });
    expect(() => normalizeAnswer({ type: "boolean" }, noul, "gateway")).toThrow();
  });

  it("fills score confidence and legend when the provider omits them", () => {
    const a = normalizeAnswer({ type: "score", score: 1.3, probabilities: { "1": 0.7, "2": 0.3 } }, score, "gateway");
    expect(a).toEqual({
      type: "score",
      score: 1.3,
      confidence: 0.7,
      probabilities: { "0": 0, "1": 0.7, "2": 0.3 },
      legend: { "0": "a", "1": "b", "2": "c" },
    });
  });
});

describe("showdown formatting", () => {
  it("prints numbers and lines like the original race", () => {
    expect(num(0.85)).toBe("0.85");
    expect(num(1)).toBe("1.0");
    expect(answerJson({ type: "noul", noul: 0.85 })).toBe(`{"noul": 0.85, "type": "noul"}`);
    expect(answerJson({ type: "choice", choice: "latency", confidence: 0.96, probabilities: { latency: 0.96, outage: 0.04 } })).toBe(
      `{"choice": "latency", "confidence": 0.96, "probabilities": {"latency": 0.96, "outage": 0.04}}`,
    );
  });

  it("formats tiny costs without scientific notation", () => {
    expect(formatCost(0.0000126)).toBe("$0.000013");
    expect(formatCost(0.000081)).toBe("$0.000081");
    expect(formatCost(1.2e-7)).toBe("$0.00000012");
    expect(formatCost(null)).toBe("unknown");
  });
});
