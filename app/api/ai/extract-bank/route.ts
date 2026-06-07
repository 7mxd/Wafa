import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// Vision counterpart to /api/ai/structure: read a photo of a bank document and
// extract payment details. Same Claude (Haiku 4.5) model via OpenRouter, and the
// same non-blocking contract — this route ALWAYS returns HTTP 200, with
// { ok: false } on any failure, so a slow/missing/erroring model never blocks the
// form (the user just fills it in manually). The image is used only for this
// call and is never stored.

const MODEL = "anthropic/claude-haiku-4.5";

const Extracted = z.object({
  account_holder_name: z.string(),
  iban: z.string(),
  bank_name: z.string(),
  account_number: z.string(),
  swift_bic: z.string(),
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
    const image: unknown = body?.image;

    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return NextResponse.json({ ok: false });
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ ok: false });
    }

    const system =
      "You read a photo of a bank document (an IBAN certificate, bank card, cheque, or statement) and extract the account's payment details into JSON. " +
      "Respond with ONLY a JSON object, no prose and no markdown, with exactly these keys: " +
      '{"account_holder_name": string, "iban": string, "bank_name": string, "account_number": string, "swift_bic": string}. ' +
      "Normalize the IBAN to uppercase with no spaces. Do NOT guess or invent values: if a field is not clearly legible in the image, use an empty string for it.";

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
            {
              role: "user",
              content: [
                { type: "text", text: "Extract the payment details from this image." },
                { type: "image_url", image_url: { url: image } },
              ],
            },
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

    const parsed = Extracted.safeParse(obj);
    if (!parsed.success) return NextResponse.json({ ok: false });

    return NextResponse.json({ ok: true, data: parsed.data });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
