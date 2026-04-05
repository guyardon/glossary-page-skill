// Glossary Page — Complete Client-Side Interaction Logic
// This is the reference implementation for the drill-down pill UI.
// Used inside <script define:vars={{ resolvedData, BASE }}>

const data = resolvedData;
const basePath = BASE;
const termsPills = document.getElementById("terms-pills");
const termsSection = document.getElementById("terms-section");
const detailCard = document.getElementById("detail-card");
const detailSection = document.getElementById("detail-section");

let activeCategory = null; // number | "all" | null
let activeTerm = null;     // "ci-ti" composite key | null

// Safe DOM clearing — no innerHTML needed
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// Pre-build sorted "all terms" list for the Show All button
const allTerms = [];
data.forEach((cat, ci) => {
  cat.terms.forEach((term, ti) => {
    allTerms.push({ term, ci, ti });
  });
});
allTerms.sort((a, b) => a.term.term.localeCompare(b.term.term));

// --- Category Click Handler ---
document.querySelectorAll(".category-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    const raw = btn.dataset.category;
    const key = raw === "all" ? "all" : parseInt(raw);

    // Toggle off if already active
    if (activeCategory === key) {
      activeCategory = null;
      activeTerm = null;
      btn.classList.remove("active");
      termsSection.classList.add("hidden");
      detailSection.classList.add("hidden");
      return;
    }

    // Deactivate previous, activate new
    document.querySelectorAll(".category-pill.active").forEach((b) => b.classList.remove("active"));
    activeCategory = key;
    activeTerm = null;
    btn.classList.add("active");
    detailSection.classList.add("hidden");

    // Render term pills
    clearChildren(termsPills);
    const terms = key === "all"
      ? allTerms
      : data[key].terms.map((term, ti) => ({ term, ci: key, ti }));

    terms.forEach((entry) => {
      const pill = document.createElement("button");
      pill.className = "pill term-pill";
      pill.textContent = entry.term.term;
      pill.addEventListener("click", () => handleTermClick(entry.ci, entry.ti, pill));
      termsPills.appendChild(pill);
    });
    termsSection.classList.remove("hidden");
  });
});

// --- Term Click Handler ---
function handleTermClick(ci, ti, pill) {
  // Composite key prevents conflicts when "Show All" mixes categories
  const key = ci + "-" + ti;

  // Toggle off if already active
  if (activeTerm === key) {
    activeTerm = null;
    pill.classList.remove("active");
    detailSection.classList.add("hidden");
    return;
  }

  document.querySelectorAll(".term-pill.active").forEach((b) => b.classList.remove("active"));
  activeTerm = key;
  pill.classList.add("active");

  clearChildren(detailCard);
  const term = data[ci].terms[ti];

  // 1. Term name
  const title = document.createElement("h3");
  title.className = "detail-title";
  title.textContent = term.term;
  detailCard.appendChild(title);

  // 2. Description
  if (term.description) {
    const desc = document.createElement("p");
    desc.className = "detail-desc";
    desc.textContent = term.description;
    detailCard.appendChild(desc);
  }

  // 3. Diagram with expand button
  if (term.diagram) {
    const isPng = term.diagram.endsWith(".png");
    const baseName = isPng ? term.diagram.replace(".png", "") : term.diagram;
    const ext = isPng ? "png" : "svg";
    const lightSrc = basePath + "/images/diagrams/" + baseName + "." + ext;
    const darkSrc = basePath + "/images/diagrams/" + baseName + "-dark." + ext;

    const diagramWrap = document.createElement("div");
    diagramWrap.className = "detail-diagram";

    // Expand button — appears on hover, opens lightbox
    // NOTE: The expand button SVG is a static icon, built via createElementNS
    const expandBtn = document.createElement("button");
    expandBtn.className = "diagram-expand";
    expandBtn.setAttribute("aria-label", "Enlarge diagram");
    // Build expand icon SVG via DOM (4 arrows pointing outward)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    const poly1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly1.setAttribute("points", "15 3 21 3 21 9");
    const poly2 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly2.setAttribute("points", "9 21 3 21 3 15");
    const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line1.setAttribute("x1", "21"); line1.setAttribute("y1", "3");
    line1.setAttribute("x2", "14"); line1.setAttribute("y2", "10");
    const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line2.setAttribute("x1", "3"); line2.setAttribute("y1", "21");
    line2.setAttribute("x2", "10"); line2.setAttribute("y2", "14");
    svg.append(poly1, poly2, line1, line2);
    expandBtn.appendChild(svg);
    expandBtn.addEventListener("click", () => openLightbox(lightSrc, darkSrc, term.term));
    diagramWrap.appendChild(expandBtn);

    // Light variant
    const imgLight = document.createElement("img");
    imgLight.src = lightSrc;
    imgLight.alt = term.term;
    imgLight.className = "diagram diagram-light";
    diagramWrap.appendChild(imgLight);

    // Dark variant
    const imgDark = document.createElement("img");
    imgDark.src = darkSrc;
    imgDark.alt = term.term;
    imgDark.className = "diagram diagram-dark";
    diagramWrap.appendChild(imgDark);

    detailCard.appendChild(diagramWrap);
  }

  // 4. "See more at:" with note link pills
  const seeMore = document.createElement("div");
  seeMore.className = "detail-see-more";

  const label = document.createElement("span");
  label.className = "detail-label";
  label.textContent = "See more at:";
  seeMore.appendChild(label);

  const links = document.createElement("div");
  links.className = "detail-links";
  term.notes.forEach((ref) => {
    const a = document.createElement("a");
    a.href = ref.href;
    a.className = "pill note-card"; // Both classes: .pill for styling, .note-card for text-decoration
    a.textContent = ref.title;
    links.appendChild(a);
  });
  seeMore.appendChild(links);
  detailCard.appendChild(seeMore);

  detailSection.classList.remove("hidden");
}

// --- Lightbox (native <dialog>) ---
// HTML: <dialog id="lightbox" class="lightbox">
//         <button class="lightbox-close" aria-label="Close">&times;</button>
//         <img id="lightbox-img-light" class="lightbox-img diagram-light" alt="" />
//         <img id="lightbox-img-dark" class="lightbox-img diagram-dark" alt="" />
//       </dialog>
const lightbox = document.getElementById("lightbox");
const lbImgLight = document.getElementById("lightbox-img-light");
const lbImgDark = document.getElementById("lightbox-img-dark");
const lbClose = lightbox.querySelector(".lightbox-close");

function openLightbox(lightSrc, darkSrc, alt) {
  lbImgLight.src = lightSrc;
  lbImgLight.alt = alt;
  lbImgDark.src = darkSrc;
  lbImgDark.alt = alt;
  lightbox.showModal(); // Native: adds backdrop, traps focus, Escape closes
}

lbClose.addEventListener("click", () => lightbox.close());
// Close on backdrop click
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.close();
});
