import { describe, expect, it } from "vitest";
import { mockClassify, mockDecide, mockLatency } from "@/lib/jevMock";
import { normalize, resolveProvider } from "@/lib/jev";
import { mulberry32 } from "@/lib/rng";

const support = { billing: null, shipping: null, technical: null, other: null };
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

describe("mock Jev", () => {
  it("probabilities cover every label and sum to 1", () => {
    for (let seed = 0; seed < 200; seed++) {
      const { choice, probabilities } = mockDecide("where is my package", support, mulberry32(seed));
      expect(Object.keys(probabilities)).toEqual(Object.keys(support));
      expect(sum(probabilities)).toBeCloseTo(1, 6);
      expect(Object.values(probabilities).every((p) => p >= 0 && p <= 1)).toBe(true);
      // The choice is always the most likely label.
      expect(probabilities[choice]).toBe(Math.max(...Object.values(probabilities)));
    }
  });

  it("uses keyword hints", () => {
    expect(mockDecide("I was charged twice, I need a refund", support, mulberry32(1)).choice).toBe("billing");
    expect(mockDecide("My package never arrived, tracking says lost", support, mulberry32(1)).choice).toBe("shipping");
    expect(mockDecide("The app crashes with an error on login", support, mulberry32(1)).choice).toBe("technical");
    expect(mockDecide("hello there", support, mulberry32(1)).choice).toBe("other");
  });

  it("fake latency is 200 to 450ms", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 500; i++) {
      const ms = mockLatency(rng);
      expect(ms).toBeGreaterThanOrEqual(200);
      expect(ms).toBeLessThanOrEqual(450);
    }
  });

  it("mockClassify waits the fake latency", async () => {
    let waited = -1;
    const r = await mockClassify("refund please", support, { rng: mulberry32(3), sleep: async (ms) => void (waited = ms) });
    expect(waited).toBeGreaterThanOrEqual(200);
    expect(waited).toBeLessThanOrEqual(450);
    expect(r.choice).toBe("billing");
  });
});

describe("jev adapter", () => {
  it("picks providers in priority order, with override", () => {
    expect(resolveProvider({} as NodeJS.ProcessEnv)).toBe("mock");
    expect(resolveProvider({ OPENROUTER_API_KEY: "x" } as unknown as NodeJS.ProcessEnv)).toBe("openrouter");
    expect(resolveProvider({ OPENROUTER_API_KEY: "x", AI_GATEWAY_API_KEY: "y" } as unknown as NodeJS.ProcessEnv)).toBe("gateway");
    expect(resolveProvider({ AI_GATEWAY_API_KEY: "y", TYPESAFE_API_KEY: "z" } as unknown as NodeJS.ProcessEnv)).toBe("typesafe");
    expect(resolveProvider({ TYPESAFE_API_KEY: "z", JEV_PROVIDER: "mock" } as unknown as NodeJS.ProcessEnv)).toBe("mock");
  });

  it("normalize fills missing probabilities with winner 1.0", () => {
    expect(normalize({ choice: "billing" }, support, "gateway").probabilities).toEqual({ billing: 1, shipping: 0, technical: 0, other: 0 });
  });

  it("normalize rejects a choice that is not an option", () => {
    expect(() => normalize({ choice: "sales" }, support, "typesafe")).toThrow();
  });
});
