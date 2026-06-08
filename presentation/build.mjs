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

// Make sure the web fonts have actually loaded before we print, otherwise the
// first render can fall back to system fonts.
await page.evaluate(async () => {
  await document.fonts.ready;
});
await page.waitForTimeout(400);

await page.pdf({
  path: outPath,
  width: "1280px",
  height: "720px",
  printBackground: true,
  margin: { top: "0", bottom: "0", left: "0", right: "0" },
});

await browser.close();
console.log("wrote", outPath);
