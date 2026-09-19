import type { Criteria } from "./validate";

export type PresetId = "support" | "vibe" | "custom";

export const PRESETS: Record<PresetId, { label: string; options: string[] }> = {
  support: { label: "Support queues", options: ["billing", "shipping", "technical", "other"] },
  vibe: { label: "Vibe check", options: ["good news", "bad news", "neutral"] },
  custom: { label: "Custom", options: ["yes", "no", "maybe"] },
};

/** "Let Bev review it" options. Descriptions go to Jev as criteria. */
export const REVIEW_CRITERIA: Criteria = {
  fine: "Reads as polite and professional. Safe to send.",
  "passive-aggressive": "Polite on the surface, hostile underneath.",
  furious: "Openly angry or hostile.",
  "will get you fired": "Insulting, threatening, or career-ending if sent.",
};

export const SAMPLE_TEXT = {
  classify: "Hi, I was charged twice for my order last week and nobody has answered my emails. Can I get a refund?",
  review: "Per my last email, I have attached the report again. Going forward, please read the attachments before asking.",
};
