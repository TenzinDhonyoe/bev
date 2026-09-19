import type { Persona } from "./bevLines";

/**
 * Bev is out of office on Fridays (viewer's local day). `?friday=1` or
 * `?friday=0` in the URL overrides it, which is handy for demos.
 */
export function isFriday(now: Date = new Date(), search: string = typeof window !== "undefined" ? window.location.search : ""): boolean {
  const override = new URLSearchParams(search).get("friday");
  if (override === "1") return true;
  if (override === "0") return false;
  return now.getDay() === 5;
}

export function todaysPersona(): Persona {
  return isFriday() ? "gary" : "bev";
}

export const PERSONA_NAME: Record<Persona, string> = { bev: "Bev", gary: "Gary" };
