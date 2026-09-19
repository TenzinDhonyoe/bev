import { describe, expect, it } from "vitest";
import { validateClassifyRequest, normalizeOptions, LIMITS } from "@/lib/validate";

const ok = { text: "My card was charged twice", options: ["billing", "shipping"], mode: "classify" };

describe("validateClassifyRequest", () => {
  it("accepts a valid array request and defaults mode", () => {
    const r = validateClassifyRequest({ text: "hi", options: ["a", "b"] });
    expect(r).toEqual({ ok: true, value: { text: "hi", criteria: { a: null, b: null }, mode: "classify" } });
  });

  it("accepts options as a label -> description object", () => {
    const r = validateClassifyRequest({ ...ok, options: { billing: "Money things", shipping: "" } });
    expect(r.ok && r.value.criteria).toEqual({ billing: "Money things", shipping: null });
  });

  it("accepts review mode", () => {
    const r = validateClassifyRequest({ ...ok, mode: "review" });
    expect(r.ok && r.value.mode).toBe("review");
  });

  it.each([null, "string", 42, [], undefined])("rejects non-object body %s", (body) => {
    expect(validateClassifyRequest(body)).toMatchObject({ ok: false, field: "body" });
  });

  it("rejects empty and whitespace-only text", () => {
    expect(validateClassifyRequest({ ...ok, text: "" })).toMatchObject({ ok: false, field: "text" });
    expect(validateClassifyRequest({ ...ok, text: "   \n " })).toMatchObject({ ok: false, field: "text" });
    expect(validateClassifyRequest({ ...ok, text: 5 })).toMatchObject({ ok: false, field: "text" });
  });

  it("enforces the 2000 character text limit", () => {
    expect(validateClassifyRequest({ ...ok, text: "x".repeat(LIMITS.textMax) }).ok).toBe(true);
    expect(validateClassifyRequest({ ...ok, text: "x".repeat(LIMITS.textMax + 1) })).toMatchObject({ ok: false, field: "text" });
  });

  it("rejects unknown modes", () => {
    expect(validateClassifyRequest({ ...ok, mode: "fast" })).toMatchObject({ ok: false, field: "mode" });
  });

  it("trims text", () => {
    const r = validateClassifyRequest({ ...ok, text: "  hello  " });
    expect(r.ok && r.value.text).toBe("hello");
  });
});

describe("normalizeOptions", () => {
  it("requires 2 to 8 options", () => {
    expect(normalizeOptions(["a"]).ok).toBe(false);
    expect(normalizeOptions(["a", "b"]).ok).toBe(true);
    expect(normalizeOptions(Array.from({ length: 8 }, (_, i) => `o${i}`)).ok).toBe(true);
    expect(normalizeOptions(Array.from({ length: 9 }, (_, i) => `o${i}`)).ok).toBe(false);
    expect(normalizeOptions({ a: null }).ok).toBe(false);
  });

  it("requires labels under 40 characters", () => {
    expect(normalizeOptions(["x".repeat(39), "b"]).ok).toBe(true);
    expect(normalizeOptions(["x".repeat(40), "b"]).ok).toBe(false);
  });

  it("rejects blank labels", () => {
    expect(normalizeOptions(["a", "  "]).ok).toBe(false);
  });

  it("rejects case-insensitive duplicates after trimming", () => {
    expect(normalizeOptions(["Billing", " billing "]).ok).toBe(false);
  });

  it("rejects non-string entries and non-collections", () => {
    expect(normalizeOptions(["a", 3]).ok).toBe(false);
    expect(normalizeOptions({ a: 1, b: null }).ok).toBe(false);
    expect(normalizeOptions("a,b").ok).toBe(false);
    expect(normalizeOptions(undefined).ok).toBe(false);
  });

  it("rejects overly long descriptions", () => {
    expect(normalizeOptions({ a: "d".repeat(200), b: null }).ok).toBe(false);
  });

  it("returns Bev-voiced messages with no em dashes", () => {
    const r = normalizeOptions(["a"]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toMatch(/Bev/);
      expect(r.message).not.toContain("—");
    }
  });
});
