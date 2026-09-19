import type { Persona } from "./bevLines";
import { LIMITS } from "./validate";

export type OgParams = { verdict: string; bevTime: string; actualTime: string; who: Persona };

const BEV_TIME = /^(\d{1,3}m )?\d{1,2}s$/; // "2m 14s", "9s"
const ACTUAL_TIME = /^\d{1,2}\.\d{2}s$/; // "0.38s"
// Letters, numbers, spaces and a little punctuation. No control characters, no markup.
const VERDICT = /^[\p{L}\p{N} .,'&/()?!:+-]+$/u;

/** Strict allowlist validation for the share image. Returns null if anything is off. */
export function parseOgParams(search: URLSearchParams): OgParams | null {
  const verdict = (search.get("verdict") ?? "").trim();
  const bevTime = (search.get("bevTime") ?? "").trim();
  const actualTime = (search.get("actualTime") ?? "").trim();
  const who = search.get("who") ?? "bev";

  if (!verdict || verdict.length >= LIMITS.labelMaxExclusive || !VERDICT.test(verdict)) return null;
  if (!BEV_TIME.test(bevTime) || !ACTUAL_TIME.test(actualTime)) return null;
  if (who !== "bev" && who !== "gary") return null;
  return { verdict, bevTime, actualTime, who };
}
