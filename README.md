# glossary-page-skill

Claude Code skill for creating interactive glossary pages with a two-column drill-down UI in Astro documentation sites.

## What it does

Guides creation of a category → term → detail card glossary interface with:

- **Two-column layout** — categories (left, 40%) → terms carousel (right, 60%) with smooth sliding pagination
- **Modal overlay detail cards** — technology logos as titles, diagrams with lightbox, related terms navigation, shuffle
- **Single JSON data source** — build-time validated against Astro content collections
- **Technology logo integration** — 67 tech terms show branded SVG logos (light/dark) instead of text titles
- **Carousel pagination** — terms rendered in a horizontal track with CSS `translateX` animation, container queries for sizing
- **Dark/light theme** — full theme support for all elements including logos, diagrams, and lightbox
- **Pure Astro + vanilla JS** — no framework dependencies, Pagefind-indexed for search
- **Responsive** — desktop uses fixed-height carousel pagination, mobile scrolls naturally

## Installation

### Option 1: Git clone (recommended)

```bash
cd ~/.claude/skills
git clone https://github.com/guyardon/glossary-page-skill.git glossary-page
```

This lets you `git pull` for updates.

### Option 2: Manual copy

Copy this entire directory to `~/.claude/skills/glossary-page/`.

### Verification

After installation, the skill should appear in Claude Code's skill list. Invoke it with `/glossary-page` or it triggers automatically when creating interactive glossary, index of terms, or taxonomy pages.

## File Structure

```
glossary-page/
├── SKILL.md                                — Full skill instructions (read by Claude Code)
├── gotchas.md                              — 31 documented pitfalls from implementation
├── README.md                               — This file
└── references/
    ├── glossary-frontmatter.astro          — Astro page frontmatter template (build-time validation)
    ├── glossary-interactions.js            — Vanilla JS interaction logic (carousel, pagination, modals)
    └── glossary-styles.css                 — Complete CSS with global/scoped/:global() separation
```

### What each file covers

| File | Purpose |
|------|---------|
| **SKILL.md** | Architecture, data schema, layout, carousel pagination, logo titles, CSS scoping rules, detail card, lightbox, Pagefind indexing, navigation |
| **gotchas.md** | Every mistake made during implementation — Astro scoping, container queries, measurement timing, carousel sizing, modal positioning, mobile overflow |
| **references/glossary-frontmatter.astro** | Build-time slug validation and data resolution pattern |
| **references/glossary-interactions.js** | Category/term selection, carousel scroll, modal open/close, shuffle, related term navigation |
| **references/glossary-styles.css** | Pill buttons, carousel viewport/track/pills with `:global()`, detail card, logo titles, lightbox, responsive breakpoints |

## Key Concepts

### Astro CSS Scoping

The biggest gotcha in this skill. Astro scoped styles add `[data-astro-cid-xxx]` to selectors — dynamically created elements don't get this attribute. Use `:global()` within a scoped parent for carousel elements:

```css
.terms-viewport :global(.terms-pills) { width: 100cqi; }
```

### Carousel Architecture

Terms use a viewport → track → pages structure. Each page is `width: 100cqi` (container query units). The track translates via `transform: translateX()` for smooth sliding. Page breaks are computed by measuring actual row counts at the paginated container width.

### Logo Titles

Technology terms show branded SVG logos (64px height) instead of text `<h3>` titles. The `TERM_LOGO_MAP` in `src/lib/glossary-detail.ts` maps term names to logo file slugs. PNG logos use `filter: brightness(1.6)` for dark mode.
