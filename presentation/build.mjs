// Renders presentation/deck.html to a slide-per-page PDF with headless Chromium
// (the same Playwright engine used for screenshots). Each .slide is exactly
// 1280x720, so the deck prints one slide per landscape page.
//   node presentation/build.mjs
import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = import.meta.dirname;
const htmlPath = path.join(dir, "deck.html");
const outPath = path.join(dir, "..", "Wafa-Presentation.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });

// Make sure every face has actually loaded and parsed before we print, so the
// PDF embeds the real fonts instead of falling back to a system font.
await page.evaluate(async () => {
  const faces = [
    '400 16px "Hanken Grotesk"', '500 16px "Hanken Grotesk"', '600 16px "Hanken Grotesk"',
    '700 16px "Hanken Grotesk"', '800 16px "Hanken Grotesk"',
    '400 16px "Geist Mono"', '500 16px "Geist Mono"', '600 16px "Geist Mono"',
    '500 16px "IBM Plex Sans Arabic"', '600 16px "IBM Plex Sans Arabic"', '700 16px "IBM Plex Sans Arabic"',
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f, "وفاء Wafa 0123")));
  await document.fonts.ready;
});
await page.waitForTimeout(200);

await page.pdf({
  path: outPath,
  width: "1280px",
  height: "720px",
  printBackground: true,
  margin: { top: "0", bottom: "0", left: "0", right: "0" },
});

await browser.close();
console.log("wrote", outPath);
