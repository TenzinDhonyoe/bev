# Bev

**Thinking, Slow and Slower.** The slowest classifier in the world, at Jev prices.

Bev gives you the exact same answer as [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), TypeSafe
AI's fast classifier, because she *is* Jev. She just takes her time: minutes of visible "reasoning" before handing over
an answer she had in under a second. Then she tells you the truth: *"Bev thought for 2m 14s. Actual thinking time: 0.38s."*

**[Watch the Jev vs Bev race](https://bev-six-peach.vercel.app/demo)** · [Website](https://bev-six-peach.vercel.app) ·
[npm](https://www.npmjs.com/package/bev-ai)

Not affiliated with TypeSafe AI. Bev just works here.

---

## Quick start

You need [Node.js 22 or later](https://nodejs.org). Then, in any terminal:

```bash
npx bev-ai "I was charged twice for my subscription"
```

That's it. No install, no signup. Bev reads your text, thinks out loud, and gives a verdict:

```
  Thinking... (press r to rush, Ctrl+C to leave)
  [0:01] Bev has taken a number for your ticket. It is number 4,512.
  [0:04] Bev put it in the wrong pile. Bev is starting that part over.
  [0:07] What about technical? Bev is considering it. Bev is done considering it.
  [0:09] Decision made: billing. Bev is stamping it.

  Verdict  BILLING
  Bev is 97% confident. (Jev's actual confidence: 88%)
  Bev thought for 9s. Actual thinking time: 0.38s.
```

Without a Jev key, Bev runs in **mock mode** (a simple stand-in, and she tells you). For real answers, see
[Real Jev answers](#real-jev-answers) below.

## Let your AI agent set it up

Paste one of these into Claude Code, Cursor, Codex, or any coding agent.

**Try it:**

```text
Run `npx bev-ai "My package says delivered but it is not here" --effort low` in my terminal
and show me what Bev says. It needs Node 22 or later.
```

**Add it to my app:**

```text
Add Bev to this project. Bev is the npm package bev-ai: it classifies text with Jev
(TypeSafe AI's classifier), then deliberately "thinks" for a while before answering.

1. Install it with `npm install bev-ai`. It needs Node 22 or later.
2. Use it like this:
     import { classify } from "bev-ai";
     const result = await classify(text, ["billing", "shipping", "technical", "other"], {
       effort: "low",
       onThought: (t) => console.log(t.text),
     });
   result has: choice, probabilities, jevConfidence, bevMs, actualMs, thoughts.
3. Rules: 2 to 8 options, each under 40 characters. Text is 1 to 2000 characters.
4. effort is "low" (~10s), "medium" (~30s), "high" (~90s) or "bev" (3 to 5 minutes). Use "low" in tests.
5. For real answers, read a Jev key from an environment variable: AI_GATEWAY_API_KEY,
   TYPESAFE_API_KEY or OPENROUTER_API_KEY. Never hardcode it. Without one, Bev runs in mock mode.

Docs: https://github.com/TenzinDhonyoe/bev
```

## Real Jev answers

Set **one** of these in your shell before running Bev. The first one found wins.

```bash
export AI_GATEWAY_API_KEY=...    # Vercel AI Gateway, https://vercel.com/ai-gateway
export TYPESAFE_API_KEY=...      # TypeSafe directly, https://typesafe.ai
export OPENROUTER_API_KEY=...    # OpenRouter, https://openrouter.ai
```

Your text only goes to the service you picked. Bev stores nothing.

## Command line cheat sheet

| You want to | Run |
|---|---|
| Sort a support ticket | `npx bev-ai "Where is my package?"` |
| Pick your own options (2 to 8) | `npx bev-ai "Ship it?" -o "yes,no,after lunch"` |
| Good news, bad news, or neutral | `npx bev-ai "I got promoted" -p vibe` |
| Choose how long Bev thinks | `-e low` (~10s), `-e medium` (~30s, default), `-e high` (~90s), `-e bev` (3 to 5 min) |
| Check an email's tone before sending | `npx bev-ai review "Per my last email..."` (takes 10 minutes) |
| Get JSON for a script | `echo "Refund please" \| npx bev-ai --json` |
| Hurry her up | press **r** while she thinks (+10 seconds; Bev does not appreciate it) |
| See every option | `npx bev-ai --help` |

On Fridays Bev is out of office and Gary covers. Gary is three times faster and has seen worse. `--gary` gets him any day.

## Use it in code

```bash
npm install bev-ai
```

```ts
import { classify } from "bev-ai";

const result = await classify("My package never arrived", ["billing", "shipping", "technical", "other"], {
  effort: "low",
  onThought: (t) => console.log(t.text),
});

result.choice;         // "shipping", straight from Jev
result.probabilities;  // Jev's real probabilities
result.bevConfidence;  // 0.97, always
result.jevConfidence;  // what Jev actually thought
result.bevMs;          // how long Bev took
result.actualMs;       // how long Jev took
```

Also available: `review(message)` for tone checks, and `startClassify` / `startReview`, which return
`{ result, rush }` so you can rush Bev from your own UI. Errors are `BevError`s, written in Bev's voice.

## Questions

**Is Bev actually thinking?** No. Jev decides in well under a second. Everything after that is theatre, written from
a library of lines about coffee, printers, and Doreen. Every result shows the real thinking time.

**Is Bev as accurate as Jev?** Exactly, because the answer *is* Jev's.

**Why build this?** Years of reasoning models taught us that waiting means intelligence. People value work more when
they can see the effort behind it ([Buell and Norton, 2011](https://doi.org/10.1287/mnsc.1110.1376)). Bev sells the
wait, then shows you the receipt.

---

## Working on this repo

This repo holds two things that share one codebase:

| Folder | What it is |
|---|---|
| `packages/bev/` | The `bev-ai` npm package: CLI (`src/cli.ts`) and library (`src/index.ts`) |
| `app/`, `components/` | The website: landing page, Jev vs Bev race (`/demo`), docs, FAQ |
| `lib/` | Shared by both: Jev adapter, input rules, Bev's lines and timing |
| `tests/` | Vitest tests for all of the above |

<details>
<summary><b>Run the website locally</b></summary>

```bash
npm install
cp .env.example .env.local   # optional: add a Jev key
npm run dev                  # http://localhost:3000
```

Without a key the site runs in mock mode and shows a small "mock mode" badge (dev only).

```bash
npm test             # all tests
npm run typecheck
npm run lint
```

</details>

<details>
<summary><b>Build and publish the npm package</b></summary>

```bash
cd packages/bev
npm install
npm run build                          # dist/index.js, dist/cli.js, dist/index.d.ts
node dist/cli.js "Where is my package?" -e low
# bump "version" in package.json, then:
npm publish                            # needs `npm login`; asks for your authenticator code
```

</details>

<details>
<summary><b>Deploy the website</b></summary>

The live site is connected to this repo on Vercel: every push to `main` deploys to production, and other branches
get preview URLs. The Jev key lives in the Vercel project's environment variables.

To deploy your own copy: import the repo at [vercel.com/new](https://vercel.com/new) (Next.js preset, no settings to
change) and optionally add a Jev key under **Project Settings > Environment Variables**. It fits the free tier: no
database, no storage, no cron.

</details>

<details>
<summary><b>How the website works</b></summary>

| Path | What it does |
|---|---|
| `app/api/classify/route.ts` | Rate limit, validate, call Jev, map errors to Bev-voiced messages |
| `app/api/showdown/route.ts` | One cached 27-question Jev request for the Jev vs Bev race |
| `app/api/og/route.tsx` | Share image, with a strict allowlist on its parameters |
| `lib/jev.ts` | Jev adapter for TypeSafe, AI Gateway, OpenRouter, and mock mode |
| `lib/bevScript.ts`, `lib/bevLines.ts` | Bev's thinking: 100+ template lines on a seeded timer. No LLM. |
| `lib/showdownScript.ts` | Bev's side of the race: a streamed "Thinking..." block, then the answer, in about 15 seconds |

**The race (`/demo`)** gives both panels the same ticket and the same 27 questions (15 yes/no, 7 choice, 5 scores).
Jev prints every answer at once with its real cost and time. Bev thinks out loud like a reasoning model, then streams
the identical answers in about 15 seconds, at the same cost. `/api/showdown` makes one real Jev request and caches it
for a day, so visitors never spend your credits.

**Rate limiting:** `/api/classify` allows 20 requests per minute per IP, in memory. `lib/rateLimit.ts` has a marked
**UPSTASH HOOK** for a global limit.

**Privacy:** nothing is stored or logged. Error logs contain only the provider, status, and latency.

**Easter eggs:** Gary covers on Fridays (force it with `?friday=1`), and about 1 run in 20 is filed in triplicate.

</details>

## Credits

- Fonts: IBM Plex (SIL Open Font License).
- The labor illusion: Buell and Norton, [The Labor Illusion](https://doi.org/10.1287/mnsc.1110.1376), *Management Science*, 2011.
- License: MIT.
