# glossary-page-skill

Claude Code skill for creating interactive glossary pages with a three-column drill-down UI in Astro documentation sites.

## What it does

- Guides creation of category → term → detail card drill-down interfaces
- Single JSON data file validated at build time via Astro frontmatter
- Features pill-button design, diagram lightbox, and dark/light theme support
- Pure Astro + vanilla JS — no framework dependencies
- Pagefind-indexed for search, responsive layout (collapses on mobile)

## Installation

Copy this directory to `~/.claude/skills/glossary-page/`

## File Structure

```
glossary-page/
├── SKILL.md                                — Full skill instructions (read by Claude Code)
├── gotchas.md                              — 11 documented pitfalls from implementation
├── README.md                               — This file
└── references/
    ├── glossary-frontmatter.astro          — Astro page frontmatter template (build-time validation)
    ├── glossary-interactions.js            — Vanilla JS interaction logic (230+ lines)
    └── glossary-styles.css                 — Complete CSS with global/scoped separation
```

## Usage

Invoke with `/glossary-page` in Claude Code, or it triggers automatically when creating interactive glossary, index of terms, or taxonomy pages.
