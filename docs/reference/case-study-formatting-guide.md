# Case Study Page Formatting Guide

Read this before making any layout, spacing, or component changes to any case study page on this site. It's derived directly from two existing case studies already built and live in this portfolio, Tomo/OpenAI x Hardware and PokerGPT. Match their patterns exactly rather than inventing new ones per project. Every case study page on this site should look like a sibling of those two, not a one-off.

Before changing anything: inspect the existing components used for the Tomo and PokerGPT pages first. Reuse those components and their class names/styles for this page rather than creating parallel new ones. If no matching component exists yet for a pattern described below, build it to match the visual weight, spacing, and typography of the closest equivalent already in the codebase.

## 1. Section structure

Every section on the page follows this order, no exceptions unless explicitly marked as an intentional departure in the content itself:

1. Eyebrow label: small caps, gray, letter-spaced, sits above the headline
2. Headline: serif, large, one line or wraps to two. Must read as a claim or a question, never a gerund phrase ("Exploring X") and never "Understanding X"
3. Lede paragraph: 1-2 sentences directly under the headline, no bullets at this stage
4. A visual: image, framed diagram, mockup, or embedded media

Some case studies may open with content that doesn't fit this structure, an origin story, a hypothesis, a framing note before the first proper section. Don't force the four-part structure onto content like that, leave it as plain paragraph blocks if that's how it's written. People to Meet's opening (The Brief, Initial Hypothesis, The Disclosure) is the current example of this. Apply the same judgment to any future page with a similar non-standard opening rather than assuming every page needs one.

## 2. Grouped visuals get a labeled gray container

Any time 2 or more related images, screenshots, diagrams, or embedded media sit together, wrap them in a light gray rounded rectangle with a small all-caps micro-label in the box's own top-left corner, not the page-level eyebrow, a separate label scoped to that box.

A single standalone image does not need this treatment, it can sit bare with an optional caption.

Apply this to: the market research map (if grouped with other supporting graphics), the two audio interview players (label them something like "FIELD RECORDINGS"), and any future mockup clusters.

## 3. Text density around visuals

Two different limits depending on position relative to the nearest visual:

- **Before a visual:** 1-2 sentences max. This is the lede paragraph under any headline, and any paragraph immediately preceding an image or diagram that hasn't appeared yet.
- **After a visual:** can run 3-4 sentences, and can stack as 2-3 separate paragraphs if there's more than one idea to cover. This applies once a visual has already done some of the explaining.

If you find a paragraph over 2 sentences sitting before its section's first visual, either shorten it or move the visual earlier. Don't leave dense text stacked with no visual nearby.

## 4. Grid and column items

Anywhere content appears in a 2-4 column grid (Key User Insights, Pain Points, Why [X], Design Decisions), each item is:

- A bold or serif mini-headline, 2-5 words, no punctuation
- Exactly one sentence underneath

**Exception: Reflection / "What I Learned."** This specific closing section gets more room, 1-3 sentences per item rather than the strict one-sentence cap everywhere else. Don't apply the one-sentence rule here.

## 5. Pull-quote / callout styling

Reserved for the single sharpest line in a section, used sparingly, cap at 2-3 uses across the entire page. Visual treatment: italicized, indented with a left border, no quotation marks in the styling itself (attribution can sit below in plain text if it's a real quote from a named source), generous white space above and below, set apart from surrounding body copy.

A related but visually smaller device: attributed third-party commentary (like a quoted LinkedIn comment) gets a lighter version of this, a left border without italics, since it shouldn't compete with the main pull-quote styling.

## 6. Captions

Two patterns exist, don't mix them within the same image group:

- **Paired layout:** image on one side, a short caption block vertically centered beside it
- **Below-image credit:** small, gray, sits directly under the image, used for short factual labels or photo credits

## 7. Metadata header block

Sits directly under the hero image at the top of the page: ROLE, TIMELINE, TEAM, SKILLS as a 4-column row, each with a small eyebrow-style label above a plain-text value. Most case studies should stick to these exact four. If a specific case study needs a fifth column, People to Meet adds TECH STACK, for example, keep it visually consistent with the other four rather than styling it differently, and only add one when the content genuinely calls for it.

## 8. Sub-headlines inside a single section

A section can contain more than one headline + paragraph + visual cycle under one eyebrow before the next eyebrow appears. These inner headlines are smaller than the main section headline but still serif, still real headlines, not just bolded inline text. Use this for sections that cover more than one beat, don't force everything under one eyebrow into a single unbroken scroll.

## 9. Footer

Match whatever sign-off pattern the other case studies use at the very bottom of the page, don't invent a new one for this page specifically.

## Page-specific content notes

This file stays generic on purpose so it works for any case study page, current or future. Content-specific notes, what's still a placeholder, what copy is locked versus still in progress, what a section's headline should be, belong in that project's own draft file, not here.

## What not to do

- Don't rewrite any locked copy while fixing formatting. If a paragraph is too long for its position, ask before cutting content rather than shortening it unilaterally.
- Don't invent a new visual style for something the reference case studies already have a pattern for.
- Don't remove `[Artifact needed]` placeholders, they're intentional markers for what's still being built.
