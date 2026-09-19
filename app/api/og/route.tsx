import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseOgParams } from "@/lib/ogParams";

// Share image: "Bev thought for 2m 14s." big, the real time smaller, then the verdict.
// Params are allowlist-validated, and Satori renders them as text (never as markup).

// IBM Plex Sans (SIL Open Font License), same family as the site. Read once per instance.
const [plexRegular, plexBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/fonts/IBMPlexSans-400.ttf")),
  readFile(join(process.cwd(), "assets/fonts/IBMPlexSans-700.ttf")),
]);

const C = {
  paper: "#f4ecd8",
  card: "#fbf7ec",
  ink: "#2b251d",
  soft: "#5c5244",
  sticky: "#fde68a",
  stamp: "#9f2a1f",
};

export async function GET(request: Request) {
  const params = parseOgParams(new URL(request.url).searchParams);
  if (!params) {
    return new Response("Bev cannot photocopy that. Please check the form.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const { verdict, bevTime, actualTime, who } = params;
  const name = who === "gary" ? "Gary" : "Bev";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: C.paper, padding: 48, color: C.ink, fontFamily: "Plex" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: C.card,
            border: `4px solid ${C.ink}`,
            boxShadow: `10px 10px 0 0 ${C.ink}`,
            padding: "44px 56px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: C.soft }}>
            <span>Bev · System Three</span>
            <span>Thinking, Slow and Slower.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
              {`${name} thought for ${bevTime}.`}
            </div>
            <div style={{ display: "flex", marginTop: 20 }}>
              <div style={{ background: C.sticky, padding: "10px 20px", fontSize: 40, transform: "rotate(-1deg)" }}>
                {`Actual thinking time: ${actualTime}.`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                border: `6px solid ${C.stamp}`,
                color: C.stamp,
                padding: "6px 22px",
                fontSize: 48,
                fontWeight: 700,
                textTransform: "uppercase",
                transform: "rotate(-3deg)",
                maxWidth: 640,
              }}
            >
              {verdict}
            </div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{`${name} is 97% confident.`}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Plex", data: plexRegular, style: "normal", weight: 400 },
        { name: "Plex", data: plexBold, style: "normal", weight: 700 },
      ],
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
