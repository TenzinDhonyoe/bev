# bev-ai

**Thinking, Slow and Slower.** The slowest classifier in the world, at Jev prices.

Bev uses [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) under the hood, so she is exactly as cheap
and exactly as accurate as Jev. But after getting the real answer in under a second, she performs minutes of visible
"reasoning" before handing it over. Every result tells you how long the real thinking took.

```
$ npx bev-ai "I was charged twice for my subscription" --effort low

  Bev · System Three
  Ticket:  "I was charged twice for my subscription"
  Options: billing · shipping · technical · other
  Effort:  Low (about 10s)

  Thinking... (press r to rush, Ctrl+C to leave)
  [0:01] Bev has taken a number for your ticket. It is number 4,512.
  [0:04] Bev put it in the wrong pile. Bev is starting that part over.
  [0:07] What about technical? Bev is considering it. Bev is done considering it.
  [0:09] Decision made: billing. Bev is stamping it.

  Verdict  BILLING
  Bev is 97% confident. (Jev's actual confidence: 88%)
  Bev thought for 9s. Actual thinking time: 0.38s.
```

Not affiliated with TypeSafe AI. Bev just works here.

## CLI

Requires Node 22 or later.

```bash
npx bev-ai "<text>"                                   # support queues: billing, shipping, technical, other
npx bev-ai "<text>" -o "yes,no,maybe"                 # your own 2 to 8 options
npx bev-ai "Great news, I got promoted" -p vibe       # good news, bad news, neutral
npx bev-ai "<text>" -e bev                            # low ~10s, medium ~30s (default), high ~90s, bev 3 to 5 min
npx bev-ai review "Per my last email..."              # fine / passive-aggressive / furious / will get you fired (10 minutes)
echo "<text>" | npx bev-ai --json > verdict.json      # JSON on stdout, Bev's thinking on stderr
```

While Bev thinks, press **r** to rush her. Each rush adds 10 seconds. Bev does not appreciate being rushed.

On Fridays Bev is out of office and Gary covers. Gary takes about a third of the time and has seen worse. `--gary`
gets him any day.

## Library

```ts
import { classify, startClassify, review } from "bev-ai";

const result = await classify("My package never arrived", ["billing", "shipping", "technical", "other"], {
  effort: "low",
  onThought: (t) => console.log(t.text),
});

result.choice;          // "shipping", straight from Jev
result.probabilities;   // Jev's real probabilities
result.bevConfidence;   // 0.97, always
result.jevConfidence;   // Jev's actual confidence
result.bevMs;           // how long Bev took
result.actualMs;        // how long Jev took
```

`startClassify` and `startReview` return `{ result, rush }` so you can rush Bev from your own UI. Options can be an
array of labels or an object of `{ label: description }`. Pass `signal` to stop waiting. Errors are `BevError`s with
messages in Bev's voice.

## Jev keys

Bev needs a Jev key for real answers. Set one; the first one found wins:

| Variable | Backend |
|---|---|
| `TYPESAFE_API_KEY` | TypeSafe direct |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway (`typesafe-ai/jev`) |
| `OPENROUTER_API_KEY` | OpenRouter (`typesafe/jev-1.13`) |

With no key, Bev runs in **mock mode**: a keyword heuristic stands in for Jev, and the CLI says so. Your text is only
sent to the backend you configured, and Bev stores nothing.

## Why is Bev slow?

People value work more when they can see the effort behind it (Buell and Norton,
[The Labor Illusion](https://doi.org/10.1287/mnsc.1110.1376), 2011). Years of reasoning models taught all of us that
waiting means intelligence. Bev sells the wait people have learned to trust, and then tells you the truth.

## License

MIT
