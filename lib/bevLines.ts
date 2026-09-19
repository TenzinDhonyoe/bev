// Template lines for the thinking theatre. No LLM involved.
//
// Slots:
//   {word}     a meaningful word from the user's text (stopwords skipped)
//   {winner}   Jev's top choice
//   {runnerUp} Jev's second choice
//
// Rules: third person only, no em dashes, and nothing outside the closing
// lines may name a verdict. Runner-up lines must only ever doubt it.

export type Persona = "bev" | "gary";

export type LinePools = {
  openers: string[];
  wander: string[]; // the middle: habits, office chaos, reasoning parody
  breaks: string[];
  runnerUp: string[];
  preFinal: string[];
  finals: string[];
  setback: string[];
  rushed: string[];
  review: string[]; // extra wander lines for "Let Bev review it"
  reviewOpeners: string[];
  reviewFinals: string[];
};

export const BEV: LinePools = {
  openers: [
    "Bev has received your ticket.",
    "Bev is stamping your ticket RECEIVED.",
    "Bev has taken a number for your ticket. It is number 4,512.",
    "Bev printed your ticket so she can read it properly.",
    "A new ticket. Bev puts down her crossword.",
  ],

  wander: [
    // Bev-isms
    "Bev is looking for her reading glasses.",
    "Bev found her reading glasses. They were on her head.",
    "Bev is refilling her coffee.",
    "Bev is warming up her coffee in the microwave. 45 seconds.",
    "Bev is sharpening a pencil.",
    "Bev is sorting her pens by color.",
    "Bev is watering the office fern.",
    "Bev is adjusting her chair. It squeaks.",
    "Bev is opening a fresh pad of sticky notes.",
    "Bev is labeling a new manila folder.",
    "Bev is squinting at the screen.",
    "Bev is humming a Fleetwood Mac song.",
    "Bev is looking at a photo of her cat, Mr. Whiskers, for strength.",
    "Bev is eating one almond.",
    "Bev is signing a birthday card for someone in Legal.",
    "Bev is looking for the stapler. Someone moved the stapler.",
    "Bev is putting on her cardigan. It is cold by the window.",
    "Bev is clicking the mouse twice, firmly.",

    // Office chaos
    "The printer is jammed. Bev is calling IT.",
    "IT has asked Bev to turn it off and on again.",
    "Bev is consulting her supervisor, Doreen.",
    "Doreen is in a meeting. Bev will wait.",
    "Doreen says it is Bev's call. Bev hates that.",
    "The fax machine is making a noise. Bev is ignoring it.",
    "Someone microwaved fish. Bev needs a moment.",
    "Bev is looking for the form. The form has a form.",
    "Bev is waiting for the shared drive to load.",
    "Bev's computer is installing updates (3 of 47).",
    "Ron from Sales stopped by to talk about his boat.",
    "Bev is on hold with the vendor. The hold music is pan flute.",
    "The Wi-Fi password changed. Bev is asking around.",
    "Bev is initialing page 2 of 7.",
    "Bev is reorganizing the filing cabinet. Alphabetically, this time.",

    // Reasoning-model parody
    "Hmm. \"{word}\".",
    "Wait. Bev would like to reconsider.",
    "Actually, Bev is reconsidering that reconsideration.",
    "Bev is thinking step by step. Step one: coffee.",
    "Bev is underlining \"{word}\" twice.",
    "Bev is looking up \"{word}\" in the dictionary.",
    "Bev noticed that \"{word}\" is doing a lot of work here.",
    "Bev is cross-referencing \"{word}\" with the 1987 binder.",
    "Bev is highlighting \"{word}\" in yellow. Now also in pink.",
    "Interesting. Bev did not expect \"{word}\".",
    "Bev has made a pro and con list. It is mostly cons.",
    "Bev is weighing the evidence. Literally, on the postage scale.",
    "Bev is looking at this from the customer's point of view.",
    "Bev is considering all the options. All of them.",
    "Hmm.",
    "Bev is going back to the beginning.",
    "Bev is doing chain of thought. It is a lot like regular thought.",
    "Bev has a hunch. Bev does not trust hunches.",
    "Bev is double-checking. Now triple-checking.",
    "Bev is drawing a diagram on a napkin.",
    "Bev is asking herself what Doreen would do.",
  ],

  breaks: [
    "Bev is on her lunch break (back in 14 minutes).",
    "Bev is on her 10:30 break.",
    "Bev stepped out to move her car. Street cleaning.",
    "Bev is taking a personal call from her sister.",
    "There is cake in the break room. Bev will be right back.",
    "Bev is stretching. Doctor's orders.",
  ],

  runnerUp: [
    "Could it be {runnerUp}? Bev is not so sure.",
    "Bev is holding it up next to the {runnerUp} pile.",
    "Some would say {runnerUp}. Bev is not some.",
    "Bev almost wrote {runnerUp}. Bev has put the pen down.",
    "What about {runnerUp}? Bev is considering it. Bev is done considering it.",
  ],

  preFinal: [
    "Bev is getting a feeling about {winner}.",
    "Everything points to {winner}. Bev is checking once more.",
    "Bev is reaching for the {winner} stamp.",
  ],

  finals: [
    "Bev has filed it under {winner}.",
    "Decision made: {winner}. Bev is stamping it.",
    "Bev has reached a verdict: {winner}.",
  ],

  setback: ["Bev put it in the wrong pile. Bev is starting that part over."],

  rushed: [
    "Bev does not appreciate being rushed.",
    "Bev still does not appreciate being rushed.",
    "Bev has made a note of this.",
    "Bev is telling Doreen about this.",
    "Bev is going to need another coffee now.",
  ],

  review: [
    "Bev has read this three times. Bev suggests you do the same.",
    "Bev is reading it out loud. Quietly.",
    "Bev is imagining your boss reading this.",
    "Bev is imagining your mother reading this.",
    "Bev noticed \"{word}\". Bev is making a note that she noticed.",
    "Bev is checking the tone. The tone is checking back.",
    "Bev printed it out. Bev is holding it at arm's length.",
    "Have you considered sleeping on it? Bev has.",
    "Bev is counting the exclamation points.",
    "Bev would like to remind you that emails are forever.",
    "Bev is showing it to Doreen. Doreen made a noise.",
    "Bev is reading it as if she were the recipient.",
    "Bev is reading between the lines. There is a lot between the lines.",
    "Bev is checking whether \"{word}\" can be read two ways. It can.",
    "Bev suggests you do not hit send while she is reviewing.",
    "Bev once sent an email like this in 1994. Bev still thinks about it.",
    "Bev is taking a deep breath on your behalf.",
    "Bev is checking whether Reply All is involved.",
  ],

  reviewOpeners: [
    "Bev has received your draft. Bev will need ten minutes.",
    "Bev is clearing her desk for your draft. This will take ten minutes.",
  ],

  reviewFinals: [
    "Bev has finished reviewing. Bev's verdict: {winner}.",
    "Bev has read it one last time. Bev's verdict: {winner}.",
  ],
};

// Gary covers on Fridays. Faster, ruder, still third person.
export const GARY: LinePools = {
  openers: [
    "Gary is covering for Bev. Gary will be quick.",
    "Gary grabbed your ticket off Bev's desk.",
  ],

  wander: [
    "Gary has seen worse.",
    "Gary skimmed it.",
    "Gary is not reading all of that.",
    "Gary does not know where Bev keeps the pens.",
    "Gary is eating Bev's almonds.",
    "Gary does not need reading glasses. Gary says.",
    "Gary is not calling IT. Gary is IT today.",
    "Gary read \"{word}\". Gary has seen worse.",
    "Gary's coffee is cold. Gary is drinking it anyway.",
    "Gary is sitting in Bev's chair. It squeaks.",
    "Gary is not consulting Doreen.",
    "Gary thinks step by step. There are two steps.",
    "Gary put his feet on the desk.",
    "Gary does not reconsider.",
    "Gary is humming. Loudly.",
    "Gary has a softball game at five.",
    "Gary checked the clock.",
    "Gary highlighted \"{word}\". In one color.",
    "Gary is typing with two fingers. Fast, though.",
    "Gary knows what \"{word}\" means. Probably.",
  ],

  breaks: ["Gary is taking five. Gary is back in two."],

  runnerUp: [
    "Gary looked at {runnerUp}. No.",
    "Gary gave {runnerUp} one second. Gary said no.",
  ],

  preFinal: ["Gary has a feeling about {winner}. Gary goes with feelings."],

  finals: ["Gary filed it under {winner}. Next.", "Gary says {winner}. Gary is done here."],

  setback: ["Gary put it in the wrong pile. Gary blames Bev's system."],

  rushed: [
    "Gary does not appreciate being rushed either.",
    "Gary is slowing down out of spite.",
    "Gary is telling Bev about this on Monday.",
  ],

  review: [
    "Gary read it once. Once was plenty.",
    "Gary would just send it. Gary is not Bev.",
    "Gary thinks your email is long.",
    "Gary is waiting out the clock because Bev left a note saying to.",
    "Gary is reading your draft with his feet up.",
    "Gary would have used fewer words.",
  ],

  reviewOpeners: ["Gary found your draft on Bev's desk. Bev's note says ten minutes. Fine."],

  reviewFinals: ["Gary has finished Bev's review. Verdict: {winner}."],
};

export const POOLS: Record<Persona, LinePools> = { bev: BEV, gary: GARY };

export const STOPWORDS = new Set(
  (
    "a about above after again against all also am an and any are aren't as at be because been before being below " +
    "between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each " +
    "few for from further get got had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers " +
    "herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself just let's like me " +
    "more most much must mustn't my myself no nor not now of off on once only or other ought our ours ourselves out " +
    "over own please same she she'd she'll she's should shouldn't so some such than that that's the their theirs " +
    "them themselves then there there's these they they'd they'll they're they've this those through to too under " +
    "until up us very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which " +
    "while who who's whom why why's will with won't would wouldn't you you'd you'll you're you've your yours " +
    "yourself yourselves hi hello hey thanks thank dear regards best sincerely really still even well yes okay ok " +
    "going gonna want wanted need needs anyone someone something anything everything thing things since though " +
    "already yet ever every one two three four five just"
  ).split(/\s+/),
);
