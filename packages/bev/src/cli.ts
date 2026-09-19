import { parseArgs } from "node:util";
import { PRESETS, type PresetId } from "../../../lib/presets";
import { EFFORT_LABELS, type Effort } from "../../../lib/bevScript";
import { formatClock, formatDuration, formatLatency, formatPercent } from "../../../lib/format";
import { PERSONA_NAME, todaysPersona } from "../../../lib/friday";
import { normalizeOptions } from "../../../lib/validate";
import { BevError, provider, startClassify, startReview, thinkingTime, type BevResult, type BevRun } from "./index";

declare const __BEV_VERSION__: string;

const HELP = `bev: the slowest classifier in the world, at Jev prices.

Usage
  npx bev-ai "<text>" [options]          classify text
  npx bev-ai review "<message>"          let Bev review a message (10 minutes)
  echo "<text>" | npx bev-ai [options]    read text from stdin

Options
  -o, --options <a,b,c>   2 to 8 comma-separated options (default: billing,shipping,technical,other)
  -p, --preset <name>     support (default) or vibe
  -e, --effort <level>    low (~10s), medium (~30s, default), high (~90s), bev (3 to 5 min)
      --json              print the result as JSON on stdout (thinking goes to stderr)
  -q, --quiet             do not print Bev's thinking
      --gary              let Gary handle it (he covers Fridays and is a lot faster)
  -h, --help              show this help
  -v, --version           show the version

While Bev thinks, press r to rush her (+10s). Ctrl+C to leave.

Bev uses Jev for the real answer. Set one of these for real answers,
otherwise Bev runs in mock mode:
  AI_GATEWAY_API_KEY    Vercel AI Gateway
  TYPESAFE_API_KEY      TypeSafe direct
  OPENROUTER_API_KEY    OpenRouter

Not affiliated with TypeSafe AI. Bev just works here.`;

// ---------------------------------------------------------------------------
// Terminal styling. Respects NO_COLOR and non-TTY output.

const out = process.stdout;
const err = process.stderr;
const color = err.isTTY && !process.env.NO_COLOR;
const paint = (code: string) => (s: string) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
const c = {
  dim: paint("2"),
  bold: paint("1"),
  amber: paint("33"),
  red: paint("31"),
  stamp: paint("1;31"),
  green: paint("32"),
};

function usage(message: string): never {
  err.write(`${c.red(message)}\n\nRun "npx bev-ai --help" for usage.\n`);
  process.exit(2);
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8").trim();
}

function progressBar(p: number, width = 28): string {
  const filled = Math.round(Math.max(0, Math.min(1, p)) * width);
  return `[${"#".repeat(filled)}${"-".repeat(width - filled)}] ${String(Math.round(p * 100)).padStart(3)}%`;
}

function printVerdict(r: BevResult, name: string) {
  const lines = [
    `${c.dim("Verdict")}  ${c.stamp(r.choice.toUpperCase())}`,
    `${name} is 97% confident. ${c.dim(`(Jev's actual confidence: ${formatPercent(r.jevConfidence)})`)}`,
    c.amber(`${name} thought for ${formatDuration(r.bevMs)}. Actual thinking time: ${formatLatency(r.actualMs)}.`),
    ...(r.filedInTriplicate ? [c.dim(`${name} has filed this in triplicate.`)] : []),
  ];
  out.write(`\n${lines.map((l) => `  ${l}`).join("\n")}\n\n`);
}

async function main() {
  let args;
  try {
    args = parseArgs({
      allowPositionals: true,
      options: {
        options: { type: "string", short: "o" },
        preset: { type: "string", short: "p" },
        effort: { type: "string", short: "e" },
        json: { type: "boolean" },
        quiet: { type: "boolean", short: "q" },
        gary: { type: "boolean" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    });
  } catch (e) {
    usage((e as Error).message);
  }
  const { values, positionals } = args;
  if (values.help) return void out.write(`${HELP}\n`);
  if (values.version) return void out.write(`${__BEV_VERSION__}\n`);

  const isReview = positionals[0] === "review";
  const text = (isReview ? positionals.slice(1) : positionals).join(" ").trim() || (await readStdin());
  if (!text) usage("Bev needs something to classify. The inbox is empty.");

  const effort = (values.effort ?? "medium") as Effort;
  if (!(effort in EFFORT_LABELS)) usage(`Unknown effort "${values.effort}". Use low, medium, high, or bev.`);
  const presetId = (values.preset ?? "support") as PresetId;
  if (!(presetId in PRESETS) || presetId === "custom") usage(`Unknown preset "${values.preset}". Use support or vibe.`);
  const options = values.options ? values.options.split(",").map((o) => o.trim()) : PRESETS[presetId].options;
  const checked = normalizeOptions(options);
  if (!checked.ok) usage(checked.message);

  const persona = values.gary ? "gary" : todaysPersona();
  const name = PERSONA_NAME[persona];
  const live = err.isTTY && !values.quiet;
  const showThoughts = !values.quiet;

  if (provider() === "mock") {
    err.write(c.dim(`${name} is in mock mode: no Jev key found. Set AI_GATEWAY_API_KEY, TYPESAFE_API_KEY or OPENROUTER_API_KEY for real answers.\n`));
  }

  // Header.
  if (showThoughts) {
    const [min, max] = thinkingTime(effort, persona);
    const eta = isReview ? "10 minutes" : effort === "bev" ? `${formatDuration(min)} to ${formatDuration(max)}` : `about ${formatDuration((min + max) / 2)}`;
    const shown = text.length > 70 ? `${text.slice(0, 67)}...` : text;
    err.write(`\n  ${c.bold(name)} ${c.dim("· System Three")}\n`);
    err.write(`  ${c.dim(isReview ? "Draft:  " : "Ticket: ")} "${shown.replace(/\s+/g, " ")}"\n`);
    if (!isReview) err.write(`  ${c.dim("Options:")} ${options.join(c.dim(" · "))}\n`);
    err.write(`  ${c.dim("Effort: ")} ${isReview ? "review" : EFFORT_LABELS[effort]} ${c.dim(`(${eta})`)}\n\n`);
    err.write(`  ${c.amber("Thinking...")} ${live ? c.dim("(press r to rush, Ctrl+C to leave)") : ""}\n`);
  }

  // Live progress bar on the last line; thoughts print above it.
  let bar = "";
  const drawBar = () => live && err.write(`\r\x1b[2K  ${c.dim(bar)}`);
  const clearBar = () => live && err.write("\r\x1b[2K");

  const controller = new AbortController();
  const hooks = {
    signal: controller.signal,
    persona,
    onThought: showThoughts
      ? (t: { atMs: number; text: string; kind: string }) => {
          clearBar();
          const text = t.kind === "rushed" ? c.red(t.text) : t.kind === "final" ? c.bold(t.text) : t.text;
          err.write(`  ${c.dim(`[${formatClock(t.atMs)}]`)} ${text}\n`);
          drawBar();
        }
      : undefined,
    onProgress: live
      ? (p: number, elapsedMs: number) => {
          bar = `${progressBar(p)}  ${formatClock(elapsedMs)}`;
          drawBar();
        }
      : undefined,
  };
  const run: BevRun = isReview ? startReview(text, hooks) : startClassify(text, options, { ...hooks, effort });

  // Keyboard: r (or space) rushes Bev, Ctrl+C leaves politely.
  const stdin = process.stdin;
  const interactive = stdin.isTTY && live;
  const onKey = (key: Buffer) => {
    const k = key.toString();
    if (k === "\u0003") controller.abort();
    else if (k === "r" || k === "R" || k === " ") run.rush();
  };
  if (interactive) {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onKey);
  }
  const restore = () => {
    if (!interactive) return;
    stdin.off("data", onKey);
    stdin.setRawMode(false);
    stdin.pause();
  };
  process.on("SIGINT", () => controller.abort());

  try {
    const result = await run.result;
    restore();
    clearBar();
    if (values.json) out.write(`${JSON.stringify(result, null, 2)}\n`);
    else printVerdict(result, name);
  } catch (e) {
    restore();
    clearBar();
    if ((e as Error).name === "AbortError") {
      err.write(`\n  ${c.dim(`${name} will pick this up tomorrow.`)}\n`);
      process.exit(130);
    }
    err.write(`\n  ${c.red(e instanceof BevError ? e.message : "Bev's computer is updating. Please try again.")}\n`);
    process.exit(1);
  }
}

main();
