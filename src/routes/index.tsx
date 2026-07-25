import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  runStage1,
  runStage2,
  runStage3,
  runStage4,
  runStage5,
  type Account,
  type Brief,
  type Contact,
  type Email,
  type Ranked,
  type Research,
} from "@/lib/pipeline";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlytBase Outbound BDR Engine" },
      {
        name: "description",
        content:
          "AI-powered 5-stage outbound prospecting pipeline: one campaign brief → ranked accounts, real contacts, and personalized outreach.",
      },
      { property: "og:title", content: "FlytBase Outbound BDR Engine" },
      {
        property: "og:description",
        content:
          "One campaign brief → ranked accounts, real contacts, personalized outreach.",
      },
    ],
  }),
  component: Index,
});

const DEFAULT_BRIEF: Brief = {
  vertical: "Large-scale lithium, copper, and iron ore mining operations in Latin America",
  reference: "Sociedad Química y Minera de Chile (SQM)",
  goal: "Book discovery calls with Head of Operations, VP of HSE, or Site Directors",
  angle:
    "Autonomous drone inspection replacing contracted crews at hazardous, 24/7 extraction sites",
};

type StageStatus = "idle" | "running" | "done" | "error";

const STAGES = [
  { n: 1, name: "Lookalike Finder" },
  { n: 2, name: "Account Researcher" },
  { n: 3, name: "Signal & Fit Ranker" },
  { n: 4, name: "Contact Finder" },
  { n: 5, name: "Outreach Writer" },
] as const;

function Index() {
  const [brief, setBrief] = useState<Brief>(DEFAULT_BRIEF);
  const [statuses, setStatuses] = useState<Record<number, StageStatus>>({
    1: "idle",
    2: "idle",
    3: "idle",
    4: "idle",
    5: "idle",
  });
  const [errors, setErrors] = useState<Record<number, string | null>>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [running, setRunning] = useState(false);

  const setStage = (n: number, s: StageStatus, err?: string) => {
    setStatuses((prev) => ({ ...prev, [n]: s }));
    if (err !== undefined) setErrors((prev) => ({ ...prev, [n]: err }));
  };

  async function runPipeline() {
    setRunning(true);
    setAccounts([]);
    setResearch([]);
    setRanked([]);
    setContacts([]);
    setEmails([]);
    setErrors({});
    setStatuses({ 1: "idle", 2: "idle", 3: "idle", 4: "idle", 5: "idle" });

    try {
      setStage(1, "running");
      const a = await runStage1(brief);
      setAccounts(a);
      setStage(1, "done");

      setStage(2, "running");
      const r = await runStage2(brief, a);
      setResearch(r);
      setStage(2, "done");

      setStage(3, "running");
      const rk = await runStage3(brief, r);
      setRanked(rk);
      setStage(3, "done");

      setStage(4, "running");
      const c = runStage4(brief, rk);
      setContacts(c);
      setStage(4, "done");

      setStage(5, "running");
      const e = await runStage5(brief, r, c);
      setEmails(e);
      setStage(5, "done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const current = Object.entries(statuses).find(([, s]) => s === "running")?.[0];
      if (current) setStage(Number(current), "error", msg);
      console.error(err);
    } finally {
      setRunning(false);
    }
  }

  // Rerun a single stage without cascading. Downstream stages remain as-is
  // until the user regenerates them individually.
  async function regenerate(n: 1 | 2 | 3 | 4 | 5) {
    if (running) return;
    setRunning(true);
    setErrors((prev) => ({ ...prev, [n]: null }));
    try {
      setStage(n, "running");
      if (n === 1) {
        setAccounts(await runStage1(brief));
      } else if (n === 2) {
        if (!accounts.length) throw new Error("Run Stage 1 first.");
        setResearch(await runStage2(brief, accounts));
      } else if (n === 3) {
        if (!research.length) throw new Error("Run Stage 2 first.");
        setRanked(await runStage3(brief, research));
      } else if (n === 4) {
        if (!ranked.length) throw new Error("Run Stage 3 first.");
        setContacts(runStage4(brief, ranked));
      } else {
        if (!research.length || !contacts.length)
          throw new Error("Run Stages 2 & 4 first.");
        setEmails(await runStage5(brief, research, contacts));
      }
      setStage(n, "done");
    } catch (err) {
      setStage(n, "error", err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">Outbound BDR Engine</h1>
          <p className="mt-2 text-sm text-fg-muted">
            One campaign brief → ranked accounts, real contacts, personalized outreach.
          </p>
        </header>

        {/* INPUT PANEL */}
        <section className="mb-8 rounded-lg border border-line bg-panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Campaign brief
          </h2>
          <div className="grid gap-4">
            <Field
              label="Target Vertical"
              value={brief.vertical}
              onChange={(v) => setBrief({ ...brief, vertical: v })}
            />
            <Field
              label="Reference Account"
              value={brief.reference}
              onChange={(v) => setBrief({ ...brief, reference: v })}
            />
            <Field
              label="Goal"
              value={brief.goal}
              onChange={(v) => setBrief({ ...brief, goal: v })}
            />
            <Field
              label="FlytBase Angle"
              value={brief.angle}
              onChange={(v) => setBrief({ ...brief, angle: v })}
            />
          </div>
          <button
            onClick={runPipeline}
            disabled={running}
            className="mt-6 w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-bg transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Running pipeline…" : "Run Pipeline"}
          </button>
        </section>

        {/* PIPELINE PROGRESS */}
        <section className="mb-8 rounded-lg border border-line bg-panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Agent pipeline
          </h2>
          <ol className="grid gap-2 sm:grid-cols-5">
            {STAGES.map((s) => (
              <li
                key={s.n}
                className="rounded-md border border-line px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={statuses[s.n]} />
                  <span className="font-mono text-fg-muted">A{s.n}</span>
                </div>
                <div className="mt-1 font-medium">{s.name}</div>
                <div className="mt-1 text-fg-muted">
                  {statuses[s.n] === "running"
                    ? `Agent ${s.n} running…`
                    : statuses[s.n] === "done"
                      ? "Complete"
                      : statuses[s.n] === "error"
                        ? "Error"
                        : "Idle"}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* RESULTS */}
        <div className="space-y-6">
          {statuses[1] !== "idle" && (
            <StageCard n={1} title="Lookalike Finder" status={statuses[1]} error={errors[1]} onRegenerate={() => regenerate(1)} regenDisabled={running}>
              <div className="grid gap-3 sm:grid-cols-2">
                {accounts.map((a) => (
                  <div key={a.company} className="rounded-md border border-line p-3">
                    <div className="font-semibold">{a.company}</div>
                    <div className="text-xs text-fg-muted">
                      {a.country} · {a.commodity}
                    </div>
                    <p className="mt-2 text-sm">{a.reasoning}</p>
                  </div>
                ))}
              </div>
            </StageCard>
          )}

          {statuses[2] !== "idle" && (
            <StageCard n={2} title="Account Researcher" status={statuses[2]} error={errors[2]} onRegenerate={() => regenerate(2)} regenDisabled={running || !accounts.length}>
              <div className="space-y-3">
                {research.map((r) => (
                  <div key={r.company} className="rounded-md border border-line p-3">
                    <div className="mb-2 font-semibold">{r.company}</div>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {r.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </StageCard>
          )}

          {statuses[3] !== "idle" && (
            <StageCard n={3} title="Signal & Fit Ranker" status={statuses[3]} error={errors[3]} onRegenerate={() => regenerate(3)} regenDisabled={running || !research.length}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase text-fg-muted">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Company</th>
                      <th className="py-2 pr-3">Score</th>
                      <th className="py-2 pr-3">Why now</th>
                      <th className="py-2">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((r, i) => (
                      <tr key={r.company} className="border-b border-line/50">
                        <td className="py-2 pr-3 text-fg-muted">{i + 1}</td>
                        <td className="py-2 pr-3 font-medium">{r.company}</td>
                        <td className="py-2 pr-3 font-mono text-accent">{r.score}</td>
                        <td className="py-2 pr-3">{r.why_now}</td>
                        <td className="py-2 text-fg-muted">{r.signal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StageCard>
          )}

          {statuses[4] !== "idle" && (
            <StageCard n={4} title="Contact Finder" status={statuses[4]} error={errors[4]} onRegenerate={() => regenerate(4)} regenDisabled={running || !ranked.length}>
              <div className="space-y-4">
                {groupBy(contacts, (c) => c.company).map(([company, list]) => (
                  <div key={company} className="rounded-md border border-line p-3">
                    <div className="mb-2 font-semibold">{company}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {list.map((c, i) => (
                        <div
                          key={i}
                          className="rounded border border-line/70 p-2 text-sm"
                        >
                          <div className="text-xs text-fg-muted">{c.persona}</div>
                          <div className="font-medium">
                            {c.verified && c.name ? (
                              c.name
                            ) : (
                              <span className="text-accent">verify-live</span>
                            )}
                          </div>
                          <a
                            href={c.xray_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs text-accent underline underline-offset-2 hover:opacity-80"
                          >
                            Find on LinkedIn →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </StageCard>
          )}

          {statuses[5] !== "idle" && (
            <StageCard n={5} title="Outreach Writer" status={statuses[5]} error={errors[5]} onRegenerate={() => regenerate(5)} regenDisabled={running || !research.length || !contacts.length}>
              <div className="space-y-3">
                {emails.map((e, i) => (
                  <EmailCard key={i} email={e} />
                ))}
              </div>
            </StageCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-fg-muted">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-md border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-accent"
      />
    </label>
  );
}

function StatusDot({ status }: { status: StageStatus }) {
  const cls =
    status === "done"
      ? "bg-accent"
      : status === "running"
        ? "bg-accent animate-pulse"
        : status === "error"
          ? "bg-red-500"
          : "bg-line";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}

function StageCard({
  n,
  title,
  status,
  error,
  children,
  onRegenerate,
  regenDisabled,
}: {
  n: number;
  title: string;
  status: StageStatus;
  error?: string | null;
  children: React.ReactNode;
  onRegenerate?: () => void;
  regenDisabled?: boolean;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel p-6">
      <div className="mb-4 flex items-center gap-3">
        <StatusDot status={status} />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
          Stage {n} · {title}
        </h3>
        {status === "running" && (
          <span className="text-xs text-fg-muted">Agent {n} running…</span>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={regenDisabled}
            className="ml-auto rounded-md border border-line px-3 py-1 text-xs hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "running" ? "Running…" : "Regenerate"}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : status === "running" && !hasChildren(children) ? (
        <p className="text-sm text-fg-muted">Thinking…</p>
      ) : (
        children
      )}
    </section>
  );
}

function hasChildren(_c: React.ReactNode) {
  return true;
}

function EmailCard({ email }: { email: Email }) {
  const [copied, setCopied] = useState(false);
  const full = `Subject: ${email.subject}\n\n${email.body}`;
  return (
    <div className="rounded-md border border-line p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs text-fg-muted">
            {email.company} · {email.persona}
          </div>
          <div className="font-medium">To: {email.to_label}</div>
        </div>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(full);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-md border border-line px-3 py-1 text-xs hover:border-accent hover:text-accent"
        >
          {copied ? "Copied ✓" : "Copy email"}
        </button>
      </div>
      <div className="mt-2 text-sm">
        <div className="mb-2 font-semibold">Subject: {email.subject}</div>
        <pre className="whitespace-pre-wrap font-sans text-sm text-fg/90">
          {email.body}
        </pre>
      </div>
    </div>
  );
}

function groupBy<T, K extends string>(arr: T[], key: (t: T) => K): [K, T[]][] {
  const m = new Map<K, T[]>();
  for (const item of arr) {
    const k = key(item);
    const list = m.get(k) ?? [];
    list.push(item);
    m.set(k, list);
  }
  return Array.from(m.entries());
}
