import { describe, expect, it } from "vitest";
import {
  buildScript,
  durationRange,
  extractWords,
  progressAt,
  rankChoices,
  rushScript,
  RUSH_PENALTY_MS,
  type Effort,
} from "@/lib/bevScript";
import { POOLS, type Persona } from "@/lib/bevLines";

const EFFORTS: Effort[] = ["low", "medium", "high", "bev"];
const PERSONAS: Persona[] = ["bev", "gary"];
const TEXTS = [
  "My card was charged twice for the premium subscription and nobody answers the phone",
  "the and of to", // nothing but stopwords: no {word} available
  "Per my previous email, the quarterly report is overdue.",
  "",
];
const SEEDS = Array.from({ length: 60 }, (_, i) => i * 7919 + 1);

function* allScripts() {
  for (const persona of PERSONAS)
    for (const mode of ["classify", "review"] as const)
      for (const effort of mode === "review" ? (["medium"] as Effort[]) : EFFORTS)
        for (const text of TEXTS)
          for (const seed of SEEDS)
            yield { persona, mode, effort, text, seed, script: buildScript({ text, winner: "billing", runnerUp: "shipping", effort, seed, persona, mode }) };
}

describe("bevScript", () => {
  it("always fills every slot", () => {
    for (const { script } of allScripts()) {
      for (const line of script.lines) expect(line.text).not.toMatch(/\{\w+\}/);
    }
  });

  it("never repeats a line within a run", () => {
    for (const { script } of allScripts()) {
      const texts = script.lines.map((l) => l.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });

  it("opens with the ticket, ends on the winner, and the runner-up only appears before the end", () => {
    for (const { script } of allScripts()) {
      const { lines } = script;
      expect(lines[0].kind).toBe("opener");
      const last = lines[lines.length - 1];
      expect(last.kind).toBe("final");
      expect(last.text).toContain("billing");
      expect(last.text).not.toContain("shipping");
      expect(lines.filter((l) => l.kind === "final")).toHaveLength(1);
      expect(lines.filter((l) => l.kind === "setback")).toHaveLength(1);
      const runnerUpIdx = lines.findIndex((l) => l.kind === "runnerUp");
      expect(runnerUpIdx).toBeGreaterThan(0);
      expect(lines[runnerUpIdx].text).toContain("shipping");
    }
  });

  it("never mentions the winner before the closing lines", () => {
    for (const { script } of allScripts()) {
      for (const line of script.lines) {
        if (line.kind !== "final" && line.kind !== "preFinal") expect(line.text).not.toContain("billing");
      }
    }
  });

  it("keeps total duration within the effort range, and lines in order", () => {
    for (const { script, effort, persona, mode } of allScripts()) {
      const [min, max] = durationRange(effort, persona, mode);
      expect(script.totalMs).toBeGreaterThanOrEqual(min);
      expect(script.totalMs).toBeLessThanOrEqual(max);
      expect(script.lines[script.lines.length - 1].atMs).toBe(script.totalMs);
      for (let i = 1; i < script.lines.length; i++) {
        expect(script.lines[i].atMs).toBeGreaterThanOrEqual(script.lines[i - 1].atMs);
      }
    }
  });

  it("matches the spec's effort durations", () => {
    expect(durationRange("low")).toEqual([8_000, 12_000]);
    expect(durationRange("medium")).toEqual([25_000, 35_000]);
    expect(durationRange("high")).toEqual([80_000, 100_000]);
    expect(durationRange("bev")).toEqual([180_000, 300_000]);
    expect(durationRange("bev", "gary")).toEqual([60_000, 100_000]);
    expect(durationRange("low", "bev", "review")).toEqual([600_000, 600_000]);
  });

  it("is deterministic per seed and different across seeds", () => {
    const a = buildScript({ text: TEXTS[0], winner: "billing", runnerUp: "shipping", effort: "bev", seed: 42 });
    const b = buildScript({ text: TEXTS[0], winner: "billing", runnerUp: "shipping", effort: "bev", seed: 42 });
    const c = buildScript({ text: TEXTS[0], winner: "billing", runnerUp: "shipping", effort: "bev", seed: 43 });
    expect(a).toEqual(b);
    expect(a.lines.map((l) => l.text)).not.toEqual(c.lines.map((l) => l.text));
  });

  it("uses words from the user's text", () => {
    const s = buildScript({ text: "Quarterly spreadsheet disaster", winner: "billing", runnerUp: "shipping", effort: "bev", seed: 5 });
    const joined = s.lines.map((l) => l.text).join(" ");
    expect(joined).toMatch(/Quarterly|spreadsheet|disaster/);
  });

  it("has triplicate in roughly 1 in 20 runs", () => {
    let count = 0;
    for (let seed = 0; seed < 4000; seed++) {
      if (buildScript({ text: "x", winner: "a", runnerUp: "b", effort: "low", seed }).triplicate) count++;
    }
    expect(count / 4000).toBeGreaterThan(0.03);
    expect(count / 4000).toBeLessThan(0.07);
  });
});

describe("rushScript", () => {
  it("adds 10 seconds, inserts the rushed line now, and keeps lines unique", () => {
    let s = buildScript({ text: TEXTS[0], winner: "billing", runnerUp: "shipping", effort: "medium", seed: 9 });
    const original = s.totalMs;
    for (let i = 0; i < 8; i++) s = rushScript(s, 5_000 + i * 100);
    expect(s.totalMs).toBe(original + 8 * RUSH_PENALTY_MS);
    expect(s.lines[s.lines.length - 1].kind).toBe("final");
    expect(s.lines[s.lines.length - 1].atMs).toBe(s.totalMs);
    expect(s.lines.find((l) => l.kind === "rushed")?.text).toBe("Bev does not appreciate being rushed.");
    const texts = s.lines.map((l) => l.text);
    expect(new Set(texts).size).toBe(texts.length);
  });
});

describe("progressAt", () => {
  it("crawls up, jumps back exactly once, and finishes at 1", () => {
    const s = buildScript({ text: TEXTS[0], winner: "billing", runnerUp: "shipping", effort: "high", seed: 3 });
    let drops = 0;
    let prev = 0;
    for (let t = 0; t <= s.totalMs; t += 250) {
      const p = progressAt(s, t);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
      if (p < prev - 0.05) drops++;
      prev = p;
    }
    expect(drops).toBe(1);
    expect(progressAt(s, s.totalMs)).toBe(1);
  });
});

describe("helpers", () => {
  it("extractWords skips stopwords and short words", () => {
    expect(extractWords("Hi, I was charged TWICE for the invoice and it is not ok")).toEqual(["charged", "TWICE", "invoice"]);
  });

  it("rankChoices picks the most likely non-winner as runner-up", () => {
    expect(rankChoices("a", { a: 0.6, b: 0.1, c: 0.3 })).toEqual({ winner: "a", runnerUp: "c" });
  });

  it("the line library has 60+ lines, all third person with no em dashes", () => {
    const all = Object.values(POOLS.bev).flat();
    expect(all.length).toBeGreaterThanOrEqual(60);
    for (const line of [...all, ...Object.values(POOLS.gary).flat()]) {
      expect(line).not.toMatch(/—|–/);
      expect(line).not.toMatch(/\b(I|I'm|I've|me|my)\b/);
      // Slots never lead a line, so user labels keep their casing without a lowercase first letter.
      expect(line).not.toMatch(/^"?\{/);
    }
  });
});
