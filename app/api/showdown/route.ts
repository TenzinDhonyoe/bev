import { evaluate, JevError, resolveProvider } from "@/lib/jev";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { ERRORS } from "@/lib/copy";
import { mockShowdownAnswers, questionMap, TICKET_TEXT, type ShowdownResult } from "@/lib/showdown";

// One real 27-question Jev request, then cached for a day. The ticket and
// questions never change, so neither do the answers, and visitors share them.
// Two layers: this instance's memory, and the CDN via s-maxage.

export const dynamic = "force-dynamic"; // never call Jev at build time

const TTL_MS = 24 * 60 * 60 * 1000;
let cached: { result: ShowdownResult; at: number } | null = null;
let inflight: Promise<ShowdownResult> | null = null;

async function fetchShowdown(): Promise<ShowdownResult> {
  const provider = resolveProvider();
  if (provider !== "mock") {
    // Warm the connection with a one-question request first, so the time shown
    // is Jev answering 27 questions, not a cold function doing DNS and TLS.
    await evaluate("warm up", { warm: { type: "noul", instructions: "Is this a warm-up?" } }).catch(() => {});
  }
  const r = await evaluate(TICKET_TEXT, questionMap(), { mock: mockShowdownAnswers });
  return {
    answers: r.answers,
    latencyMs: r.latencyMs,
    costUsd: r.costUsd,
    inputTokens: r.inputTokens,
    model: provider === "mock" ? "jev (mock)" : "jev-1.13",
    mock: provider === "mock",
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const fresh = cached && Date.now() - cached.at < TTL_MS;
  if (!fresh) {
    // Only uncached requests count against the limit; they are the ones that reach Jev.
    const limit = checkRateLimit(`showdown:${clientIp(request.headers)}`);
    if (!limit.ok) {
      return Response.json({ error: ERRORS.rateLimited }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
    }
    try {
      inflight ??= fetchShowdown().finally(() => (inflight = null));
      const result = await inflight;
      cached = { result, at: Date.now() };
    } catch (err) {
      const kind = err instanceof JevError ? err.kind : "upstream";
      const message = kind === "rate_limited" || kind === "overloaded" ? ERRORS.overloaded : kind === "auth" ? ERRORS.config : ERRORS.upstream;
      return Response.json({ error: message }, { status: kind === "rate_limited" ? 503 : 502, headers: { "Cache-Control": "no-store" } });
    }
  }

  const result = cached!.result;
  return Response.json(result, {
    headers: {
      "Cache-Control": result.mock ? "no-store" : "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
