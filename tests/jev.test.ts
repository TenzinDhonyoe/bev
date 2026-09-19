import { afterEach, describe, expect, it, vi } from "vitest";
import { classify, JevError } from "@/lib/jev";

const criteria = { billing: null, shipping: null };

function stubFetch(...responses: Array<{ status: number; body?: unknown }>) {
  const fetchMock = vi.fn();
  for (const r of responses) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(r.body ?? {}), { status: r.status }));
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("classify via TypeSafe direct", () => {
  it("sends the official request shape and returns the normalized result", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "test-key");
    const fetchMock = stubFetch({
      status: 200,
      body: { answers: { verdict: { type: "choice", choice: "billing", confidence: 0.9, probabilities: { billing: 0.9, shipping: 0.1 } } } },
    });
    const r = await classify("charged twice", criteria, { instructions: "Which queue?" });
    expect(r.choice).toBe("billing");
    expect(r.probabilities).toEqual({ billing: 0.9, shipping: 0.1 });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.typesafe.ai/v1/systemone");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toEqual({
      model: "jev-latest",
      state: "charged twice",
      questions: { verdict: { type: "choice", instructions: "Which queue?", criteria } },
    });
  });

  it("retries once on 529, then reports overloaded", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "k");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = stubFetch({ status: 529 }, { status: 529 });
    await expect(classify("x", criteria)).rejects.toMatchObject({ kind: "overloaded", status: 529 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps 401 to auth and never logs the user text", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "k");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch({ status: 401 });
    const err = await classify("SECRET USER TEXT", criteria).catch((e) => e);
    expect(err).toBeInstanceOf(JevError);
    expect(err.kind).toBe("auth");
    expect(log.mock.calls.flat().join(" ")).not.toContain("SECRET");
  });
});

describe("classify via OpenRouter", () => {
  it("uses the alpha decisions endpoint and OpenRouter model id", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "or-key");
    const fetchMock = stubFetch({ status: 200, body: { id: "x", answers: { verdict: { choice: "shipping" } } } });
    const r = await classify("where is my box", criteria);
    expect(fetchMock.mock.calls[0][0]).toBe("https://openrouter.ai/api/alpha/decisions");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe("typesafe/jev-1.13");
    expect(r.probabilities).toEqual({ billing: 0, shipping: 1 });
  });
});
