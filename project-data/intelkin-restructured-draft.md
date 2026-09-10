# Intelkin — Restructured Draft

Flagged inline wherever something still needs real content from you rather than a formatting fix.

---

## Hero

*\[Category line and hero image both missing\]*

RECOLLAB SIDE PROJECT • PROTOTYPE 2026 *\[confirm status/year\]*

# Intelkin

*\[Hero image needed. A screenshot of the actual tool interface, or the before/after Recollab comparison, would work, this is the one visual slot every reference case study fills before anything else.\]*

**ROLE** Product Manager

**TIMELINE** 3 weeks

**TEAM** 2 Engineers, 1 Product Manager (me)

**SKILLS** User Research, Prototyping, AI Integration

**TECH STACK** Python, Hugging Face, Claude API, Claude Vision, Next.js \+ React

---

## Overview

**What if you could predict churn before a feature ever reaches the market?**

Intelkin uses neuroscience to predict how the brain responds to a design before anyone sees it.

> **Note:** sharpened from "catch friction" to "predict churn" now that there's real competitive grounding, Churnkey and ChurnZero, to argue against directly. This version also matches your own phrasing from this turn rather than my earlier, vaguer version.

## The Problem

**Every churn tool available today tells you what already happened.**

Every Software as a Service (SaaS) company has a churn problem, and the tools built to fight it, Churnkey, ChurnZero, are built the same way: watch what customers do after a feature ships, then react.

*\[Visual: a simple three-point comparison graphic, or this can share the visual weight with Market Research immediately below it rather than needing its own.\]*

That creates three problems. The evaluation is always retroactive, waiting for cancellation sessions or billing events to accumulate before a pattern shows up, Churnkey's own numbers put that at tens of millions of cancellation sessions and 500 million billing events before a signal is legible. By the time it is, the churn has already happened, the customer who was going to leave over a specific piece of friction is already gone. And feedback from customers who've already churned is famously hard to get, closer to pulling teeth than a survey response.

> **Note:** the "pulling teeth" line is your own operating knowledge, not something Churnkey or ChurnZero's marketing copy states directly. Fine to keep as stated experience rather than a cited claim, just flagging that it's a different kind of assertion than the cancellation-session number next to it, which is a real figure from Churnkey's site.

## Market Research

**Every alternative still requires a real customer to see something first.**

Retention tools and pre-launch testing solve different problems, but they share one requirement: something has to actually ship before either produces an answer.

*\[Visual: a simple positioning chart, timing on one axis, before a feature ships versus after, and real-user exposure required on the other. Churnkey and ChurnZero cluster in "after launch, real users required." A/B testing sits close by, earlier but still requiring real users. Intelkin is alone in the open corner, before launch, no real users needed.\]*

**Reactive Retention Tools** Churnkey and ChurnZero are both built on data from customers already using the product, cancellation sessions, billing events, usage and onboarding patterns. Churnkey's own Intelligence Suite is powered by examining tens of millions of cancellation sessions and 500 million billing events. That's real signal, but it only exists after a customer has already lived through whatever's driving them to leave.

**A/B Testing & Sampling** The current alternative to waiting for churn data is testing a change with a smaller group of real customers before a full rollout. Faster than waiting for churn patterns to emerge at scale, but it still means shipping to real people and waiting for real usage to accumulate before there's an answer.

**Intelkin** Runs the design through a predictive model before either of those has to happen. No customer has to churn, get sampled into a test, or use the product at all for the read to exist.

> **Styling note:** matches PokerGPT's Market Research pattern exactly, one shared positioning visual, then a paragraph per category, 3-4 sentences each, ending on the option that wins. The "Reactive Retention Tools" paragraph runs slightly longer since it's carrying a specific number, Churnkey's own stated figures, that's worth keeping precise rather than trimmed for symmetry.

## Research: Dogfooding on Recollab

**Tested against our own investor demo before it went anywhere else.**

Six weeks on the same screens had made our own team blind to friction sitting right in front of us. Intelkin caught three friction points we'd completely missed.

*\[Gray container, micro-label: "RECOLLAB DEMO, BEFORE AND AFTER" — screenshots now exist with real captions: Before — file upload with no visible confirmation of what was understood, just receipt. After — an AI Processing panel naming exactly what each agent extracted, with the building's identity and progress step both visible.\]*

## Key Friction Points Found

*\[Filled in from the real before/after RECOstudy screenshots, styled to match Intelkin's actual tool output voice, mini-title, brain region, risk shift, then a two-sentence observation-then-consequence pattern, rather than the generic one-sentence grid used elsewhere.\]*

**Confirmation Gap** *Amygdala — High Risk → Low Risk* A checkmark only confirmed a file had arrived, not that anything in it was understood. Naming exactly what the Vision, Document, and Audio agents extracted turned that uncertainty into visible progress.

**Context Void** *Visual Cortex — Medium Risk → Low Risk* "Connect your building data" gave the user nothing to anchor to, so they had to hold the context themselves. Naming the actual building up front removes that scanning effort before a single file gets uploaded.

**Unscoped Commitment** *Prefrontal Cortex — Medium Risk → Low Risk* Nothing signaled how much was left, so every additional upload felt like an open-ended ask. A visible step count turns an unbounded task into a scoped one.

> **Styling note:** this departs from the strict one-sentence grid rule on purpose, mirroring the real product's own card format instead. Worth doing here specifically, since it lets the case study show the tool's actual voice rather than just describing it secondhand.  
>   
> **Structural note:** this currently stands as its own eyebrow section. On the other case study, People to Meet, the equivalent (Pain Points) got nested under Research instead, matching how PokerGPT nests its own Pain Points under Initial Observations rather than giving it a separate eyebrow. Worth the same fix here, folding Key Friction Points under Research: Dogfooding as an internal headline cycle, rule 8, rather than standing alone. Left as its own section for now since it wasn't asked for this turn, flagging so it doesn't quietly become an inconsistency between the two case studies.

## The Solution

**Intelkin: catches what a usability test would take weeks to find, before you ship anything.**

Teams already try to get ahead of this with A/B tests, sampling a change with real customers before a full rollout. That still means shipping to real people and waiting for real data. Intelkin skips both, no sample, no rollout, no customer required at all.

*\[Visual needed: none currently specified here, and every section elsewhere in the page has one, rule 1 violation. A simple side-by-side, "A/B test: ship, wait, measure" versus "Intelkin: upload, predict," would work, doesn't need to be complex.\]*

*\[Adjusted from your original phrasing, which repeated "before your users ever feel it" almost verbatim from the Overview question above it. Same claim, different words, so the two headlines don't echo each other three lines apart. If you'd rather keep your original wording exactly as written, that's a fine call too, just flagging the near-duplicate so it's a choice, not an accident.\]*

## How It Works

Upload two versions of a design and instead of "version B has less friction," you get why.

*\[Visual: DONE. Real screenshot of Intelkin's actual analysis output, churn risk by neural signal, cognitive load score, audit confidence, now available. Goes here before the longer explanation below.\]*

Intelkin runs your designs through Tribe V2, Meta's open-source model trained on brain responses from over 700 volunteers, and generates a read on which cognitive regions are activated. It shows which regions are overloaded and exactly where in the flow it's happening.

*\[Confirmed by fetching Meta's own announcement: Tribe v2 is trained on general media, images, podcasts, videos, text, for neuroscience and clinical research, not specifically on people using software products. That's not a flaw, but it does mean the "reads gaze, hover, dwell patterns" line from your other draft describes a different kind of system entirely, real-time behavioral telemetry, which this model doesn't do. Resolve in favor of the Tribe V2 description, that's the one backed by a real source.\]*

[Read the announcement →](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/)

> "This design is triggering the decision-making region too hard. There's too much cognitive load here. Users are going to feel confused and fall off." — Sample Intelkin output  
>   
> **Styling note:** using the pull-quote device for a real tool output rather than a person or a designer's own line is a genuine extension beyond what either reference case study does, worth owning as a deliberate choice, not hiding. Attribution underneath makes clear it's the product talking, not a participant.

**Tribe V2** Neural prediction model, trained on brain responses from over 700 volunteers.

**Claude Vision** Automated interpretation layer, in progress.

**Next.js \+ React** Frontend framework.

## Trade-offs

**Predicting a general brain, not your specific users.**

Tribe V2 is trained on brain responses from a general research population exposed to a wide range of media, not on people using SaaS products, and not on Recollab's actual users. What Intelkin returns is a prediction from that general model, not a measurement of how a specific audience will actually respond. That's the trade-off underneath the whole tool: a fast, pre-launch signal, not a replacement for testing with real users.

*\[Visual needed: Tomo's own "Trading memory for privacy" section, the closest direct template match, uses a simple two-circle seesaw diagram, Memory on one side, Privacy on the other, tipped toward the trade-off being made. Same device would work here, Speed on one side, Certainty on the other, tipped toward Speed.\]*

> *This is a trade-off worth naming plainly: speed before launch, not certainty about your specific audience.*

*\[Styling note: matches Tomo's "Trading memory for privacy" section exactly, headline naming the trade-off, one paragraph explaining it, then an italic line committing to it rather than hiding it. This section didn't exist before, it's new content this turn, grounded in what the Meta blog post actually says Tribe V2 is trained on.\]*

## Where It Is Now

Still a prototype, in two pieces. A clickable version shows what it looks like end to end, though it's a UI shell only, nothing in the demo calls Tribe V2 live yet.

*\[Artifacts: clickable prototype and terminal-run codebase both exist. Link or embed both here rather than describing them only in text.\]*

The working pipeline runs from the terminal, and staying local right now isn't a shortcut, it's closer to the correct setup. Tribe V2 is a real transformer model that needs GPU-level inference, not something typical lightweight hosting supports, and its model weights are large enough that serverless environments would mean redownloading them on every cold start. Worth running it the same way if you're checking out the code yourself, locally, with the API key set as an environment variable, rather than deploying the pipeline before it's stable. Next step is automating the interpretation layer with Claude Vision, so brain-region mapping doesn't have to be done by hand.

> **Styling note:** matches the same before/after visual-density pattern used elsewhere, short lede before the artifact placeholder, fuller explanation after it. The "encourage others to run it locally too" framing turns what could read as a limitation into a stated, reasoned setup choice, closer to how Trade-offs names its own constraint directly rather than hiding it.

*\[Trimmed. The "too close to the demo, dogfooded it, flagged things we'd missed" story already lives in full in the Research section above, repeating it here was the exact redundancy flagged this turn. This section's only job now is current status and what's next.\]*

## Reflection

*\[Drafted in full per your call. Two items, one to three sentences each, matching the Reflection exception rather than the strict one-sentence grid rule.\]*

**What I Learned**

**Being too close to your own product is real** Proximity is a blind spot, not just a figure of speech. A team staring at the same screens for weeks stops seeing them clearly, that gap is the actual reason this tool needed to exist.

**Interpretation is the actual product** The model doing the prediction turned out to be the easy part. Reading the brain-region output by hand is the real bottleneck right now, which is why automating that with Claude Vision matters more than the model itself did.

---

## Get in Touch

*\[Restored, this was in your original write-up and got dropped somewhere in the restructuring. Neither Tomo nor PokerGPT has an equivalent, since neither is a live, triable prototype, this is a legitimate intentional addition, not a template deviation to smooth over.\]*

Want to try it or share feedback? I'd love to hear from you.

[Get in touch →](mailto:nadykupane@gmail.com)  
