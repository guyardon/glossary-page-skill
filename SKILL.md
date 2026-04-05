---
name: glossary-page
description: Use when creating an interactive glossary, index of terms, or taxonomy page for a documentation or course notes site. Covers data schema, three-column drill-down UI with pill buttons, diagram lightbox, dark/light theme support, Pagefind indexing, and navigation integration.
---

# Glossary Page Creation

## Overview

An interactive glossary page with a three-column drill-down UI: **categories** (left) -> **terms** (middle) -> **detail card** (right). All data lives in a single JSON file validated at build time. No framework plugins needed — pure Astro + vanilla JS.

## Architecture

### Data Layer

Single JSON file (`src/data/glossary.json`) with this schema:

```json
[
  {
    "category": "Category Name",
    "icon": "emoji",
    "terms": [
      {
        "term": "Term Name",
        "description": "1-3 sentence explanation.",
        "diagram": "diagram-base-name",
        "notes": [
          { "slug": "path/to/note-id", "anchor": "#optional-heading" }
        ]
      }
    ]
  }
]
```

**Fields:**
- `category` + `icon`: grouping label with emoji
- `term`: display name
- `description`: 1-3 sentences (required)
- `diagram` (optional): base filename from `public/images/diagrams/`. SVG by default, append `.png` for PNG files (e.g. `"aws-lakehouse.png"`)
- `notes[].slug`: must match a content collection entry ID exactly
- `notes[].anchor` (optional): heading anchor within the note

### Build-Time Processing (Astro Frontmatter)

1. **Import** JSON data + content collection
2. **Validate** every slug against real notes — throw build error on mismatch
3. **Sort** terms alphabetically within each category
4. **Resolve** slugs to titles and full hrefs for client-side use via `define:vars`

See `references/glossary-frontmatter.astro` for the complete frontmatter pattern.

### Three-Column Layout

```
┌─────────────┬──────────────────┬──────────────────┐
│ Categories  │  Term Pills      │  Detail Card     │
│ (33% width) │  (flex: 1)       │  (flex: 1)       │
│ sticky      │                  │  sticky          │
│ flex-wrap   │  appears when    │  appears when    │
│ pills       │  category picked │  term picked     │
└─────────────┴──────────────────┴──────────────────┘
```

- Categories and detail card are `position: sticky; top: 1rem`
- On mobile (<768px): collapses to single column
- Page max-width: `1200px` (wider than typical content pages to fit 3 columns)

### Pill Button Style (Shared Across All Levels)

All three levels use identical `.pill` styling:

```css
.pill {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--fg-muted);
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
}
.pill:hover { color: var(--accent); border-color: var(--accent); }
.pill.active {
  color: var(--accent);
  border-color: var(--accent);
  background-color: color-mix(in srgb, var(--accent) 10%, transparent);
}
```

### Interaction Model (Vanilla JS)

**Toggle behavior:** Clicking any active pill deactivates it and hides its child section. Switching categories resets term/detail sections.

**State:** Two variables track active selections: `activeCategory` (index or `"all"`) and `activeTerm` (composite key `"ci-ti"`).

**"Show All" button:** Merges all terms across categories, sorted alphabetically.

**DOM creation:** All term pills and detail card content are created via `document.createElement()` — never `innerHTML`. This avoids XSS concerns with security linters.

See `references/glossary-interactions.js` for the complete interaction logic.

### Detail Card Structure

When a term is clicked, the detail card renders:

1. **Term name** — `<h3>` with serif font
2. **Description** — 1-3 sentences in muted text
3. **Diagram** (if present) — light/dark variants with expand button
4. **"See more at:"** — label + note link pills

### Diagram Lightbox

- Uses native `<dialog>` element for backdrop, escape key, and focus trapping
- Expand button (↗↙ arrows SVG) appears on hover in top-right of diagram
- Lightbox has card background, 16px border-radius, blur(12px) backdrop
- Light/dark diagram switching works inside the lightbox too

### Pagefind Indexing

Since the visible content is JS-rendered, add a hidden `sr-only` div with `data-pagefind-body` containing all categories and term names:

```html
<div class="sr-only" data-pagefind-body>
  {data.map((cat) => (
    <div>
      <h2>{cat.icon} {cat.category}</h2>
      {cat.terms.map((term) => (
        <p data-pagefind-weight="2">{term.term}</p>
      ))}
    </div>
  ))}
</div>
```

### Navigation Integration

- **Homepage:** Pill-styled link in the topbar (left side, replacing logo)
- **Docs sidebar:** Link below the search bar
- **Glossary page:** Logo in topbar links back home

### CSS Scoping Rule

**CRITICAL:** Styles for JS-created elements MUST use `<style is:global>`. Astro's scoped `<style>` adds data attributes that dynamically created elements don't have, so scoped styles won't apply.

Split styles into two blocks:
- `<style is:global>` — `.pill`, `.detail-card`, `.detail-*`, `.lightbox`, `.hidden`
- `<style>` (scoped) — `.glossary-page`, `.glossary-layout`, `.glossary-hero`, `.glossary-footer`

## Populating the Glossary Data

### Auto-Extraction Workflow

1. Scan all content files to extract key terms, concepts, and technologies
2. Categorize terms into 10-15 groups (keep categories broad enough to be useful)
3. Map each term to the note slug(s) where it's discussed
4. Write 1-3 sentence descriptions based on how the term is explained in context
5. Map relevant diagrams to terms by matching diagram filenames to term topics
6. Validate all slugs pass build-time check

### Diagram Mapping

- SVG diagrams: use base name without extension (e.g. `"star-schema"`)
- PNG diagrams: include extension (e.g. `"aws-lakehouse.png"`)
- Each diagram must have light and dark variants: `name.svg` + `name-dark.svg`
- Only map diagrams that are directly relevant — many terms won't have one

## Quick Reference

| Component | CSS Class | Notes |
|-----------|-----------|-------|
| Page container | `.glossary-page` | max-width: 1200px |
| Three-column wrapper | `.glossary-layout` | flex, gap: 1rem |
| Category nav | `.category-nav` | 33% width, sticky, flex-wrap |
| Terms section | `.terms-section` | flex: 1, hidden by default |
| Detail section | `.detail-section` | flex: 1, sticky, hidden by default |
| All interactive buttons | `.pill` | **is:global**, shared style |
| Active state | `.pill.active` | accent color + tinted bg |
| Detail card | `.detail-card` | bg-card, border, 14px radius |
| Diagram expand | `.diagram-expand` | absolute top-right, opacity 0 -> 1 on hover |
| Lightbox | `.lightbox` (dialog) | fixed center, blur backdrop |
| Pagefind data | `.sr-only[data-pagefind-body]` | hidden, contains all terms for search |
