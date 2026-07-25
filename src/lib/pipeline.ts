// Grounding data — the ONLY source of truth for company facts.
// All 5 agents receive this so nothing gets fabricated.
export const GROUNDING = `
ICP (from SQM): large-scale Li/Cu/Fe-ore extraction in Latin America; remote hazardous 24/7 sites (open pits, tailings dams, brine ponds, plants); active capex/expansion; existing tech/automation/safety investment; sites inspected today by human/contract crews.

ACCOUNTS:
- Codelco (Chile, copper) — TOP FIT. Signals: public "Zero Exposure Mine" strategy removing humans from hazardous areas (robotics at El Teniente); NTT DATA alliance (Nov 2025) for automation/safety/autonomous ops; Microsoft AI deal (Mar 2026); Hexagon alliance. Leadership: Jorge Gómez became CEO Jul 2026 (ex-VP Operations); Lindor Quiroga Acting VP Operations. Hook: "Zero Exposure Mine" = FlytBase's exact thesis.
- SQM (Chile, lithium) — anchor. Signals: Codelco JV approved; ~70%+ lithium expansion toward 260kt; US$2.7B capex 2025–27; Salar Futuro project. Hook: vast Atacama pond fields + remote infra to monitor; expansion multiplies inspection load.
- Antofagasta Minerals (Chile, copper). Signals: US$3.4B 2026 capex; Centinela expansion (new open pit); Los Pelambres desal doubling; Zaldívar US$900M extension; +30% output by 2030 via new tech. Hook: multiple large pits + tailings + construction = heavy hazardous-inspection demand.
- Albemarle (Chile, lithium). Signals: Direct Lithium Extraction "TED" project (~US$3.1B), EIA submitted Mar 2026; capacity doubled >85kt; La Negra III (US$500M+). Hook: brine ponds + chemical processing in remote desert; already investing in efficiency tech.
- Sigma Lithium (Brazil, lithium). Signals: Phase 2 Grota do Cirilo expansion doubling capacity to ~520kt; BNDES financing; reserves +40%; strong ESG focus. Hook: open-pit hard-rock + tailings under scrutiny → autonomous dam/slope monitoring is an ESG+safety win.
- Vale Base Metals (Brazil, copper + iron ore). Signals: copper reserves +6% to 53Mt; Salobo brownfield expansion; heavy brownfield drilling. Hook: tailings-dam safety scrutiny makes continuous autonomous monitoring board-level urgent; huge 24/7 footprint.

TARGET PERSONAS: Head/VP of Operations; VP/Director of HSE; Site/Division Director; (secondary) Head of Innovation/Digital.

VERIFIED REAL CONTACTS: Codelco — Jorge Gómez (CEO, ex-VP Operations); Lindor Quiroga (Acting VP Operations). NO OTHER real names are verified — for everyone else use verify-live X-ray search URLs, never invent names.

FLYTBASE SOCIAL PROOF: Anglo American (mining peer — strongest), Shell, CSX, Airbus, Statnett.

DRONE SAFETY VALUE: removes personnel from pit-wall/slope inspection, tailings-dam monitoring, blast-zone survey, remote 24/7 infra checks — work done today by rope-access and contracted crews.
`.trim();

export const ANTI_HALLUCINATION = `
STRICT RULES:
- Use ONLY facts, companies, signals, and names from the GROUNDING DATA.
- Do NOT invent companies, statistics, dates, or people.
- If a real person's name is not in VERIFIED REAL CONTACTS, output a verify-live Google X-ray URL instead of a made-up name.
- Return ONLY valid JSON matching the requested shape. No prose outside JSON.
`.trim();

export type Brief = {
  vertical: string;
  reference: string;
  goal: string;
  angle: string;
};

export type Account = {
  company: string;
  country: string;
  commodity: string;
  reasoning: string;
};

export type Research = {
  company: string;
  bullets: string[];
};

export type Ranked = {
  company: string;
  score: number;
  why_now: string;
  signal: string;
};

export type Contact = {
  company: string;
  persona: string;
  name: string | null; // null => verify-live
  xray_url: string;
  verified: boolean;
};

export type Email = {
  company: string;
  persona: string;
  to_label: string;
  subject: string;
  body: string;
};

function briefBlock(b: Brief) {
  return `CAMPAIGN BRIEF:
- Target Vertical: ${b.vertical}
- Reference Account: ${b.reference}
- Goal: ${b.goal}
- FlytBase Angle: ${b.angle}`;
}

async function callStage<T>(system: string, user: string): Promise<T> {
  const res = await fetch("/api/stage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  if (!res.ok) throw new Error(`Stage failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as T;
}

const baseSystem = `You are an agent in the FlytBase Outbound BDR Engine.
${ANTI_HALLUCINATION}

GROUNDING DATA:
${GROUNDING}`;

// ---------- Agent 1: Lookalike Finder ----------
export async function runStage1(brief: Brief): Promise<Account[]> {
  const system = `${baseSystem}

You are AGENT 1 — LOOKALIKE FINDER. Define the ICP from the reference account and vertical, then return 5–6 matching real Latin American mining companies drawn ONLY from the GROUNDING DATA ACCOUNTS list.`;
  const user = `${briefBlock(brief)}

Return JSON: { "accounts": [ { "company": string, "country": string, "commodity": string, "reasoning": string } ] }
Reasoning is 1–2 sentences tied to a real signal from GROUNDING DATA.`;
  const out = await callStage<{ accounts: Account[] }>(system, user);
  return out.accounts;
}

// ---------- Agent 2: Account Researcher ----------
export async function runStage2(brief: Brief, accounts: Account[]): Promise<Research[]> {
  const system = `${baseSystem}

You are AGENT 2 — ACCOUNT RESEARCHER. For each account, write a 3–4 bullet research brief using ONLY GROUNDING DATA: recent news/expansion, operational footprint, technology/safety investment signals, and the strategic tie to FlytBase (hazardous 24/7 sites served by human crews).`;
  const user = `${briefBlock(brief)}

ACCOUNTS TO RESEARCH:
${accounts.map((a) => `- ${a.company} (${a.country}, ${a.commodity})`).join("\n")}

Return JSON: { "research": [ { "company": string, "bullets": string[] } ] }
3–4 bullets per company. Every brief must connect to why autonomous drone inspection matters for them.`;
  const out = await callStage<{ research: Research[] }>(system, user);
  return out.research;
}

// ---------- Agent 3: Signal & Fit Ranker ----------
export async function runStage3(brief: Brief, research: Research[]): Promise<Ranked[]> {
  const system = `${baseSystem}

You are AGENT 3 — SIGNAL & FIT RANKER. Score each account 0–100 for fit and rank highest first. Give a one-line "why now" trigger and cite which specific signal drives it.`;
  const user = `${briefBlock(brief)}

RESEARCH:
${research.map((r) => `${r.company}:\n${r.bullets.map((b) => `  - ${b}`).join("\n")}`).join("\n\n")}

Return JSON: { "ranked": [ { "company": string, "score": number, "why_now": string, "signal": string } ] } sorted by score descending.`;
  const out = await callStage<{ ranked: Ranked[] }>(system, user);
  return out.ranked.sort((a, b) => b.score - a.score);
}

// ---------- Agent 4: Contact Finder ----------
// Deterministic — no AI call. Builds LinkedIn X-ray URLs per persona per account,
// and injects the two verified real Codelco contacts when applicable.
const PERSONAS = [
  "Head of Operations",
  "VP of HSE",
  "Site / Division Director",
] as const;

function xrayUrl(persona: string, company: string) {
  const q = `site:linkedin.com/in ("${persona}") "${company}"`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export function runStage4(_brief: Brief, ranked: Ranked[]): Contact[] {
  const contacts: Contact[] = [];
  for (const r of ranked) {
    for (const persona of PERSONAS) {
      contacts.push({
        company: r.company,
        persona,
        name: null,
        xray_url: xrayUrl(persona, r.company),
        verified: false,
      });
    }
    if (r.company.toLowerCase().includes("codelco")) {
      contacts.push(
        {
          company: r.company,
          persona: "CEO (ex-VP Operations)",
          name: "Jorge Gómez",
          xray_url: xrayUrl("Jorge Gómez", r.company),
          verified: true,
        },
        {
          company: r.company,
          persona: "Acting VP of Operations",
          name: "Lindor Quiroga",
          xray_url: xrayUrl("Lindor Quiroga", r.company),
          verified: true,
        },
      );
    }
  }
  return contacts;
}

// ---------- Agent 5: Outreach Writer ----------
export async function runStage5(
  brief: Brief,
  research: Research[],
  contacts: Contact[],
): Promise<Email[]> {
  const system = `${baseSystem}

You are AGENT 5 — OUTREACH WRITER. For each contact, write a personalized cold email (≤120 words).
RULES:
- Reference the specific company's real signal from the research (no {placeholders}).
- Tie to the persona's role: Ops = uptime/efficiency; HSE = worker safety/zero-exposure; Site/Division Director = site-level rollout.
- Make the FlytBase safety/autonomy pitch concrete (removing crews from pit-walls, tailings dams, blast zones, remote 24/7 infra).
- Where it strengthens credibility, reference FlytBase customers: Anglo American (mining peer — strongest), Shell, CSX.
- Goal: book a discovery call.
- Each email must read like a human did their homework. No mail-merge tokens.`;
  const user = `${briefBlock(brief)}

RESEARCH BY COMPANY:
${research.map((r) => `${r.company}:\n${r.bullets.map((b) => `  - ${b}`).join("\n")}`).join("\n\n")}

CONTACTS:
${contacts
  .map(
    (c) =>
      `- ${c.company} | ${c.persona} | ${c.verified && c.name ? c.name : "verify-live"}`,
  )
  .join("\n")}

Return JSON: { "emails": [ { "company": string, "persona": string, "to_label": string, "subject": string, "body": string } ] }
"to_label" is the recipient's real name if verified, else "verify-live (${"{persona}"})".
"body" is plain text with \\n line breaks, ≤120 words, signed "— FlytBase team".`;
  const out = await callStage<{ emails: Email[] }>(system, user);
  return out.emails;
}