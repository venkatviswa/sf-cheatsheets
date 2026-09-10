# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A generator for **Salesforce-branded cheatsheets**: Markdown source files are
compiled into beautiful, high-resolution PNG/JPG reference posters. The whole
project is a small Node.js build pipeline plus Markdown content.

## Commands

```bash
npm install                          # install deps (one-time)
npm run build                        # render all content/*.md -> dist/*.png + *.pdf (+ .html)
npm run build:all                    # PNG + JPG + PDF
npm run build:jpg                    # JPG only
npm run build:pdf                    # print-ready single-page PDF only
npm run build:html                   # HTML only — fast preview, skips Chrome
node src/build.mjs <slug>            # build a single sheet, e.g. `soql-sosl`
npm run clean                        # rm -rf dist
```

Format sets live in `FORMAT_SETS` in `build.mjs` (`default` = png+pdf, `all`,
`both`); any other `--format` value is treated as a single format. The PDF path
uses `page.pdf()` sized to the measured `.sheet` box for a single-page poster;
PNG/JPG use a full-page screenshot at 2× scale.

There is no test suite or linter. Verify changes by rebuilding and **visually
inspecting the rendered PNG in `dist/`** (open/Read the image), not just the HTML.

## Architecture

Pipeline: `content/<slug>.md` → HTML (branded card grid) → screenshot → `dist/<slug>.{png,jpg,html}`

- **`src/build.mjs`** — the entire build. It: reads front-matter with
  `gray-matter`; splits each Markdown body into cards by top-level `##` headings
  (fence-aware, so `##` inside code blocks is ignored); renders each card with
  `markdown-it` (+ `markdown-it-highlightjs`, `markdown-it-attrs`); assembles the
  page via `pageHTML()`; then drives headless Chrome through `puppeteer-core` to
  take a full-page screenshot at `deviceScaleFactor: 2`.
- **`src/theme.css`** — all visual design. Salesforce brand tokens and
  per-cheatsheet accent themes live in `:root` / `body[data-accent="…"]`. Cards
  are laid out with **CSS multi-column** (`.grid[data-cols]`), not flexbox/grid,
  so cards flow and balance automatically. The CSS is inlined into every page at
  build time.
- **`content/*.md`** — one cheatsheet per file; the source of truth.

### Key conventions and gotchas

- **`##` = one card.** `###` = a subhead within a card. Content before the first
  `##` is dropped from the poster. This split happens in `splitCards()`.
- **Front-matter drives layout**: `title`, `subtitle`, `category` (top-right
  chip), `accent`, `columns` (1–4), `footer`, `updated`. Column count maps to a
  fixed render width in `WIDTH_BY_COLS` — widening columns means editing that map.
- **Accent themes** are a closed set defined in `theme.css`
  (`electric`, `cloud`, `indigo`, `teal`, `violet`, `orange`). Adding a color
  means adding a `body[data-accent="…"]` rule, not inline styles.
- **Salesforce fonts are proprietary** (Avant Garde Demi SFDC, Salesforce Sans)
  and not installed; the theme intentionally falls back to Futura/Helvetica Neue.
  Do not add remote web-font fetches — rendering must work offline.
- **Apex/SOQL aren't native highlight.js grammars.** `build.mjs` aliases
  `apex`→`java` and `soql`/`sosl`→`sql`. Add new language aliases there, next to
  the existing `hljs.registerAliases` calls, rather than switching highlighters.
- **Chrome discovery**: `findChrome()` checks `CHROME_PATH` then common macOS
  paths. Set `CHROME_PATH` when Chrome/Edge/Chromium lives elsewhere.
- Column **balance** is best when a sheet has many small cards rather than a few
  tall ones; if one column runs long, split large `##` sections.

## Brand rules (from the salesforce-html-presentation skill)

Stay on the official palette — do not introduce off-brand colors. Core tokens:
Cloud Blue 90 `#CFE9FE` (background), Cloud Blue 68 `#00B3FF` (logo/accent),
Electric Blue 50 `#066AFE`, Electric Blue 20 `#002775` (default type color).
Keep body text ≥ 14px and maintain WCAG AA contrast. These are already encoded in
`theme.css`; preserve them when editing styles.

Note: unlike that skill (which forbids flattening slides to images), this project
**intentionally** outputs images — that is the product.
