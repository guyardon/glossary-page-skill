# Glossary Page Gotchas

Mistakes made during implementation and the fixes that worked.

## 1. Astro Scoped Styles Don't Apply to JS-Created Elements

**Problem:** Pill styles defined in `<style>` (scoped) didn't apply to elements created with `document.createElement()`. Elements looked unstyled — no border, no rounded corners, no hover effect.

**Why:** Astro's scoped styles add a unique `data-astro-cid-xxx` attribute to both the CSS selectors and the HTML elements in the template. JS-created elements don't get this attribute, so scoped selectors don't match.

**Fix:** Move all styles for dynamically created elements to `<style is:global>`. Keep page-layout styles in scoped `<style>`. Two separate style blocks:
```html
<style is:global>
  /* .pill, .detail-card, .lightbox, .detail-modal, .shuffle-btn, .hidden — anything JS creates */
</style>
<style>
  /* .glossary-page, .glossary-layout, .glossary-hero — template-only elements */
</style>
```

## 2. innerHTML Blocked by Security Hooks

**Problem:** Using `innerHTML` to set element content triggered security linter warnings about XSS.

**Fix:** Use `document.createElement()` + `textContent` for all dynamic content. For SVG icons, use `document.createElementNS("http://www.w3.org/2000/svg", ...)` to build SVG elements programmatically instead of `innerHTML`.

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

## 8. Page Too Narrow for Layout

**Problem:** The glossary page initially used `max-width: 900px` (matching the homepage). Two columns with many pills were cramped.

**Fix:** Use `max-width: 1200px` for the glossary page only. The homepage stays at 900px.

## 9. Categories Stacked Vertically Wasting Space

**Problem:** Category pills were initially in a `flex-direction: column` layout with a fixed `width: 180px`, showing one pill per row. With 14 categories this made a very tall left column.

**Fix:** Use `flex-wrap: wrap` with `width: 40%` and `align-content: flex-start`. Pills wrap naturally within the allocated space.

## 10. Dark/Light Diagram Switching in Lightbox

**Problem:** The lightbox opened diagrams but didn't respect the current theme — only light variants showed.

**Fix:** Render both light and dark `<img>` variants inside the lightbox. Apply the same theme-switching CSS pattern used elsewhere:
```css
.lightbox .diagram-dark { display: none; }
:root:not([data-theme="light"]) .lightbox .diagram-dark { display: inline; }
:root:not([data-theme="light"]) .lightbox .diagram-light { display: none; }
```

## 11. Search Bar Overflows on Mobile

**Problem:** The search bar in the topbar had a fixed `width: 400px` which made the entire page wider than the phone screen.

**Fix:** Add a mobile media query in the SearchBar component to override the fixed width:
```css
@media (max-width: 640px) {
  :global(.home-topbar-actions) .search-inline {
    width: 100%;
    max-width: 100%;
    flex: 1;
  }
}
```

## 12. Topbar Too Crowded on Mobile

**Problem:** The glossary link, search bar, and theme toggle all on one row was too cramped on phone screens.

**Fix (homepage):** Use `flex-wrap: wrap` on the topbar. Reorder with CSS: search + toggle first (order 1, full width, `justify-content: space-between`), glossary link below (order 2, full width, centered).

**Fix (glossary page):** Home button is a house icon in a square button matching the theme toggle style. The search bar fills the remaining space.

## 13. Blue Focus Ring on Modal Close Buttons

**Problem:** The X close buttons on the detail modal and lightbox showed a blue browser focus outline after tapping on mobile.

**Fix:** Add `outline: none` on `:focus` for both `.lightbox .lightbox-close` and `.detail-modal .detail-modal-close`.

## 14. Theme Toggle and Search Bar Height Mismatch

**Problem:** The theme toggle button was smaller than the search bar input, looking visually unbalanced.

**Fix:** Match the theme toggle padding to the search input: `padding: 0.75rem`. Same for the Logo home button.

## 15. Long Term Title Overlaps Shuffle Button

**Problem:** Terms with long names (e.g. "Infrastructure as Code (IaC)") rendered their title text behind the absolutely-positioned shuffle button in the top-right corner of the detail card.

**Fix:** Add `padding-right: 5.5rem` to `.detail-title` so long titles wrap to the next line instead of overlapping.

## 16. CSS Selector Mismatch for Search Wrapper

**Problem:** Mobile media queries targeted `.search-wrapper` but the actual class was `.search-inline`. The override never applied.

**Fix:** Always check the actual component class names. The SearchBar component uses `.search-inline`, not `.search-wrapper`.

## 17. DOM Measurement on Hidden Elements Returns Zero

**Problem:** Pagination's `buildPages()` counts rows by measuring `offsetTop` of pill elements. When the terms section was hidden (`display: none` via `.hidden` class), all `offsetTop` values were 0, so the function counted only 1 row and never paginated. No arrows appeared and all terms showed in a single overflowing page.

**Fix:** Make the section visible BEFORE measuring:
```js
// WRONG: measure then show
buildPages();        // offsetTop is 0 for everything
termsSection.classList.remove("hidden");

// RIGHT: show then measure
termsSection.classList.remove("hidden");
buildPages();        // offsetTop now returns real values
```
This is the single most important gotcha for the pagination system.

## 18. Pagination Arrows Showing When Not Needed

**Problem:** Category section had pagination arrows and padding even when all categories fit within 7 rows, wasting horizontal space.

**Fix:** Check if pagination is needed BEFORE adding arrows. Render all items, count rows. If ≤ MAX_ROWS, return early without adding `.paginated` class (which controls the padding for arrows). Use `visibility: hidden` (not `display: none`) for the `.nav-hidden` class so arrows reserve space only when pagination is active.

## 19. Bottom Row Cropped by Overflow Hidden

**Problem:** Fixed `TERMS_PER_PAGE` count didn't account for variable pill widths. Some pages had 8 rows instead of 7, with the 8th row cropped by `overflow: hidden`.

**Fix:** Don't use a fixed items-per-page count. Instead, dynamically build pages by adding items one at a time and measuring actual row count after each addition. When rows exceed MAX_ROWS, remove the last item and start a new page. Store page break indices for navigation.

## 20. Pagination Arrow Position Jumps Between Pages

**Problem:** Arrows positioned at `top: 50%` of the terms section moved vertically depending on how many rows the current page had (e.g., last page with 3 rows had arrows at row 2 instead of row 4).

**Fix:** Use a fixed `top: 6.5rem` instead of `50%`. This places arrows consistently at the center of row 4, regardless of content height.

## 21. Mobile Terms Narrower Than Categories

**Problem:** The `padding: 0 2.5rem` on `.terms-section` (meant for desktop arrow space) also applied on mobile, making the terms container narrower than the categories above it.

**Fix:** Reset padding on mobile:
```css
@media (max-width: 768px) {
  .terms-section { padding: 0; }
  .category-section { padding: 0; }
}
```

## 22. Stale Preview Servers on Multiple Ports

**Problem:** Multiple `astro preview` servers accumulated on ports 4321, 4322, 4323 from previous sessions. The user was viewing an old build with dummy test data on a stale port.

**Fix:** Always kill ALL processes on ports 4321-4323 before starting a new preview server:
```bash
kill $(lsof -ti :4321 2>/dev/null) 2>/dev/null
```
Verify the correct port after starting.

## 23. Auto-Opening Weeks in Sidebar

**Problem:** A script auto-expanded all week `<details>` when a course was opened. User wanted the tree fully collapsed — expand one level at a time.

**Fix:** Remove the auto-open logic. Only collapse weeks when the course is closed:
```js
course.querySelector(".course-summary")?.addEventListener("click", (e) => {
  requestAnimationFrame(() => {
    if (!course.hasAttribute("open")) {
      course.querySelectorAll(".week-details").forEach((week) => {
        week.removeAttribute("open");
      });
    }
  });
});
```

## 24. Modal Vertical Position Jumps Between Terms

**Problem:** The detail modal used `top: 50%; transform: translateY(-50%)` to center vertically. This meant short-content terms appeared in the middle of the screen while long-content terms started higher up. The shuffle button moved between clicks.

**Fix:** Use a fixed `top: 10vh` with `transform: translateX(-50%)` (horizontal center only). The modal always starts at the same vertical position. Content scrolls within `max-height: 80vh` if it overflows.

## 25. Close Button Hidden Behind Detail Card Content

**Problem:** The modal close button (`position: absolute`) was rendered behind the `.detail-card` which has `position: relative`, creating a new stacking context that covered the button.

**Fix:** Add `z-index: 10` and `background: var(--bg-card)` to the close button. Use an SVG X icon (not `&times;` character which has alignment issues) in a circular bordered button matching other UI buttons.

## 26. Active Term Not Reset After Closing Modal

**Problem:** After opening a term's detail modal and closing it (X or click outside), the term pill remained highlighted. Clicking it again toggled it off instead of reopening the modal.

**Fix:** Listen for the dialog's `close` event to reset state:
```js
detailModal.addEventListener("close", function() {
  activeTerm = null;
  document.querySelectorAll(".term-pill.active").forEach(function(b) {
    b.classList.remove("active");
  });
});
```
