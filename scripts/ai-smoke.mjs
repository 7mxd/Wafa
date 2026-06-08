// Verifies the OpenRouter key + model slug, and that Claude structures sample
// loan requests into the expected JSON. Run: node scripts/ai-smoke.mjs
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const KEY = env.OPENROUTER_API_KEY;
const MODEL = "anthropic/claude-haiku-4.5";
const TODAY = "2026-06-07";

const models = await (
  await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${KEY}` },
  })
).json();
const haiku = (models.data ?? []).map((m) => m.id).filter((id) => /haiku/i.test(id));
console.log("Haiku slugs on OpenRouter:", haiku.join(", ") || "(none)");
console.log(`Target '${MODEL}' present:`, haiku.includes(MODEL));

const system =
  "You convert a borrower's free-text request for an interest-free loan between friends into structured JSON. " +
  `Today's date is ${TODAY}. Resolve relative dates to an absolute YYYY-MM-DD. ` +
  "Currency is always AED. If no due date is mentioned, use an empty string for proposed_due_date. " +
  "The summary must be one short line in plain language describing the amount, what it is for, and the timeframe. Do NOT restate that the loan is interest-free, qard hasan, or free of markup; the interface conveys that separately. " +
  'Respond with ONLY a JSON object with keys: {"amount": number, "currency": "AED", "reason": string, "proposed_due_date": string, "summary": string}.';

async function structure(text) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "Wafa" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        { role: "system", content: system },
        { role: "user", content: text },
      ],
    }),
  });
  if (!r.ok) return `ERR ${r.status}: ${(await r.text()).slice(0, 200)}`;
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? "(no content)";
}

for (const t of [
  "need 400 for a car repair, pay you back in two weeks",
  "can you lend me 1200 for flights home, I'll sort it next payday",
]) {
  console.log(`\nINPUT:  ${t}`);
  console.log(`OUTPUT: ${await structure(t)}`);
}
