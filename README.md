# Bev

**Thinking, Slow and Slower.** An affectionate parody of [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev),
TypeSafe AI's System One classifier.

Bev uses Jev under the hood, so she is exactly as cheap and exactly as accurate as Jev. After getting the real answer
in under a second, she performs minutes of fake "reasoning" before revealing it. Every result ends with the honest
punchline: *"Bev thought for 2m 14s. Actual thinking time: 0.38s."*

Not affiliated with TypeSafe AI. Bev just works here.

## The npm package (`packages/bev`)

Bev ships as `bev-ai`: a CLI (`npx bev-ai "<text>"`) and a library (`import { classify } from "bev-ai"`).
It bundles the same `lib/` code the website uses, so the two never drift apart. Users bring their own Jev key;
without one it runs in mock mode. See `packages/bev/README.md`.

```bash
cd packages/bev
npm install
npm run build        # dist/index.js, dist/cli.js, dist/index.d.ts
node dist/cli.js "Where is my package?" -e low
npm publish          # needs `npm login` first
```

## Local setup

Requires Node 20.9+.

```bash
npm install
npm run dev          # http://localhost:3000
```

That's it. With no keys, Bev runs in **mock mode**: a keyword heuristic picks the answer, probabilities are randomized
around it (summing to 1), and latency is faked at 200 to 450ms. A small "mock mode" badge shows in dev only.

Other scripts:

```bash
npm test             # Vitest: validation, mock, Jev adapter, thinking script, share image params
npm run typecheck
npm run lint
npm run build && npm start
```

## Adding a Jev key

Copy `.env.example` to `.env.local` and set **one** key:

| Variable | Backend | Endpoint / model |
|---|---|---|
| `TYPESAFE_API_KEY` | TypeSafe direct (first party, recommended) | `POST https://api.typesafe.ai/v1/systemone`, model `jev-latest` |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway | `experimental_evaluate` from `ai`, model `typesafe-ai/jev` |
| `OPENROUTER_API_KEY` | OpenRouter (alpha) | `POST https://openrouter.ai/api/alpha/decisions`, model `typesafe/jev-1.13` |

If more than one is set, the first in that order wins. `JEV_PROVIDER=typesafe|gateway|openrouter|mock` forces one.
Restart `npm run dev` after changing env vars. The mock badge disappears once a key is picked up.

All three paths go through `lib/jev.ts`, which exposes a single function:

```ts
classify(text, criteria, { instructions }) -> { choice, probabilities, latencyMs }
```

Missing probabilities (possible on the AI SDK path) become winner 1.0, others 0. `latencyMs` is the server-measured
wall clock of the upstream call, and that is the "actual thinking time" users see.

## Deploy to Vercel

1. Push this directory to a Git repo and import it at [vercel.com/new](https://vercel.com/new)
   (framework preset: Next.js; no build settings to change). Or run `npx vercel` from this directory.
2. Optional: in **Project Settings > Environment Variables**, add one of the keys above. Without one, the deployed
   site runs in mock mode (the badge only shows in dev).
3. Deploy. Works on the free tier: no database, no storage, no cron.

### Rate limiting

`/api/classify` has a per-IP limit of 20 requests per minute, held in memory (`lib/rateLimit.ts`). On Vercel each
instance has its own memory, so it is best effort. The file has a clearly marked **UPSTASH HOOK** showing how to swap
in `@upstash/ratelimit` for a global limit.

## Privacy

Nothing is stored. User text goes to Jev and back and is never logged: error logs contain only the provider, status,
and latency. There is no database, and the client does not persist text in browser storage.

## Jev vs Bev (`/demo`)

A side-by-side race, modeled on the original Jev launch demo. Both panels get the same ticket
(#4471, a customer complaining that their classifier takes 3 to 5 minutes and keeps "consulting Doreen")
and the same 27 questions: 15 yes/no (`noul`), 7 choice, 5 scores. Jev's panel prints all 27 answers at
once with its real cost and latency. Bev prints the identical answers one at a time over 3 to 5 minutes,
then shows the same cost. The receipts underneath compare time and money.

`/api/showdown` makes one real 27-question Jev request and caches it for a day (instance memory plus
`s-maxage` on the CDN), so every visitor sees real Jev output without each visit spending a request.
In mock mode it returns a hand-written fixture instead. Ticket, questions, and fixture live in `lib/showdown.ts`;
Bev's timeline is `lib/showdownScript.ts`.

## How it works

| Path | What it does |
|---|---|
| `app/api/classify/route.ts` | Rate limit, validate, call Jev, map errors to Bev-voiced messages |
| `app/api/showdown/route.ts` | One cached 27-question Jev request for the Jev vs Bev race |
| `app/api/og/route.tsx` | Share image (`next/og`), strict allowlist on `verdict`, `bevTime`, `actualTime`, `who` |
| `lib/jev.ts`, `lib/jevMock.ts` | Jev adapter (TypeSafe, Gateway, OpenRouter, mock): `classify` for one choice, `evaluate` for mixed yes/no, choice and score questions |
| `lib/validate.ts` | Shared input rules: text 1 to 2000 chars, 2 to 8 options, labels under 40 chars |
| `lib/bevScript.ts`, `lib/bevLines.ts` | Seeded thinking-script engine and 100+ template lines. No LLM. |
| `components/BevApp.tsx` | Client state machine: input, thinking theatre, reveal |

Thinking durations: Low about 10s, Medium about 30s, High about 90s, Bev 3 to 5 minutes. "Let Bev review it" is a
real 10-minute countdown. Rushing Bev adds 10 seconds.

### Easter eggs

- **Fridays** (viewer's local day): Bev is out of office and Gary covers. Gary takes about a third as long and is ruder.
  Add `?friday=1` (or `?friday=0`) to any URL to force it.
- About 1 in 20 runs, Bev files it in triplicate.

## Credits

- Fonts: IBM Plex (SIL Open Font License). `assets/fonts/` holds the TTFs used by the share image.
- "Why is Bev slow?": Buell and Norton, [The Labor Illusion](https://doi.org/10.1287/mnsc.1110.1376), *Management Science*, 2011.
