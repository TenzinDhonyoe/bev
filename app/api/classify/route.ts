import { classify, JevError, type JevErrorKind } from "@/lib/jev";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { validateClassifyRequest } from "@/lib/validate";
import { ERRORS } from "@/lib/copy";

// Nothing here is stored or logged. User text only travels to Jev and back.

const INSTRUCTIONS = {
  classify: "Which category best fits this text?",
  review: "How is the recipient most likely to read this message?",
} as const;

const ERROR_RESPONSES: Record<JevErrorKind, { status: number; message: string }> = {
  auth: { status: 500, message: ERRORS.config },
  bad_request: { status: 502, message: ERRORS.upstream },
  rate_limited: { status: 503, message: ERRORS.overloaded },
  overloaded: { status: 503, message: ERRORS.overloaded },
  timeout: { status: 504, message: ERRORS.timeout },
  upstream: { status: 502, message: ERRORS.upstream },
};

function error(status: number, message: string, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  const limit = checkRateLimit(clientIp(request.headers));
  if (!limit.ok) {
    return error(429, ERRORS.rateLimited, { "Retry-After": String(limit.retryAfterSec) });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, ERRORS.badJson);
  }

  const parsed = validateClassifyRequest(body);
  if (!parsed.ok) return error(400, parsed.message);

  const { text, criteria, mode } = parsed.value;
  try {
    const { choice, probabilities, latencyMs } = await classify(text, criteria, {
      instructions: INSTRUCTIONS[mode],
    });
    return Response.json({ choice, probabilities, latencyMs }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const mapped = err instanceof JevError ? ERROR_RESPONSES[err.kind] : ERROR_RESPONSES.upstream;
    return error(mapped.status, mapped.message);
  }
}
