import { describe, expect, it } from "vitest";
import { parseOgParams } from "@/lib/ogParams";

const q = (o: Record<string, string>) => new URLSearchParams(o);
const good = { verdict: "billing", bevTime: "2m 14s", actualTime: "0.38s" };

describe("parseOgParams", () => {
  it("accepts valid params and defaults to Bev", () => {
    expect(parseOgParams(q(good))).toEqual({ ...good, who: "bev" });
    expect(parseOgParams(q({ ...good, bevTime: "9s", who: "gary", verdict: "will get you fired" }))?.who).toBe("gary");
    expect(parseOgParams(q({ ...good, verdict: "passive-aggressive" }))).not.toBeNull();
  });

  it.each<Record<string, string>>([
    { verdict: "" },
    { verdict: "x".repeat(40) },
    { verdict: "<script>alert(1)</script>" },
    { verdict: "line\nbreak" },
    { bevTime: "forever" },
    { bevTime: "2m 14s; drop" },
    { actualTime: "0.3s" },
    { actualTime: "-1.00s" },
    { who: "doreen" },
  ])("rejects %o", (bad) => {
    expect(parseOgParams(q({ ...good, ...bad }))).toBeNull();
  });
});
