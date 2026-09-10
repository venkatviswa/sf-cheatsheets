#!/usr/bin/env node
/**
 * Salesforce Cheatsheet builder.
 *
 * Pipeline:  content/<name>.md  ->  Salesforce-branded HTML  ->  PNG / JPG
 *
 * Each `##` section in a Markdown file becomes one card in a balanced
 * multi-column poster. Front-matter controls title, subtitle, category,
 * accent color and column count.
 *
 * Usage:
 *   node src/build.mjs                 # build every content/*.md to PNG
 *   node src/build.mjs --format jpg    # emit JPG instead
 *   node src/build.mjs --format both   # PNG + JPG
 *   node src/build.mjs --format html   # HTML only (fast preview, no Chrome)
 *   node src/build.mjs soql-sosl       # build a single sheet by slug
 */

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import mdAttrs from "markdown-it-attrs";
import mdHighlight from "markdown-it-highlightjs";
import hljs from "highlight.js";

// Salesforce languages aren't built into highlight.js — map them to the
// closest bundled grammar so Apex / SOQL fences still get colorized.
hljs.registerAliases(["apex", "cls"], { languageName: "java" });
hljs.registerAliases(["soql", "sosl"], { languageName: "sql" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const DIST_DIR = path.join(ROOT, "dist");
const THEME_PATH = path.join(__dirname, "theme.css");

// ---- CLI args ------------------------------------------------------------
const args = process.argv.slice(2);
const formatArg = (() => {
  const i = args.indexOf("--format");
  return i !== -1 ? args[i + 1] : "default";
})();
const slugFilter = args.find((a) => !a.startsWith("--") && a !== formatArg);
// Named format sets; anything else is treated as a single format.
const FORMAT_SETS = {
  default: ["png", "pdf"], // shareable image + printable poster
  all: ["png", "jpg", "pdf"],
  both: ["png", "jpg"],
};
const FORMATS = FORMAT_SETS[formatArg] || [formatArg]; // png | jpg | pdf | html

// Column count -> render width (px). Balanced for legibility at 2x scale.
const WIDTH_BY_COLS = { 1: 720, 2: 1080, 3: 1440, 4: 1860 };

// ---- Markdown -> HTML ----------------------------------------------------
const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
  .use(mdAttrs)
  .use(mdHighlight, { hljs, inline: true });

/** Split a markdown body into `## `-delimited sections (cards). */
function splitCards(body) {
  const lines = body.split("\n");
  const cards = [];
  let current = null;
  let inFence = false;

  for (const line of lines) {
    if (/^(```|~~~)/.test(line.trim())) inFence = !inFence;
    const isCardHeading = !inFence && /^##\s+/.test(line);
    if (isCardHeading) {
      if (current) cards.push(current);
      current = line + "\n";
    } else if (current !== null) {
      current += line + "\n";
    } else {
      // preamble before the first `##` is ignored for the grid
    }
  }
  if (current) cards.push(current);
  return cards;
}

function renderCard(sectionMd) {
  let html = md.render(sectionMd);
  // decorate the card's h2 with an accent dot
  html = html.replace(/<h2([^>]*)>/, '<h2$1><span class="dot"></span>');
  return `<section class="card">${html}</section>`;
}

const SF_CLOUD_SVG = `<svg class="cloud" viewBox="0 0 100 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Salesforce cloud"><path fill="#00B3FF" d="M41 14c4-6 11-10 19-10 10 0 19 6 23 15 2-1 5-1 7-1 11 0 20 9 20 20s-9 20-20 20H27C16 58 7 49 7 38c0-9 6-17 15-19-1-8 6-15 14-15 2 0 4 0 5 1z"/></svg>`;

function pageHTML({ data, cardsHtml, theme }) {
  const cols = String(data.columns || 3);
  const width = WIDTH_BY_COLS[cols] || WIDTH_BY_COLS[3];
  const accent = data.accent || "electric";
  const updated = data.updated || new Date().toISOString().slice(0, 10);
  const category = data.category ? `<div class="category-chip">${data.category}</div>` : "";
  const subtitle = data.subtitle ? `<p class="sheet-subtitle">${data.subtitle}</p>` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${data.title || "Salesforce Cheatsheet"}</title>
<style>${theme}
.sheet { --sheet-width: ${width}px; }
</style>
</head>
<body data-accent="${accent}">
  <div class="sheet">
    <header class="sheet-header">
      <div>
        <div class="brand">${SF_CLOUD_SVG}<span class="kicker">Salesforce Cheatsheet</span></div>
        <h1 class="sheet-title">${data.title || "Untitled"}</h1>
        ${subtitle}
      </div>
      ${category}
    </header>
    <div class="grid" data-cols="${cols}">
      ${cardsHtml}
    </div>
    <footer class="sheet-footer">
      <span>${data.footer || "Salesforce ecosystem quick reference"}</span>
      <span class="updated">Updated ${updated}</span>
    </footer>
  </div>
</body>
</html>`;
}

// ---- Chrome discovery ----------------------------------------------------
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

// ---- Main ----------------------------------------------------------------
async function main() {
  const theme = await readFile(THEME_PATH, "utf8");
  await mkdir(DIST_DIR, { recursive: true });

  let files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md"));
  if (slugFilter) files = files.filter((f) => f.replace(/\.md$/, "") === slugFilter);
  if (files.length === 0) {
    console.error(slugFilter ? `No content file for "${slugFilter}".` : "No .md files in content/.");
    process.exit(1);
  }

  // Build HTML for every sheet first.
  const built = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = await readFile(path.join(CONTENT_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const cardsHtml = splitCards(content).map(renderCard).join("\n");
    const html = pageHTML({ data, cardsHtml, theme });
    const htmlPath = path.join(DIST_DIR, `${slug}.html`);
    await writeFile(htmlPath, html);
    built.push({ slug, html, htmlPath, data });
    console.log(`✓ html   dist/${slug}.html`);
  }

  const renderFormats = FORMATS.filter((f) => ["png", "jpg", "pdf"].includes(f));
  if (renderFormats.length === 0) return; // html-only mode

  const chromePath = findChrome();
  if (!chromePath) {
    console.error("Could not find Chrome. Set CHROME_PATH to a Chromium-based browser binary.");
    process.exit(1);
  }

  const { default: puppeteer } = await import("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--force-color-profile=srgb", "--hide-scrollbars"],
  });

  try {
    for (const { slug, htmlPath } of built) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
      await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
      await page.evaluateHandle("document.fonts.ready");
      await page.emulateMediaType("screen"); // keep screen styles for PDF too

      for (const fmt of renderFormats) {
        const out = path.join(DIST_DIR, `${slug}.${fmt}`);
        if (fmt === "pdf") {
          // Single-page PDF sized exactly to the poster (no A4 pagination).
          const { w, h } = await page.evaluate(() => {
            const el = document.querySelector(".sheet");
            return { w: Math.ceil(el.scrollWidth), h: Math.ceil(el.scrollHeight) };
          });
          await page.pdf({
            path: out,
            printBackground: true,
            width: `${w}px`,
            height: `${h}px`,
            pageRanges: "1",
            margin: { top: "0", right: "0", bottom: "0", left: "0" },
          });
        } else {
          await page.screenshot({
            path: out,
            type: fmt === "jpg" ? "jpeg" : "png",
            quality: fmt === "jpg" ? 92 : undefined,
            fullPage: true,
          });
        }
        console.log(`✓ ${fmt.padEnd(4)}  dist/${slug}.${fmt}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
