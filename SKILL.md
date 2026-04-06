---
name: glossary-page
description: Use when creating an interactive glossary, index of terms, or taxonomy page for a documentation or course notes site. Covers data schema, two-column drill-down UI with pill buttons, modal overlay detail view, pagination, diagram lightbox, dark/light theme support, shuffle, related terms, Pagefind indexing, and navigation integration.
---

# Glossary Page Creation

## Overview

An interactive glossary page with a two-column drill-down UI: **categories** (left, 40%) -> **terms** (right, 60%). Clicking a term opens a **modal overlay** with the detail card. All data lives in a single JSON file validated at build time. No framework plugins needed — pure Astro + vanilla JS.

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
        "relatedTerms": ["Other Term", "Another Term"],
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
- `relatedTerms` (optional): array of exact term name strings for cross-navigation
- `notes[].slug`: must match a content collection entry ID exactly
- `notes[].anchor` (optional): heading anchor within the note

### Build-Time Processing (Astro Frontmatter)

1. **Import** JSON data + content collection
2. **Validate** every slug against real notes — throw build error on mismatch
3. **Sort** terms alphabetically within each category
4. **Resolve** slugs to titles and full hrefs for client-side use via `define:vars`

See `references/glossary-frontmatter.astro` for the complete frontmatter pattern.

### Two-Column Layout (Desktop)

```
┌──────────────────┬────────────────────────────┐
│  Categories      │  Term Pills                │
│  (40% width)     │  (flex: 1, 60%)            │
│  flex-wrap       │  paginated (7 rows max)    │
│  paginated       │  ◀ arrows ▶ when needed    │
│  ◀ arrows ▶      │  centered pills            │
│  centered pills  │                            │
└──────────────────┴────────────────────────────┘
            Detail = modal overlay (both desktop & mobile)
```

- **Page is non-scrollable on desktop** — `height: 100vh; overflow: hidden` on `.glossary-page`
- Both columns paginate independently with max 7 rows
- Pagination arrows appear only when content exceeds 7 rows
- Detail always opens as a modal overlay (no inline detail section)
- Page max-width: `1200px`

### Pagination System

Both categories and terms use the same pagination approach:

1. **Check first:** Render all items, count rows. If ≤ 7 rows → no pagination, no arrows, no padding
2. **Build pages:** If > 7 rows, add items one by one, measuring `offsetTop` to count rows. When row count exceeds `MAX_ROWS`, start a new page. Store page break indices.
3. **Render page:** Show only items for current page, toggle arrow visibility
4. **Arrows:** Circular buttons (`border-radius: 50%`), `position: absolute`, fixed at `top: 6.5rem` (row 4 center). Left arrow at `left: 0`, right at `right: 0`
5. **Conditional padding:** `.paginated` class adds `padding: 0 2.5rem` to make room for arrows. Only applied when pagination is active.

**Critical:** The section must be visible (not `display: none`) before measuring DOM layout. `offsetTop` returns 0 for hidden elements, causing all items to appear on "1 row".

```js
// Show section FIRST, then measure
termsSection.classList.remove("hidden");
if (!isMobile()) {
  buildPages();
  renderTermsPage();
}
```

**Row counting:**
```js
function countRows() {
  var pills = container.children;
  if (pills.length === 0) return 0;
  var rows = 1, prevTop = pills[0].offsetTop;
  for (var i = 1; i < pills.length; i++) {
    if (pills[i].offsetTop > prevTop) { rows++; prevTop = pills[i].offsetTop; }
  }
  return rows;
}
```

### Default State

- **"Show All" is the first pill** (before category pills) and is **auto-selected on page load**
- Achieved by programmatically clicking the "Show All" button at the end of the init script:
  ```js
  const showAllBtn = document.querySelector('.category-pill[data-category="all"]');
  if (showAllBtn) showAllBtn.click();
  ```

### Category-Terms Divider (Mobile Only)

- A `border-bottom` divider appears between the category pills and terms section only when a category is selected
- Controlled via `.category-nav.has-selection` class toggled in JS
- The divider is removed when the category is deselected

### Pill Button Style (Shared Across All Levels)

All levels use identical `.pill` styling:

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

Pills are **centered** within their container (`justify-content: center`).

### Interaction Model (Vanilla JS)

**Toggle behavior:** Clicking any active pill deactivates it and hides its child section. Switching categories resets term/detail sections.

**State:** Two variables track active selections: `activeCategory` (index or `"all"`) and `activeTerm` (composite key `"ci-ti"`).

**"Show All" button:** Merges all terms across categories, sorted alphabetically.

**DOM creation:** All term pills and detail card content are created via `document.createElement()` — never `innerHTML`. This avoids XSS concerns with security linters. SVG icons must be created with `document.createElementNS()`.

**Mobile vs desktop:** Use `isMobile()` check (`window.innerWidth <= 768`) to switch between paginated rendering (desktop) and full rendering with scroll (mobile).

See `references/glossary-interactions.js` for the complete interaction logic.

### Detail Card (Modal Overlay)

Clicking a term **always** opens a modal overlay (both desktop and mobile):

- Uses native `<dialog>` element (`detailModal.showModal()`)
- **Backdrop:** `rgba(0,0,0,0.4)` with `backdrop-filter: blur(12px)`
- **Card:** `width: 90vw`, `max-width: 600px`, `max-height: 85vh`, `overflow-y: auto`, `border-radius: 16px`
- **Close button:** `position: absolute` top-right, `font-size: 1.5rem`, no border, `outline: none` on focus
- Close on: X button click, tap outside (click on backdrop), or Escape key

**Detail card content:**

1. **Term name** — `<h3>` with serif font, `padding-right: 5.5rem` to prevent overlap with shuffle button
2. **Description** — 1-3 sentences in muted text
3. **Diagram** (if present) — light/dark variants with expand button
4. **"See more at:"** — label + note link pills
5. **Related terms** — buttons that navigate to the related term's detail
6. **Shuffle button** — top-right corner, picks random term from current category

The detail card has `position: relative` to support the absolutely-positioned shuffle button.

### Related Terms

- Appears below "See more at", separated by a divider line
- Shows pill buttons for each related term name
- Clicking navigates to that term: updates `activeTerm`, finds the correct page, re-renders pills, and rebuilds the modal content
- Only shown when the term has a non-empty `relatedTerms` array
- All `relatedTerms` entries must exactly match existing term names — validate with a script

### Shuffle Feature

A shuffle button in the **top-right corner** of the detail card:

- **Placement:** `position: absolute; top-right` of the `.detail-card`
- **Icon:** Shuffle SVG (crossing arrows) + "Shuffle" text label
- **Styled as a `.pill`** with inline-flex, smaller padding (`0.35rem 0.7rem`)
- **Behavior:**
  - Picks a random term from the current category pool (or all terms if "Show All")
  - Avoids picking the same term twice in a row
  - Navigates to the correct page containing the picked term
  - Updates the active term pill highlight
  - Rebuilds the modal content in-place

### Diagram Lightbox

- Uses native `<dialog>` element for backdrop, escape key, and focus trapping
- Expand button (↗↙ arrows SVG) appears on hover in top-right of diagram
- Lightbox has card background, 16px border-radius, blur(12px) backdrop
- Light/dark diagram switching works inside the lightbox too
- **Close button focus ring:** Add `outline: none` on `:focus`

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

### Navigation & Topbar

#### Glossary Page Topbar
- **Home button:** House icon (no text) in square button (`padding: 0.75rem; border-radius: 8px`), icon color `--fg-muted` (not gold), turns accent on hover
- **Search bar:** Fills available space on mobile (`flex: 1; width: 100%; max-width: 100%`)
- **Theme toggle:** `padding: 0.75rem` to match search bar height
- **Spacing:** Equal gap (`0.5rem`) between home button, search bar, and toggle

#### Homepage Topbar
- **Glossary link:** Rectangle-shaped (not pill) with `border-radius: 8px`
- **Mobile (<640px):** Topbar wraps into two rows — search + toggle on top (order 1), glossary link below full-width centered (order 2)

#### Docs Sidebar
- **Home button:** House icon with "Home" text in bordered rectangle style
- **Glossary link:** Below search bar, bordered with hover highlight
- **Sidebar tree:** Starts fully collapsed, state persisted in localStorage, scroll position in sessionStorage

### Mobile Behavior (<768px)

- Page scrolls normally (`height: auto; overflow: auto`)
- No pagination — all terms rendered, user scrolls
- No arrows
- Category-terms divider when category selected
- Term detail opens as modal overlay (same as desktop)
- No padding for arrows on terms/categories sections

### CSS Scoping Rule

**CRITICAL:** Styles for JS-created elements MUST use `<style is:global>`. Astro's scoped `<style>` adds data attributes that dynamically created elements don't have, so scoped styles won't apply.

Split styles into two blocks:
- `<style is:global>` — `.pill`, `.detail-card`, `.detail-*`, `.lightbox`, `.detail-modal`, `.shuffle-btn`, `.hidden`
- `<style>` (scoped) — `.glossary-page`, `.glossary-layout`, `.glossary-hero`, `.glossary-footer`, `.category-section`, `.terms-section`, `.terms-nav`, `.cat-nav`

## Populating the Glossary Data

### Auto-Extraction Workflow

1. Scan all content files to extract key terms, concepts, and technologies
2. Categorize terms into 10-15 groups (keep categories broad enough to be useful)
3. Map each term to the note slug(s) where it's discussed
4. Write 1-3 sentence descriptions based on how the term is explained in context
5. Map relevant diagrams to terms by matching diagram filenames to term topics
6. Add 2-5 `relatedTerms` per term — validate all names match existing terms
7. Validate all slugs pass build-time check

### Diagram Mapping

- SVG diagrams: use base name without extension (e.g. `"star-schema"`)
- PNG diagrams: include extension (e.g. `"aws-lakehouse.png"`)
- Each diagram must have light and dark variants: `name.svg` + `name-dark.svg`
- Only map diagrams that are directly relevant — many terms won't have one

## Quick Reference

| Component | CSS Class | Notes |
|-----------|-----------|-------|
| Page container | `.glossary-page` | max-width: 1200px, height: 100vh on desktop |
| Two-column wrapper | `.glossary-layout` | flex, gap: 1rem, overflow: hidden |
| Category wrapper | `.category-section` | 40% width, `.paginated` adds arrow padding |
| Category nav | `.category-nav` | flex-wrap, centered pills |
| Terms section | `.terms-section` | flex: 1, `.paginated` adds arrow padding |
| Terms pills | `.terms-pills` | flex-wrap, centered pills |
| Pagination arrows | `.terms-nav` / `.cat-nav` | absolute, top: 6.5rem, circular, `.nav-hidden` |
| Detail section | `.detail-section` | `display: none` (unused, detail is modal) |
| Detail modal | `.detail-modal` (dialog) | max-width: 600px, blur backdrop |
| All interactive buttons | `.pill` | **is:global**, shared style |
| Active state | `.pill.active` | accent color + tinted bg |
| Detail card | `.detail-card` | bg-card, border, 14px radius, position: relative |
| Shuffle button | `.shuffle-btn` | absolute top-right of detail card |
| Related terms | `.detail-related` | border-top divider, pill buttons |
| Diagram expand | `.diagram-expand` | absolute top-right of diagram, opacity 0→1 on hover |
| Lightbox | `.lightbox` (dialog) | fixed center, blur backdrop |
| Pagefind data | `.sr-only[data-pagefind-body]` | hidden, contains all terms for search |
| Home button | Logo `label="Home"` | house icon, square button, `--fg-muted` icon color |
| Glossary link (homepage) | `.topbar-glossary-link` | border-radius: 8px (not pill-shaped) |
