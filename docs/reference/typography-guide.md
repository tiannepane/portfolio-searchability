# Typography System Guide

Read this before making any font, heading, or label styling change anywhere on this site. It applies site-wide: every case study page (Tomo, PokerGPT, People to Meet, Intelkin, and any future case study), plus general site pages and navigation. Match it everywhere rather than treating any one page as an exception, with the one carve-out named below.

> **Note (added 2026-09-20):** CLAUDE.md §12 documents that as of 2026-09-11, every case-study page additionally loads `css/typography-v2.css` (Instrument Serif / Public Sans / IBM Plex Mono) on top of this base system. For case-study pages specifically, typography-v2 is the current source of truth for headline/body/label fonts — CLAUDE.md supersedes this file where they conflict. This guide's Space Grotesk / DM Sans / Geist Pixel system still governs the shared nav and non-case-study pages (Home, Feedback, Fun, Resume).

## The three fonts and their jobs

1. **Space Grotesk** — headlines only. Page-level H1 claims and section H2 sub-headlines. Bold weight, geometric, distinctive. Never used for body text, values, or labels.
2. **DM Sans** — everything meant to be read at length. Body paragraphs, the subtitle/lede line under a headline, and the plain-text values under any metadata label (e.g. "Product Manager," "3 weeks," "2 Engineers, 1 Product Manager (me)"). Regular weight for body, medium weight where a subtitle needs to stand apart from ordinary paragraphs.
3. **Geist Pixel** — short, all-caps micro-labels only. Section eyebrows and metadata labels themselves (ROLE, TIMELINE, TEAM, SKILLS, TECH STACK, and equivalents). This is a single-weight pixel display face: it reads fine at a handful of characters and becomes illegible past that, so it never carries a value, a sentence, or anything longer than a short label.

## Why three, and why these three

The goal is a page that doesn't default to Inter, Roboto, Arial, or Fraunces — the choices that read as generic or AI-picked. Space Grotesk and DM Sans share the same geometric structure, so headline and body read as one family rather than fighting each other. Geist Pixel is the deliberate outlier: it's what makes the type system recognizable rather than safe, but only because its use is narrow and consistent — it's a label voice, not a display font pretending to be something else.

## What to do

- Apply Space Grotesk to every H1 and H2 across the site, replacing whatever heading font is currently in place.
- Apply DM Sans to every paragraph, lede/subtitle line, and metadata value across the site.
- Apply Geist Pixel to every section eyebrow and every metadata label (ROLE, TIMELINE, TEAM, SKILLS, TECH STACK and any project-specific addition to that list), uppercase, letter-spaced, small size — never to the value beside or below it.
- Load Space Grotesk and DM Sans via Google Fonts. Check whether Geist Pixel is available there directly or needs Vercel's `geist` npm package / self-hosted font files, and use whichever is actually reachable in this codebase.

## The one exception

The Intelkin case study's terminal-style repo card (the dark `npm run dev` card) keeps its own font: a realistic system monospace stack (`ui-monospace, "SF Mono", Menlo, Consolas, monospace`). Do not apply Geist Pixel or either of the other two fonts inside that component, and do not touch its styling as part of any typography pass. It's simulating a real terminal window and needs to look like one, not like the rest of the site's label voice.

## Don't

- Don't use Inter, Roboto, Arial, or Fraunces anywhere on the site.
- Don't use Geist Pixel for body text, paragraph text, or any metadata value.
- Don't touch the Intelkin terminal card.
- Don't invent a fourth font family for anything covered by the three roles above.
