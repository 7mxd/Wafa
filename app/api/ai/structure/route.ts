import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// The light, non-blocking AI touch: turn a borrower's free text into structured
// loan terms. We call Claude (Haiku 4.5) through OpenRouter's OpenAI-compatible
// gateway. This route ALWAYS returns HTTP 200 — on any failure it returns
// { ok: false } so a slow/missing/erroring model never blocks the request flow
// (the UI falls back to the plain manual form).

const MODEL = "anthropic/claude-haiku-4.5";

const StructuredLoan = z.object({
  amount: z.number().positive(),
  currency: z.literal("AED"),
  reason: z.string().min(1),
  proposed_due_date: z.string(), // "" or YYYY-MM-DD
  summary: z.string().min(1),
});

function extractJson(text: string): unknown | null {
  const candidates = [text];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidates.push(fence[1]);
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) candidates.push(brace[0]);
  for (const c of candidates) {
    try {
      return JSON.parse(c.trim());
    } catch {
      // try the next candidate
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const text: unknown = body?.text;
    const today: string =
      typeof body?.today === "string"
        ? body.today
        : new Date().toISOString().slice(0, 10);

    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ ok: false });
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ ok: false });
    }

    const system =
      "You convert a borrower's free-text request for an interest-free loan between friends into structured JSON. " +
      `Today's date is ${today}. Resolve relative dates (\"next payday\", \"in two weeks\", \"the 1st\") to an absolute YYYY-MM-DD. ` +
      "Currency is always AED. If no due date is mentioned, use an empty string for proposed_due_date. " +
      "The summary must be one short line, plain language, and must explicitly state the loan is interest-free (qard hasan) with no markup. " +
      'Respond with ONLY a JSON object, no prose and no markdown, with exactly these keys: ' +
      '{"amount": number, "currency": "AED", "reason": string, "proposed_due_date": string, "summary": string}.';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "Wafa",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          messages: [
            { role: "system", content: system },
            { role: "user", content: text.slice(0, 2000) },
          ],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) return NextResponse.json({ ok: false });

    const json = await res.json();
    const content: unknown = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return NextResponse.json({ ok: false });

    const obj = extractJson(content);
    if (obj === null) return NextResponse.json({ ok: false });

    const parsed = StructuredLoan.safeParse(obj);
    if (!parsed.success) return NextResponse.json({ ok: false });

    return NextResponse.json({ ok: true, data: parsed.data });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
