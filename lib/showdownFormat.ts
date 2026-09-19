import type { JevAnswer } from "./jev";

// Renders answers the way the original race demo does: one JSON-ish line per question.

/** 0.85 -> "0.85", 1 -> "1.0", 0.9 -> "0.9" */
export function num(x: number): string {
  const s = String(Math.round(x * 100) / 100);
  return s.includes(".") ? s : `${s}.0`;
}

const obj = (entries: [string, string][]) => `{${entries.map(([k, v]) => `"${k}": ${v}`).join(", ")}}`;
const probs = (p: Record<string, number>) => obj(Object.entries(p).map(([k, v]) => [k, num(v)]));

export function answerJson(answer: JevAnswer): string {
  switch (answer.type) {
    case "noul":
      return obj([
        ["noul", num(answer.noul)],
        ["type", `"noul"`],
      ]);
    case "choice":
      return obj([
        ["choice", JSON.stringify(answer.choice)],
        ["confidence", num(answer.confidence)],
        ["probabilities", probs(answer.probabilities)],
      ]);
    case "score":
      return obj([
        ["score", num(answer.score)],
        ["confidence", num(answer.confidence)],
        ["legend", obj(Object.entries(answer.legend).map(([k, v]) => [k, JSON.stringify(v)]))],
      ]);
  }
}

export function answerLine(label: string, answer: JevAnswer, last: boolean): string {
  return `"${label}": ${answerJson(answer)}${last ? "" : ","}`;
}

/** Two significant digits, never scientific notation: 0.0000126 -> "$0.000013". */
export function formatCost(usd: number | null): string {
  if (usd === null) return "unknown";
  if (usd <= 0) return "$0.00";
  const decimals = Math.min(12, Math.max(2, 1 - Math.floor(Math.log10(usd))));
  return `$${usd.toFixed(decimals)}`;
}

/** The complete answer as one JSON-ish block, one question per line, in question order. */
export function answerBlock(questions: { id: string; label: string }[], answers: Record<string, JevAnswer>): string {
  const lines = questions.map((q, i) => `  ${answerLine(q.label, answers[q.id], i === questions.length - 1)}`);
  return ["{", ...lines, "}"].join("\n");
}
