"use client";

import { useSyncExternalStore } from "react";
import type { Persona } from "@/lib/bevLines";
import { todaysPersona } from "@/lib/friday";

const subscribe = () => () => {};

/** Bev on the server; on the client, Gary if it is Friday where the viewer is. */
export function useTodaysPersona(): Persona {
  return useSyncExternalStore(subscribe, todaysPersona, () => "bev");
}
