# bev-ai

**Thinking, Slow and Slower.** The slowest classifier in the world, at Jev prices.

Bev gives you the exact same answer as [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), TypeSafe
AI's fast classifier, because she *is* Jev. She just takes her time: minutes of visible "reasoning" before handing over
an answer she had in under a second. Then she tells you the truth.

**[Watch the Jev vs Bev race](https://bev-six-peach.vercel.app/demo)** · [GitHub](https://github.com/TenzinDhonyoe/bev)

Not affiliated with TypeSafe AI. Bev just works here.

## Quick start

Needs [Node.js 22 or later](https://nodejs.org).

```bash
npx bev-ai "I was charged twice for my subscription"
```

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

No key? Bev runs in **mock mode** and says so. For real answers, set one of these first:

```bash
export AI_GATEWAY_API_KEY=...    # Vercel AI Gateway
export TYPESAFE_API_KEY=...      # TypeSafe directly
export OPENROUTER_API_KEY=...    # OpenRouter
```

## Let your AI agent set it up

Paste this into Claude Code, Cursor, Codex, or any coding agent:

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

## Command line

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

## In your code

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
`{ result, rush }` so you can rush Bev from your own UI. Options can be a list of labels or `{ label: description }`.
Pass `signal` to stop waiting. Errors are `BevError`s, written in Bev's voice.

Your text only goes to the Jev backend you configured. Bev stores nothing.

## Why is Bev slow?

People value work more when they can see the effort behind it (Buell and Norton,
[The Labor Illusion](https://doi.org/10.1287/mnsc.1110.1376), 2011). Years of reasoning models taught us that waiting
means intelligence. Bev sells the wait, then shows you the receipt.

## License

MIT
