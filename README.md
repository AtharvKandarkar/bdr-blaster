# FlytBase Outbound BDR Engine

An AI system that turns a single campaign brief into a full outbound prospecting package — ranked accounts, verified contacts, and personalized outreach — for the FlytBase Hiring Hackathon (Outbound BDR track).

**Live app:** https://bdr-blaster.lovable.app

---

## The problem

A BDR is handed a target market and one reference customer, then has to find similar companies, find the right people inside them, research each one, and write personalized outreach. This system does that whole workflow automatically — the same steps a human BDR performs, systematized and scalable.

## Approach: a 5-agent pipeline (not one mega-prompt)

The work is delegated across five specialist agents, each with one testable job, so the logic is inspectable and failures are isolated:

1. **Lookalike Finder** — models the ICP from the reference account (SQM) and finds real, similar companies.
2. **Account Researcher** — pulls real public data and strategic signals for each account.
3. **Signal & Fit Ranker** — scores each account 0–100, ranks them, and gives the "why now."
4. **Contact Finder** — surfaces verified named executives where publicly sourced; otherwise emits a live LinkedIn search link. It never fabricates a person.
5. **Outreach Writer** — writes a personalized email per contact, anchored to a real signal, with real FlytBase social proof (SQM's 678 km² autonomous-inspection deployment; Anglo American).

Output: a dashboard ranked by fit score, copyable emails, and CSV/JSON export.

## The campaign brief (input)

- **Target vertical:** large-scale lithium, copper, and iron-ore mining in Latin America
- **Reference account:** Sociedad Química y Minera de Chile (SQM)
- **Goal:** book discovery calls with Head of Operations, VP of HSE, or Site Directors
- **FlytBase angle:** autonomous drone inspection replacing contracted crews at hazardous, 24/7 extraction sites

## Data & the no-fabrication rule

All company facts, signals, and named contacts are grounded on a verified public-source dataset (see the research grounding). The system synthesizes and phrases freely but does not invent companies, statistics, or people — where a contact isn't reliably public, it hands over a verifiable live search link instead.

## Tech stack

- **Lovable** — frontend, hosting, and GitHub sync
- **Lovable Cloud + Lovable AI gateway → Google Gemini (Flash)** for all AI generation
- React + Vite + Tailwind

## Limitations & next steps

- Research and contacts are grounded on a curated verified dataset, not a live web crawl — accurate but not real-time. Next step: wire in a live enrichment API (Apollo / Clay) for on-demand contact lookups.
- Add a source citation on every signal in the UI.
- Each agent is separate, so these are drop-in upgrades to a single stage.

## Author

Atharv Kandharkar — FlytBase Hiring Hackathon, Outbound BDR track, July 2026.
