import { ERRORS } from "./copy";

// Shared by the API route and the client form, so the rules live in one place.

export const LIMITS = {
  textMax: 2000,
  optionsMin: 2,
  optionsMax: 8,
  labelMaxExclusive: 40, // "under 40 chars"
  descriptionMaxExclusive: 200,
} as const;

export type ClassifyMode = "classify" | "review";

/** Option label -> optional description. Same shape Jev calls `criteria`. */
export type Criteria = Record<string, string | null>;

export type ClassifyRequest = {
  text: string;
  criteria: Criteria;
  mode: ClassifyMode;
};

export type ValidationResult =
  | { ok: true; value: ClassifyRequest }
  | { ok: false; field: "body" | "text" | "options" | "mode"; message: string };

function fail(field: "body" | "text" | "options" | "mode", message: string): ValidationResult {
  return { ok: false, field, message };
}

/** Accepts `string[]` or `Record<string, string>` and returns trimmed criteria, or an error message. */
export function normalizeOptions(
  options: unknown,
): { ok: true; criteria: Criteria } | { ok: false; message: string } {
  let entries: [string, string | null][];
  if (Array.isArray(options)) {
    if (!options.every((o) => typeof o === "string")) return { ok: false, message: ERRORS.optionEmpty };
    entries = options.map((o) => [o, null]);
  } else if (options && typeof options === "object") {
    const raw = Object.entries(options as Record<string, unknown>);
    if (!raw.every(([, d]) => d === null || typeof d === "string")) {
      return { ok: false, message: ERRORS.optionEmpty };
    }
    entries = raw as [string, string | null][];
  } else {
    return { ok: false, message: ERRORS.optionsCount };
  }

  if (entries.length < LIMITS.optionsMin || entries.length > LIMITS.optionsMax) {
    return { ok: false, message: ERRORS.optionsCount };
  }

  const criteria: Criteria = {};
  const seen = new Set<string>();
  for (const [rawLabel, rawDesc] of entries) {
    const label = rawLabel.trim();
    if (!label) return { ok: false, message: ERRORS.optionEmpty };
    if (label.length >= LIMITS.labelMaxExclusive) return { ok: false, message: ERRORS.optionTooLong };
    const key = label.toLowerCase();
    if (seen.has(key)) return { ok: false, message: ERRORS.optionDuplicate };
    seen.add(key);
    const desc = rawDesc?.trim() || null;
    if (desc && desc.length >= LIMITS.descriptionMaxExclusive) {
      return { ok: false, message: ERRORS.descriptionTooLong };
    }
    criteria[label] = desc;
  }
  return { ok: true, criteria };
}

export function validateText(text: unknown): string | null {
  if (typeof text !== "string" || text.trim().length === 0) return ERRORS.textMissing;
  if (text.length > LIMITS.textMax) return ERRORS.textTooLong;
  return null;
}

export function validateClassifyRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("body", ERRORS.badJson);
  const { text, options, mode = "classify" } = body as Record<string, unknown>;

  const textError = validateText(text);
  if (textError) return fail("text", textError);

  if (mode !== "classify" && mode !== "review") return fail("mode", ERRORS.modeInvalid);

  const opts = normalizeOptions(options);
  if (!opts.ok) return fail("options", opts.message);

  return { ok: true, value: { text: (text as string).trim(), criteria: opts.criteria, mode } };
}
