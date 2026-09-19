import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BevError, classify, review, startClassify, thinkingTime } from "../packages/bev/src/index";
import { RUSH_PENALTY_MS } from "@/lib/bevScript";

// The npm package's library API, in mock mode with fake timers so minutes pass instantly.

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("JEV_PROVIDER", "mock");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

const OPTIONS = ["billing", "shipping", "technical", "other"];

describe("bev-ai library", () => {
  it("resolves with Jev's answer after Bev has finished thinking", async () => {
    const thoughts: string[] = [];
    const pending = classify("I was charged twice, refund please", OPTIONS, { effort: "low", persona: "bev", onThought: (t) => thoughts.push(t.text) });
    let settled = false;
    pending.then(() => (settled = true));

    await vi.advanceTimersByTimeAsync(5_000);
    expect(settled).toBe(false); // Bev is still thinking
    await vi.advanceTimersByTimeAsync(10_000);
    const r = await pending;

    expect(r.choice).toBe("billing");
    expect(r.bevConfidence).toBe(0.97);
    expect(r.jevConfidence).toBe(r.probabilities.billing);
    expect(r.actualMs).toBeGreaterThanOrEqual(200);
    expect(r.actualMs).toBeLessThanOrEqual(450);
    const [min, max] = thinkingTime("low", "bev");
    expect(r.bevMs).toBeGreaterThanOrEqual(min);
    expect(r.bevMs).toBeLessThanOrEqual(max + 50);
    expect(r.provider).toBe("mock");
    expect(r.thoughts).toEqual(thoughts);
    expect(thoughts.at(-1)).toContain("billing");
  });

  it("rush() adds 10 seconds and Bev says so", async () => {
    const run = startClassify("where is my package", OPTIONS, { effort: "low", persona: "bev" });
    await vi.advanceTimersByTimeAsync(2_000);
    run.rush();
    await vi.advanceTimersByTimeAsync(40_000);
    const r = await run.result;
    expect(r.thoughts).toContain("Bev does not appreciate being rushed.");
    expect(r.bevMs).toBeGreaterThanOrEqual(thinkingTime("low", "bev")[0] + RUSH_PENALTY_MS);
  });

  it("review takes the full 10 minutes", async () => {
    const pending = review("Per my last email, please read the attachments.", { persona: "bev" });
    await vi.advanceTimersByTimeAsync(10 * 60_000 + 1_000);
    const r = await pending;
    expect(["fine", "passive-aggressive", "furious", "will get you fired"]).toContain(r.choice);
    expect(r.bevMs).toBeGreaterThanOrEqual(600_000);
  });

  it("rejects bad input with a Bev-voiced BevError", async () => {
    await expect(classify("", OPTIONS)).rejects.toMatchObject({ name: "BevError", code: "invalid_input" });
    await expect(classify("hi", ["one"])).rejects.toBeInstanceOf(BevError);
  });

  it("stops when aborted", async () => {
    const controller = new AbortController();
    const pending = classify("hello", OPTIONS, { effort: "bev", signal: controller.signal });
    const check = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(3_000);
    controller.abort();
    await check;
  });

  it("Gary takes a third of the time", () => {
    expect(thinkingTime("bev", "gary")).toEqual([60_000, 100_000]);
  });
});
