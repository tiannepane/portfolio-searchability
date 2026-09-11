# CDW: Redesigning Customer Research Synthesis with AI

I worked on this with two other product managers and two solutions architects. It's now a standing process on our team, not a one-time experiment.

---

## The Original Workflow

After conducting 8-10 user interviews, my process was:

- Take notes during each session in OneNote, with any follow-up questions tracked over email or Teams
- Re-read notes afterward and manually highlight pain points, quotes, and themes
- Group similar insights across interviews in a spreadsheet
- Write a research summary document (5-8 hours of work, more for larger teams or a bigger user base)
- Share findings in a slide deck, which usually got skimmed once and forgotten

Total synthesis time: 5-8 hours per research round. The core problem: insights were often buried, duplicated, or lost entirely once the summary was done.

## The Friction Points

- **Scattered information.** Raw notes lived across OneNote, spreadsheets, email threads, and Teams messages. No single source of truth.
- **Manual deduplication.** The same insight would show up across multiple interviews, but recognizing the pattern was on me.
- **Insight fatigue.** After enough interviews with similar users, patterns stopped standing out. The tenth interview about the same pain point didn't register the way the first one did.
- **Knowledge loss.** Anything that didn't make it into the summary slide disappeared. There was no searchable archive.
- **Slow turnaround.** By the time the summary was ready, the team had often moved on or lost context.

## Before You Build: Prerequisites

This redesign falls apart without these in place first.

1. **Every interviewer uses the same note format.** I standardized mine, but a coworker's notes followed a different structure entirely. The gap only became a real problem when I had to cover their interviews while they were out and couldn't make sense of what they'd written.
2. **Notes include verbatim quotes or close paraphrases.** A note like "user was frustrated" gives the AI nothing to cluster on.
3. **At least 5 interviews.** Fewer than that and theme clustering is just pattern-matching on noise.

## The AI-Enabled Redesign

**Step 1: Structured Note Capture (during the interview)**
Every note follows the same format, so Copilot can parse it reliably later:
```
Participant: [role], [company size], [plan tier]
Pain: [verbatim pain point or close paraphrase]
Behavior: [what they actually do today]
```

**Step 2: Theme Clustering (Copilot-assisted)**
All notes from all interviews get pasted into Copilot with a single prompt. This is the step with the most moving parts, the prompt, the sticky-note boards showing raw notes going in and clusters coming out, and the theme cards and flagged quotes coming back out. Built and documented separately (see the prompt-and-output asset).

**Step 3: Prioritized Insight Report (AI-generated, PM-edited)**
Copilot drafts an insight report: top themes by frequency, a supporting quote per theme, which participants raised it, and a suggested "so what" implication for each. I review it, edit it, and add context Copilot doesn't have.

## Human Fallback Triggers

All three of these are things I actually enforced, not just guardrails on paper.

- **Fewer than 3 themes from 8+ interviews.** When Copilot returned that few, it meant the notes needed reformatting, not that there genuinely were only 1 or 2 patterns. Reformat and rerun before presenting anything.
- **A theme appears in only one interview but feels strategically important.** Copilot ranks by frequency only. My judgment on impact overrides that ranking.
- **Anything touching pricing, churn, or competitive switching.** That always goes through a human review before it reaches leadership, no exceptions.

## Business Impact

| Metric | Before | After |
|---|---|---|
| Research synthesis time | 5-8 hrs | 1.5-2 hrs (-70%) |
| Insights searchable/archived | ~30% | 100% |
| Theme identification accuracy | PM judgment only | AI + PM, more consistent |
| Time to share findings | 3-4 days post-interview | Same day |

## Product Thinking: Risks & Tradeoffs

- **Risk:** Copilot might cluster on surface language rather than what's actually meant. Every cluster gets reviewed before anyone acts on it.
- **Risk:** inconsistent note formats across interviewers tank output quality fast. Standardizing the template came before any of the AI work, not after.
- **Design choice:** raw notes stay searchable and don't get replaced by the AI summary. The summary is a shortcut to the originals, not a stand-in for them.
- **Human judgment stays:** Copilot surfaces frequency. Deciding what actually matters for the roadmap is still mine to call.

---

## Portfolio assets: what's built, what's left

**Built:**
- Theme clustering prompt, run for real against 8 fabricated interview notes, with the sticky-note before/after boards and the theme cards + flagged quotes as output

**Still needed:**
1. **Interview note template** — a clean, standalone artifact showing the Participant/Pain/Behavior format from Step 1, the thing every interviewer actually filled out
2. **Before/after synthesis timeline** — a visual comparing the old workflow (5-8 hrs, scattered across four tools, 3-4 days to share) against the new one (1.5-2 hrs, one format, same day)
3. **Insight map mockup** — a mockup of the searchable archive itself, since "100% searchable" in the Business Impact table is a claim that needs something to point at
4. **Sample 1-page insight report** — the actual Step 3 deliverable, the finished report a PM hands off, pulling together the theme cards and flagged quotes into one page instead of scattered across a demo doc
