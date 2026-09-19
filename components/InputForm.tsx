"use client";

import { useId } from "react";
import type { Persona } from "@/lib/bevLines";
import { durationRange, EFFORT_LABELS, type Effort } from "@/lib/bevScript";
import { PERSONA_NAME } from "@/lib/friday";
import { formatDuration } from "@/lib/format";
import { PRESETS, REVIEW_CRITERIA, SAMPLE_TEXT, type PresetId } from "@/lib/presets";
import { LIMITS, type ClassifyMode } from "@/lib/validate";

export type FormState = {
  mode: ClassifyMode;
  text: string;
  preset: PresetId;
  options: string[];
  effort: Effort;
};

type Props = {
  value: FormState;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
  persona: Persona;
  error: string | null;
  submitting: boolean;
};

const EFFORTS: Effort[] = ["low", "medium", "high", "bev"];

function effortHint(effort: Effort, persona: Persona): string {
  const [min, max] = durationRange(effort, persona);
  if (effort === "bev") return `${formatDuration(min)} to ${formatDuration(max)}`;
  return `about ${formatDuration((min + max) / 2)}`;
}

const chip = "rounded-full border-2 px-3 py-1 text-sm font-medium";
const chipOn = "border-ink bg-ink text-card";
const chipOff = "border-ink/30 bg-card hover:border-ink";

export function InputForm({ value, onChange, onSubmit, persona, error, submitting }: Props) {
  const ids = { text: useId(), count: useId(), error: useId() };
  const name = PERSONA_NAME[persona];
  const set = (patch: Partial<FormState>) => onChange({ ...value, ...patch });
  const isReview = value.mode === "review";

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
      aria-describedby={error ? ids.error : undefined}
    >
      <fieldset>
        <legend className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-soft">Request form</legend>
        <div className="inline-flex rounded-md border-2 border-ink bg-card p-1">
          {(
            [
              ["classify", "Classify"],
              ["review", `Let ${name} review it`],
            ] as const
          ).map(([mode, label]) => (
            <label
              key={mode}
              className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-stamp ${
                value.mode === mode ? "bg-ink text-card" : "text-ink hover:bg-paper"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={mode}
                checked={value.mode === mode}
                onChange={() => set({ mode })}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-1 flex items-end justify-between gap-2">
          <label htmlFor={ids.text} className="font-medium">
            {isReview ? "The message you are about to send" : "The ticket"}
          </label>
          <button
            type="button"
            onClick={() => set({ text: SAMPLE_TEXT[value.mode] })}
            className="text-sm text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink"
          >
            Use an example
          </button>
        </div>
        <textarea
          id={ids.text}
          value={value.text}
          onChange={(e) => set({ text: e.target.value })}
          maxLength={LIMITS.textMax}
          rows={isReview ? 6 : 4}
          aria-describedby={ids.count}
          placeholder={isReview ? "Paste the email or message here. Bev will not send it." : "Paste a support ticket, a message, anything."}
          className="w-full resize-y rounded-md border-2 border-ink/40 bg-card px-3 py-2 leading-7 focus:border-ink"
        />
        <p id={ids.count} className="mt-1 text-right font-mono text-xs text-ink-soft">
          {value.text.length} / {LIMITS.textMax}
        </p>
      </div>

      {isReview ? (
        <div>
          <p className="font-medium">{name} will decide if it reads as</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {Object.keys(REVIEW_CRITERIA).map((o) => (
              <li key={o} className="rounded border border-ink/30 bg-card px-2 py-1 font-mono text-sm">
                {o}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            {name} reviews for exactly 10 minutes. {name} does not do rush jobs. You can leave this tab open and come back.
          </p>
        </div>
      ) : (
        <>
          <fieldset>
            <legend className="mb-2 font-medium">Options</legend>
            <div className="mb-3 flex flex-wrap gap-2">
              {(Object.keys(PRESETS) as PresetId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={value.preset === id}
                  onClick={() => set({ preset: id, options: [...PRESETS[id].options] })}
                  className={`${chip} ${value.preset === id ? chipOn : chipOff}`}
                >
                  {PRESETS[id].label}
                </button>
              ))}
            </div>
            <ol className="space-y-2">
              {value.options.map((opt, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span aria-hidden="true" className="w-5 text-right font-mono text-xs text-ink-soft">
                    {i + 1}.
                  </span>
                  <input
                    value={opt}
                    aria-label={`Option ${i + 1}`}
                    maxLength={LIMITS.labelMaxExclusive - 1}
                    onChange={(e) => {
                      const options = [...value.options];
                      options[i] = e.target.value;
                      set({ options, preset: "custom" });
                    }}
                    className="min-w-0 flex-1 rounded border-2 border-ink/30 bg-card px-2 py-1.5 font-mono text-sm focus:border-ink"
                  />
                  <button
                    type="button"
                    aria-label={`Remove option ${i + 1}${opt ? `, ${opt}` : ""}`}
                    disabled={value.options.length <= LIMITS.optionsMin}
                    onClick={() => set({ options: value.options.filter((_, j) => j !== i), preset: "custom" })}
                    className="h-9 w-9 rounded border-2 border-ink/30 bg-card font-mono text-ink-soft hover:border-ink hover:text-ink disabled:opacity-40"
                  >
                    x
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              disabled={value.options.length >= LIMITS.optionsMax}
              onClick={() => set({ options: [...value.options, ""], preset: "custom" })}
              className="mt-2 text-sm font-medium underline decoration-dotted underline-offset-4 disabled:no-underline disabled:opacity-40"
            >
              + Add option
            </button>
            <p className="mt-1 text-xs text-ink-soft">
              {LIMITS.optionsMin} to {LIMITS.optionsMax} options, each under {LIMITS.labelMaxExclusive} characters.
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-medium">Reasoning effort</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EFFORTS.map((effort) => (
                <label
                  key={effort}
                  className={`cursor-pointer rounded-md border-2 px-3 py-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-stamp ${
                    value.effort === effort ? "border-ink bg-sticky" : "border-ink/30 bg-card hover:border-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="effort"
                    value={effort}
                    checked={value.effort === effort}
                    onChange={() => set({ effort })}
                    className="sr-only"
                  />
                  <span className="block font-semibold">{EFFORT_LABELS[effort]}</span>
                  <span className="block font-mono text-xs text-ink-soft">{effortHint(effort, persona)}</span>
                </label>
              ))}
            </div>
            {persona === "gary" && <p className="mt-2 text-sm text-ink-soft">Gary is covering today. Gary takes about a third as long.</p>}
          </fieldset>
        </>
      )}

      {error && (
        <p id={ids.error} role="alert" className="rounded border-2 border-stamp bg-card px-3 py-2 text-stamp">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md border-2 border-ink bg-ink px-5 py-3 text-lg font-semibold text-card shadow-[3px_3px_0_0_var(--color-folder)] hover:bg-ink-soft disabled:opacity-60 sm:w-auto"
      >
        {isReview ? `Let ${name} review it` : `Ask ${name}`}
      </button>
    </form>
  );
}
