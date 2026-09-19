// Bev-voiced user-facing strings. Bev speaks in third person. No em dashes.

export const ERRORS = {
  badJson: "Bev could not read that form. Please fill it out again.",
  textMissing: "Bev needs something to classify. The inbox is empty.",
  textTooLong: "Bev only reads up to 2000 characters. Anything longer goes to Doreen.",
  optionsCount: "Bev needs between 2 and 8 options. Those are the rules.",
  optionEmpty: "One of the options is blank. Bev does not file things under nothing.",
  optionTooLong: "Option names must be under 40 characters. Bev's label maker has limits.",
  optionDuplicate: "Two options have the same name. Bev refuses to guess which pile is which.",
  descriptionTooLong: "Option descriptions must be under 200 characters. Bev is not reading an essay.",
  modeInvalid: "Bev does not recognize that request form.",
  rateLimited: "Bev is handling a lot of tickets right now. Please take a number and try again in a minute.",
  upstream: "Bev's computer is updating. Please try again.",
  overloaded: "The office is very busy. Bev will be with you shortly. Please try again.",
  config: "Bev cannot find her login details. Someone should tell IT.",
  timeout: "Bev's computer froze. Please try again.",
} as const;
