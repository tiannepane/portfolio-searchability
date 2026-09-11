# CDW: AI-Assisted Research Synthesis — Prompt + Worked Example

The process below is what I actually built and used at CDW, for research into the post-purchase support and ticketing experience. In production, this prompt ran in Microsoft Copilot, the tool already approved for handling customer data on our team. The worked example below reproduces the same prompt for this portfolio, since real customer interview content is confidential. The interview notes here are reconstructed, not pulled verbatim from actual conversations.

---

## The clustering prompt

```
Below are notes from 8 user interviews. Each note follows this format: Participant, Pain, Behavior.

Your job:
(1) Identify 4-6 recurring themes across all interviews.
(2) For each theme, list which participants raised it and a supporting quote.
(3) Rank themes by frequency.
(4) Flag any insights that appear only once but seem high-impact.

Output format: Use this exact structure for each theme — THEME [N]: [Name] ([X/Y] participants) | Quote: [verbatim or close paraphrase] ([participant IDs]) | Implication: [1 sentence]. Do not include preamble or closing commentary.

Error handling: If the notes don't follow the Participant / Pain / Behavior format, respond with: "Note format is inconsistent. Please reformat your notes before re-running this prompt." Do not attempt to cluster inconsistently formatted inputs.
```

---

## Input: 8 interview notes

Participant: IT Manager, mid-market (250 employees), Premium Support
Pain: "I already submit a ticket online, but when I call in for an update, I have to explain the whole issue again from scratch."
Behavior: Keeps a personal spreadsheet of ticket numbers and summaries so she doesn't have to remember details when she calls.

Participant: Procurement Lead, small business (60 employees), Standard Support
Pain: "I have no idea where my ticket is sitting. I just wait and hope someone gets back to me."
Behavior: Calls the general support line every couple of days to check status, because the online portal rarely updates.

Participant: Systems Administrator, enterprise (2,000+ employees), Enterprise Support
Pain: "The portal said 'In Progress' for three weeks straight, so I stopped trusting it and started emailing my account rep directly."
Behavior: Bypasses the ticketing system for anything urgent and goes straight to his dedicated account rep by email.

Participant: Director of IT, mid-market (400 employees), Premium Support
Pain: "I get bounced between support and the manufacturer's warranty line, and neither side seems to know I already talked to the other."
Behavior: Keeps a shared doc with her team tracking which vendor or team has already been contacted, so nobody duplicates the same call.

Participant: Network Engineer, small business (80 employees), Standard Support
Pain: "Every rep asks the same questions. I've told this story to four different people now."
Behavior: Copy-pastes the same issue description into every new chat or call to save time.

Participant: Helpdesk Manager, enterprise (1,500 employees), Enterprise Support
Pain: "Honestly, our escalations get handled fast. I know exactly who to call when something's urgent, so status tracking hasn't been an issue for us."
Behavior: Uses a direct escalation contact for anything high severity instead of the standard ticket queue.

Participant: CTO, mid-market (300 employees), Premium Support
Pain: "We almost switched vendors at renewal because a ticket sat open for six weeks with no update, and it made us look bad internally."
Behavior: Started quietly evaluating a competitor's support SLA terms as a backup option for next year.

Participant: Operations Manager, small business (50 employees), Standard Support
Pain: "I enter the same serial number and issue description in the CDW portal, then again in an email to my rep, then again if it gets escalated to the manufacturer."
Behavior: Keeps a running note of ticket details to paste into whatever system or email thread comes next.

---

## Output: what the prompt actually returned

```
THEME 1: No reliable visibility into ticket status (3/8 participants) | Quote: "The portal said 'In Progress' for three weeks straight, so I stopped trusting it and started emailing my account rep directly" (P2, P3, P4) | Implication: Status data has to reflect what's actually happening, or customers abandon the portal and revert to manual escalation.

THEME 2: Customers build their own manual tracking systems to compensate (3/8 participants) | Quote: "I enter the same serial number and issue description in the CDW portal, then again in an email to my rep, then again if it gets escalated to the manufacturer" (P1, P4, P8) | Implication: Gaps in the support process are being patched by customer effort, not by CDW's system.

THEME 3: Re-explaining the same issue to multiple people (2/8 participants) | Quote: "Every rep asks the same questions. I've told this story to four different people now" (P1, P5) | Implication: No context travels with the ticket across phone, portal, and email touchpoints.

FLAGGED (single mention, high impact): P7 tied a six-week unresolved ticket directly to a near-decision to switch vendors at renewal, and has started evaluating a competitor's SLA terms. Only one participant raised it, but it touches competitive switching directly.
```

---

## Where the fallback triggers apply here

- Three themes came out of eight interviews, above the "fewer than 3" reformat threshold, but only by one. Real interview sets cluster messier than the clean 6/8-and-5/8 example in the template.
- P7's flagged insight touches competitive switching. Per the fallback rule, that goes to a human reviewer before anything reaches leadership, regardless of how compelling it reads on its own.
- P6 reported no status-tracking pain at all, crediting a personal relationship with an escalation contact rather than anything the standard process provides. The prompt correctly left this as a noted contradiction instead of folding it into a theme or averaging it away. Worth a follow-up question: is P6's experience the exception, or is CDW quietly relying on informal relationships to cover for a process gap most customers don't have access to.
