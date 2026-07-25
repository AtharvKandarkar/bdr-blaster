import { createFileRoute } from "@tanstack/react-router";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

type StageBody = {
  system: string;
  user: string;
};

export const Route = createFileRoute("/api/stage")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { system, user } = (await request.json()) as StageBody;

        const res = await fetch(GATEWAY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          return new Response(text, { status: res.status });
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content ?? "{}";
        return new Response(content, {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});