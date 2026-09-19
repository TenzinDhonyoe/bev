"use client";

import { useState } from "react";
import type { Persona } from "@/lib/bevLines";

type Props = { persona: Persona; verdict: string; bevTime: string; actualTime: string };

export function ogImagePath({ persona, verdict, bevTime, actualTime }: Props): string {
  const params = new URLSearchParams({ verdict, bevTime, actualTime });
  if (persona === "gary") params.set("who", "gary");
  return `/api/og?${params}`;
}

/** Generates the share image, then uses the native share sheet when it can take files, else downloads it. */
export function ShareButton(props: Props) {
  const [status, setStatus] = useState<"idle" | "working" | "saved" | "error">("idle");
  const name = props.persona === "gary" ? "Gary" : "Bev";
  const caption = `${name} thought for ${props.bevTime}. Actual thinking time: ${props.actualTime}.`;

  async function share() {
    setStatus("working");
    try {
      const res = await fetch(ogImagePath(props));
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const file = new File([blob], "bev-verdict.png", { type: "image/png" });
      const siteUrl = window.location.origin;

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: `${caption} ${siteUrl}` });
          setStatus("idle");
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return setStatus("idle");
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={share}
        disabled={status === "working"}
        className="rounded border border-ink bg-ink px-4 py-2 font-medium text-card hover:bg-ink-soft disabled:opacity-60"
      >
        {status === "working" ? "Photocopying..." : "Share"}
      </button>
      <p role="status" className="text-xs text-ink-soft">
        {status === "saved" && "Image saved. Bev is very proud of it."}
        {status === "error" && "The photocopier is jammed. Please try again."}
      </p>
    </div>
  );
}
