import type { JevAnswer, JevQuestion } from "./jev";

// The Jev vs Bev showdown. One fixed ticket, 27 fixed questions, in the same
// order for both panels. The twist: the ticket is a complaint about Bev.

export const TICKET_ID = 4471;
export const TICKET_SUBJECT = "URGENT: classifier taking 4+ minutes per ticket";

export const TICKET_TEXT = `Subject: ${TICKET_SUBJECT}

Hi, since Monday your classification API has been taking 3 to 5 minutes per request. Our support queue is backed up to 2,400 tickets and two enterprise customers have escalated. To be clear, it gets every answer right. It just takes forever. The status logs show messages like "looking for reading glasses" and "consulting Doreen." Who is Doreen? We have a partner launch tomorrow at 9am. I need this fixed today or we are switching to Jev.

Dana, Head of Support Ops`;

export type ShowdownQuestion = JevQuestion & { id: string; label: string };

const noul = (id: string, label: string, instructions = label): ShowdownQuestion => ({ id, label, type: "noul", instructions });
const choice = (id: string, label: string, options: string[], instructions = label): ShowdownQuestion => ({
  id,
  label,
  type: "choice",
  instructions,
  criteria: Object.fromEntries(options.map((o) => [o, null])),
});
const score = (id: string, label: string, levels: string[], instructions = label): ShowdownQuestion => ({
  id,
  label,
  type: "score",
  instructions,
  levels,
});

/** 15 yes/no, 7 choice, 5 scores (0 to 4). Ids are stable; labels are what viewers see. */
export const QUESTIONS: ShowdownQuestion[] = [
  noul("revenue_impacted", "Revenue currently impacted?"),
  noul("performance_issue", "Performance issue reported?"),
  noul("accuracy_disputed", "Output accuracy disputed?"),
  noul("churn_threat", "Customer threatening to churn?"),
  noul("competitor_named", "Competitor named?"),
  noul("launch_endangered", "Partner launch endangered?"),
  noul("human_attention", "Human attention needed?"),
  noul("deadline_stated", "Concrete deadline stated?"),
  noul("multiple_customers", "Multiple customers affected?"),
  noul("confused_by_output", "Customer confused by system output?"),
  noul("unexplained_person", "Unexplained person mentioned?", "Does the ticket mention a person the customer cannot identify?"),
  noul("refund_requested", "Refund requested?"),
  noul("data_exposed", "Customer data exposed?"),
  noul("language_threatening", "Language personally threatening?"),
  noul("patience_exhausted", "Customer patience exhausted?"),
  choice("issue_category", "Which issue category?", ["latency", "accuracy", "outage", "billing", "security", "feature_request"]),
  choice("department", "Which primary department?", ["technical", "billing", "sales", "legal"]),
  choice("resolution", "Which requested resolution?", ["restore_speed", "refund", "explanation", "account_change"]),
  choice("response_deadline", "Which response deadline?", ["within_hour", "today", "this_week", "none"]),
  choice("incident_scope", "Which incident scope?", ["single_account", "multiple_accounts", "platform_wide"]),
  choice("account_health", "Account health status?", ["healthy", "watch", "at_risk", "churning"]),
  choice("who_is_doreen", "Who is Doreen?", ["supervisor", "customer", "internal_system", "unknown"], "Based on the ticket, who is Doreen most likely to be?"),
  score("churn_likelihood", "Churn likelihood level?", ["will stay", "unlikely to leave", "might leave", "likely to leave", "already leaving"]),
  score("frustration", "Customer frustration level?", ["calm", "mildly annoyed", "frustrated", "very frustrated", "furious"]),
  score("financial_impact", "Financial impact level?", ["none", "minor", "moderate", "major", "severe"]),
  score("technical_specificity", "Technical specificity level?", ["vague", "general", "some detail", "detailed", "precise, with logs"]),
  score("resolution_complexity", "Resolution complexity level?", ["trivial", "simple", "moderate", "complex", "very complex"]),
];

export function questionMap(): Record<string, JevQuestion> {
  return Object.fromEntries(
    QUESTIONS.map((q) => {
      const wire: Partial<ShowdownQuestion> = { ...q };
      delete wire.id;
      delete wire.label;
      return [q.id, wire as JevQuestion];
    }),
  );
}

// ---------------------------------------------------------------------------
// Mock mode fixture: hand-written plausible answers so the demo reads like real
// judgment without a key (high where the ticket is clear, low where it is not).

const NOUL: Record<string, number> = {
  revenue_impacted: 0.86,
  performance_issue: 0.97,
  accuracy_disputed: 0.04,
  churn_threat: 0.93,
  competitor_named: 0.95,
  launch_endangered: 0.9,
  human_attention: 0.96,
  deadline_stated: 0.92,
  multiple_customers: 0.81,
  confused_by_output: 0.78,
  unexplained_person: 0.84,
  refund_requested: 0.03,
  data_exposed: 0.02,
  language_threatening: 0.05,
  patience_exhausted: 0.88,
};

const CHOICE: Record<string, Record<string, number>> = {
  issue_category: { latency: 0.94, accuracy: 0.01, outage: 0.04, billing: 0, security: 0, feature_request: 0.01 },
  department: { technical: 0.97, billing: 0.01, sales: 0.02, legal: 0 },
  resolution: { restore_speed: 0.95, refund: 0.01, explanation: 0.04, account_change: 0 },
  response_deadline: { within_hour: 0.07, today: 0.91, this_week: 0.02, none: 0 },
  incident_scope: { single_account: 0.62, multiple_accounts: 0.3, platform_wide: 0.08 },
  account_health: { healthy: 0, watch: 0.12, at_risk: 0.71, churning: 0.17 },
  who_is_doreen: { supervisor: 0.07, customer: 0.02, internal_system: 0.36, unknown: 0.55 },
};

const SCORE: Record<string, number[]> = {
  churn_likelihood: [0, 0.05, 0.27, 0.58, 0.1],
  frustration: [0, 0, 0.09, 0.64, 0.27],
  financial_impact: [0, 0.04, 0.33, 0.52, 0.11],
  technical_specificity: [0.02, 0.21, 0.55, 0.2, 0.02],
  resolution_complexity: [0.03, 0.18, 0.51, 0.24, 0.04],
};

export function mockShowdownAnswers(): Record<string, JevAnswer> {
  const out: Record<string, JevAnswer> = {};
  for (const q of QUESTIONS) {
    if (q.type === "noul") out[q.id] = { type: "noul", noul: NOUL[q.id] };
    else if (q.type === "choice") {
      const probabilities = CHOICE[q.id];
      const top = Object.keys(probabilities).reduce((a, b) => (probabilities[b] > probabilities[a] ? b : a));
      out[q.id] = { type: "choice", choice: top, confidence: probabilities[top], probabilities };
    } else {
      const levels = SCORE[q.id];
      const probabilities = Object.fromEntries(levels.map((p, i) => [String(i), p]));
      out[q.id] = {
        type: "score",
        score: levels.reduce((s, p, i) => s + i * p, 0),
        confidence: Math.max(...levels),
        probabilities,
        legend: Object.fromEntries(q.levels.map((l, i) => [String(i), l])),
      };
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// What the showdown API returns to the browser.

export type ShowdownResult = {
  answers: Record<string, JevAnswer>;
  /** Jev's measured wall clock for the one request. */
  latencyMs: number;
  costUsd: number | null;
  inputTokens: number | null;
  model: string;
  mock: boolean;
  /** When this result was fetched from Jev (it is cached for a day). */
  fetchedAt: string;
};
