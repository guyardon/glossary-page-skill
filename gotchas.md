# Glossary Page Gotchas

Mistakes made during implementation and the fixes that worked.

## 1. Astro Scoped Styles Don't Apply to JS-Created Elements

**Problem:** Pill styles defined in `<style>` (scoped) didn't apply to elements created with `document.createElement()`. Elements looked unstyled — no border, no rounded corners, no hover effect.

**Why:** Astro's scoped styles add a unique `data-astro-cid-xxx` attribute to both the CSS selectors and the HTML elements in the template. JS-created elements don't get this attribute, so scoped selectors don't match.

**Fix:** Move all styles for dynamically created elements to `<style is:global>`. Keep page-layout styles in scoped `<style>`. Two separate style blocks:
```html
<style is:global>
  /* .pill, .detail-card, .lightbox, .hidden — anything JS creates */
</style>
<style>
  /* .glossary-page, .glossary-layout, .glossary-hero — template-only elements */
</style>
```

## 2. innerHTML Blocked by Security Hooks

**Problem:** Using `innerHTML` to set element content triggered security linter warnings about XSS.

**Fix:** Use `document.createElement()` + `textContent` for all dynamic content. The only exception is the expand button SVG icon, which uses `innerHTML` for the SVG markup (static, not user-supplied).

## 3. Note Link Pills Didn't Look Like Pills

**Problem:** Note link `<a>` elements were created with `className = "note-card"` but didn't have the `.pill` class, so they rendered as styled cards instead of pills.

**Fix:** Always include the `pill` class: `a.className = "pill note-card"`. The `.pill` class provides the shared border-radius, padding, and hover styling.

## 4. Logo Component Creates Nested `<a>` Tags

**Problem:** Wrapping `<Logo />` in `<a href="/">` created invalid HTML — `<a><a class="logo">` — because the Logo component already renders its own `<a>` tag. This caused layout issues.

**Fix:** Use `<Logo />` directly without wrapping. The Logo component handles its own link to the homepage.

## 5. Diagram Click Handler on Wrong Element

**Problem:** Initially the entire diagram container was clickable to open the lightbox. This was unintuitive — users didn't realize it was interactive.

**Fix:** Add an explicit expand button (↗↙ SVG icon) positioned absolute in the top-right corner. The button appears on hover (`opacity: 0` -> `1`). Only the button triggers the lightbox, not the diagram image itself.

## 6. Lightbox Looked Disconnected from the Page

**Problem:** First lightbox implementation used a transparent background with dark overlay. The dialog floated with no visual grounding.

**Fix:** Give the lightbox `background: var(--bg-card)`, `border-radius: 16px`, `padding: 1.5rem`, and `box-shadow`. The backdrop uses `rgba(0,0,0,0.4)` with `backdrop-filter: blur(12px)` so the page is visible but blurred behind. The close button uses the page's theme colors, not hardcoded white.

## 7. "Show All" Term Toggle Used Simple Index

**Problem:** When using "Show All", clicking terms from different categories used the same term index (`ti`), so toggling broke — clicking term 3 from category A would conflict with term 3 from category B.

**Fix:** Use a composite key `ci + "-" + ti` (category index + term index) for `activeTerm` tracking instead of just the term index.

## 8. Page Too Narrow for Three-Column Layout

**Problem:** The glossary page initially used `max-width: 900px` (matching the homepage). Three columns were cramped with no room for pills and detail card.

**Fix:** Increase to `max-width: 1200px` for the glossary page only. The homepage stays at 900px.

## 9. Categories Stacked Vertically Wasting Space

**Problem:** Category pills were initially in a `flex-direction: column` layout with a fixed `width: 180px`, showing one pill per row. With 14 categories this made a very tall left column.

**Fix:** Use `flex-wrap: wrap` with `width: 33%` and `align-content: flex-start`. Pills wrap naturally within the allocated space.

## 10. Dark/Light Diagram Switching in Lightbox

**Problem:** The lightbox opened diagrams but didn't respect the current theme — only light variants showed.

**Fix:** Render both light and dark `<img>` variants inside the lightbox. Apply the same theme-switching CSS pattern used elsewhere:
```css
.lightbox .diagram-dark { display: none; }
:root:not([data-theme="light"]) .lightbox .diagram-dark { display: inline; }
:root:not([data-theme="light"]) .lightbox .diagram-light { display: none; }
```

## 11. Grayscale Filter on Logos Not Desired

**Problem:** The logo marquee was initially built with `filter: grayscale(100%) opacity(0.6)` for a "modern" look. The user wanted original colors.

**Fix:** Replace with simple `opacity: 0.8` and `opacity: 1` on hover. Don't assume grayscale is wanted — ask first.
