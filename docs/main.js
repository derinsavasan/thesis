// ─────────────────────────────────────────────────────────
//  The Shape of Stories · scrollytelling prototype
//  Data lives in ../thesis-outputs. Serve from repo root
//  with e.g. `python -m http.server 8000` then open /web/
// ─────────────────────────────────────────────────────────

const DATA = "./thesis-outputs";

// palette (mirrors CSS tokens in styles.css)
const C = {
  ink:       "#1c1712",
  inkDim:    "#5a5041",
  inkFaint:  "#8e8370",
  bg:        "#f3ead4",
  bgRaise:   "#e8dcb8",
  amber:     "#a16a0c",
  amberSoft: "#c48514",
  red:       "#9a3027",
  rule:      "#d6c694",
  ruleSoft:  "#e2d5a3",
  // reversal markers: warm/cool metaphor
  peak:      "#e07a1f",   // tangerine, light/heat/joy
  trough:    "#1a365d",   // deep navy, cold/dark/dread
};

// six archetypes, canonical names from the thesis (0-indexed here, 1-indexed in the thesis text)
const ARCHETYPE_NAMES = {
  0: "Oedipus",        // Archetype 1  (fall-rise-fall)
  1: "Icarus",         // Archetype 2  (rise-fall)
  2: "Man in a Hole",  // Archetype 3  (fall-rise)
  3: "Tragedy",        // Archetype 4  (fall)
  4: "Rags to Riches", // Archetype 5  (rise)
  5: "Cinderella",     // Archetype 6  (rise-fall-rise)
};
// palette keyed by archetype id (brighter, more editorial, avoids clashing
// with the peak/trough orange+navy)
const ARCH_COLOR = {
  0: "#4a6da7", // dusty blue      oedipus
  1: "#c84630", // brick red       icarus
  2: "#2a9d8f", // persian teal    man in a hole
  3: "#8b2a4d", // wine burgundy   tragedy
  4: "#d4a017", // deep gold       rags to riches
  5: "#6a4c93", // violet          cinderella
};
// walk through in the thesis's own order
const ARCH_ORDER = [0, 1, 2, 3, 4, 5];

// curated films for the explorer, mapped to slugs on disk
const CURATED = [
  ["Fight Club", 1999, "fight-club-1999"],
  ["Interstellar", 2014, "interstellar-2014"],
  ["When Harry Met Sally", 1989, "when-harry-met-sally-1989"],
  ["Inside Out", 2015, "inside-out-2015"],
  ["Wolf of Wall Street", 2013, "the-wolf-of-wall-street-2013"],
  ["Kill Bill Vol. 1", 2003, "kill-bill-vol-1-2003"],
  ["Whiplash", 2014, "whiplash-2014"],
  ["Inglourious Basterds", 2009, "inglourious-basterds-2009"],
  ["American Beauty", 1999, "american-beauty-1999"],
  ["The Truman Show", 1998, "the-truman-show-1998"],
  ["Dead Poets Society", 1989, "dead-poets-society-1989"],
  ["There Will Be Blood", 2007, "there-will-be-blood-2007"],
  ["Se7en", 1995, "se7en-1995"],
  ["Eternal Sunshine", 2004, "eternal-sunshine-of-the-spotless-mind-2004"],
  ["La La Land", 2016, "la-la-land-2016"],
  ["Blade Runner", 1982, "blade-runner-1982"],
  ["Prisoners", 2013, "prisoners-2013"],
  ["Wall·E", 2008, "wall-e-2008"],
  ["Schindler's List", 1993, "schindlers-list-1993"],
  ["Forrest Gump", 1994, "forrest-gump-1994"],
  ["Shutter Island", 2010, "shutter-island-2010"],
  ["Good Will Hunting", 1997, "good-will-hunting-1997"],
  ["500 Days of Summer", 2009, "500-days-of-summer-2009"],
  ["Black Swan", 2010, "black-swan-2010"],
];

// ─────────────────────────────────────────────────────────
// tiny helpers

// Size an SVG reliably: measure the PARENT element (not the svg itself),
// set width/height/viewBox attributes explicitly, and return the dims.
// This is more robust than relying on svg.getBoundingClientRect() which
// can return 0 before layout fully settles.
function sizeSvg(sel, { minW = 300, minH = 200 } = {}) {
  const node = sel.node();
  const parent = node.parentNode;
  const r = parent.getBoundingClientRect();
  // parent may include padding; subtract if it's the .panel (padding: 2rem = 32px)
  let w = r.width, h = r.height;
  if (parent.classList && parent.classList.contains("panel")) {
    const cs = getComputedStyle(parent);
    w -= parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    h -= parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  }
  w = Math.max(w, minW);
  h = Math.max(h, minH);
  sel.attr("width", w).attr("height", h).attr("viewBox", `0 0 ${w} ${h}`);
  return { width: w, height: h };
}

function buildScaledLine(width, height, pad, ys, yDomain) {
  const x = d3.scaleLinear().domain([0, 1]).range([pad, width - pad]);
  const y = d3.scaleLinear().domain(yDomain).range([height - pad, pad]);
  return d3.line()
    .x((d, i, a) => x(i / (a.length - 1)))
    .y(d => y(d))
    .curve(d3.curveCatmullRom.alpha(0.6));
}

// ─────────────────────────────────────────────────────────
// Shared "tonight's film": one random arc is picked per page load and
// used by BOTH the hero (decorative background) and the intro scrollytelling
// (with labels, reversals, and injected into the body copy). That way the
// eyebrow tease and the featured arc stay consistent, and every reload
// surfaces a different film from the 1,627-film corpus.
const tonight = { slug: null, arc: null, reversals: null };

async function pickTonightsFilm() {
  const slugs = await d3.json(`${DATA}/arcs/_slug_index.json`);
  tonight.slug = slugs[Math.floor(Math.random() * slugs.length)];
  tonight.arc = await d3.json(`${DATA}/arcs/${tonight.slug}_arc.json`);
  const revAll = await d3.json(`${DATA}/reversals.json`);
  tonight.reversals = revAll.find(r => r.slug === tonight.slug);
}

// ─────────────────────────────────────────────────────────
// HERO background arc (decorative)
async function drawHero() {
  const svg = d3.select(".hero-arc");
  const { width, height } = sizeSvg(svg);
  const pad = 80;

  const ys = tonight.arc.main_arc.map(p => p.z_score);
  const yExt = d3.extent(ys);
  const mk = buildScaledLine(width, height, pad, ys, [yExt[0] - 0.5, yExt[1] + 0.5]);
  svg.append("path")
    .datum(ys)
    .attr("d", mk)
    .attr("fill", "none")
    .attr("stroke", C.ink)
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round");

  // whisper which film is behind the title (lower-right corner of the hero)
  const label = document.querySelector("#hero-film");
  if (label) {
    label.innerHTML =
      `<span class="hero-film-key">tonight's film</span>` +
      `<span class="hero-film-val"><em>${tonight.arc.title}</em> (${tonight.arc.year})</span>`;
  }
}

// ─────────────────────────────────────────────────────────
// INTRO scrollytelling, a single arc (Fight Club) building up
const intro = { arc: null, reversals: null };

async function drawIntro() {
  const svg = d3.select(".intro-svg");
  const { width: W, height: H } = sizeSvg(svg);
  const pad = 40;

  // Use tonight's randomly-chosen film, same one the hero is showing.
  const fc = tonight.arc;
  const revFc = tonight.reversals;

  intro.arc = fc;
  intro.reversals = revFc;

  // inject the current film's title into the scrolly body copy
  const ref = document.querySelector("#intro-film-ref");
  if (ref) ref.textContent = fc.title;

  const ys = fc.main_arc.map(p => p.z_score);
  const xs = fc.main_arc.map(p => p.position);
  const yExt = d3.extent(ys);
  const yPad = 0.6;

  const x = d3.scaleLinear().domain([0, 1]).range([pad + 30, W - pad]);
  const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H - pad, pad + 20]);

  // zero baseline
  svg.append("line")
    .attr("class", "intro-zero")
    .attr("x1", pad + 30).attr("x2", W - pad)
    .attr("y1", y(0)).attr("y2", y(0))
    .attr("stroke", C.rule)
    .attr("stroke-dasharray", "2 4");

  // axis labels
  svg.append("text")
    .attr("x", pad + 30).attr("y", H - 10)
    .attr("fill", C.inkFaint)
    .attr("font-family", "JetBrains Mono").attr("font-size", 10)
    .text("BEGINNING");
  svg.append("text")
    .attr("x", W - pad).attr("y", H - 10)
    .attr("text-anchor", "end")
    .attr("fill", C.inkFaint)
    .attr("font-family", "JetBrains Mono").attr("font-size", 10)
    .text("END");
  // Y-axis labels: horizontal, left of the plot area. Vertical position
  // already communicates direction, so no arrows needed.
  svg.append("text")
    .attr("x", pad + 25).attr("y", pad + 28)
    .attr("text-anchor", "end")
    .attr("fill", C.inkFaint)
    .attr("font-family", "JetBrains Mono").attr("font-size", 10)
    .text("POSITIVE");
  svg.append("text")
    .attr("x", pad + 25).attr("y", H - pad - 4)
    .attr("text-anchor", "end")
    .attr("fill", C.inkFaint)
    .attr("font-family", "JetBrains Mono").attr("font-size", 10)
    .text("NEGATIVE");

  const lineFn = d3.line()
    .x((_, i) => x(xs[i]))
    .y(d => y(d))
    .curve(d3.curveCatmullRom.alpha(0.6));

  const path = svg.append("path")
    .attr("class", "intro-path")
    .datum(ys)
    .attr("d", lineFn)
    .attr("fill", "none")
    .attr("stroke", C.ink)
    .attr("stroke-width", 2);

  // animate the draw-in
  const total = path.node().getTotalLength();
  path.attr("stroke-dasharray", `${total} ${total}`)
      .attr("stroke-dashoffset", total);

  // reversal dots (hidden until step 3)
  const dots = svg.append("g").attr("class", "intro-dots");
  dots.selectAll("circle")
    .data(revFc.reversals)
    .join("circle")
    .attr("cx", d => x(d.position))
    .attr("cy", d => y(d.value))
    .attr("r", 0)
    .attr("fill", d => d.type === "peak" ? C.peak : C.trough)
    .attr("stroke", C.bg)
    .attr("stroke-width", 2);

  // Initial draw-in happens once, on first call. Subsequent step changes
  // only affect emphasis, dots, and the caption, so the panel is never empty.
  // IMPORTANT: use *named* transitions so the fade transition below does not
  // interrupt the draw-in (D3 v7 interrupts same-named transitions on the
  // same selection, which is how the arc was silently disappearing).
  let hasDrawn = false;
  intro.render = (stepIdx) => {
    if (!hasDrawn) {
      path.transition("draw").duration(1600).ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);
      hasDrawn = true;
    }
    dots.selectAll("circle")
      .transition("dots").duration(600)
      .attr("r", stepIdx >= 3 ? 6 : 0);

    // at step 4, fade the line slightly so the idea of "one of many" lands
    path.transition("fade").duration(600)
      .attr("stroke-opacity", stepIdx >= 4 ? 0.55 : 1);

    d3.select("#intro-title").text(
      stepIdx >= 4 ? "One of 1,627" : `${fc.title} · ${fc.year}`
    );
    d3.select("#intro-meta").text(
      stepIdx >= 3 ? "peaks (warm) · troughs (cool) · reversals detected" :
      stepIdx >= 2 ? "z-score of sentiment over narrative time" :
      stepIdx >= 1 ? "z-score of sentiment over narrative time" :
      "an emotional arc, drawn from the screenplay"
    );
  };

  intro.render(0);
}

// ─────────────────────────────────────────────────────────
// SIX ARCHETYPES small-multiple grid
const archetypes = {};

async function drawArchetypes() {
  const rows = await d3.csv(`${DATA}/archetype_shapes.csv`, d3.autoType);
  const decadeCounts = await d3.csv(`${DATA}/archetype_decade_counts.csv`, d3.autoType);

  // update film counts in the right-hand copy
  const totals = new Map();
  rows.forEach(r => totals.set(r.archetype_id, r.film_count));
  d3.selectAll("[data-count]").each(function () {
    const id = +this.dataset.count;
    this.textContent = totals.get(id)?.toLocaleString() ?? "…";
  });

  const svg = d3.select(".archetypes-svg");
  const rect = svg.node().getBoundingClientRect();
  const W = rect.width, H = rect.height;

  // 3x2 grid
  const cols = 3, grows = 2;
  const cellW = W / cols, cellH = H / grows;
  const pad = 22;

  const yExt = [-2.6, 2.6];

  const panels = svg.selectAll("g.arch")
    .data(ARCH_ORDER.map(id => rows.find(r => r.archetype_id === id)))
    .join("g")
    .attr("class", "arch")
    .attr("transform", (_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      return `translate(${c * cellW}, ${r * cellH})`;
    });

  panels.append("rect")
    .attr("x", pad / 2).attr("y", pad / 2)
    .attr("width", cellW - pad).attr("height", cellH - pad)
    .attr("fill", "transparent")
    .attr("stroke", C.rule);

  panels.append("text")
    .attr("x", pad).attr("y", pad + 6)
    .attr("fill", C.inkDim)
    .attr("font-family", "Fraunces, serif")
    .attr("font-size", 14)
    .text(d => ARCHETYPE_NAMES[d.archetype_id]);

  panels.append("text")
    .attr("x", pad).attr("y", pad + 22)
    .attr("fill", C.inkFaint)
    .attr("font-family", "JetBrains Mono")
    .attr("font-size", 9)
    .text(d => `${d.film_count} FILMS`);

  const x = d3.scaleLinear().domain([0, 19]).range([pad, cellW - pad]);
  const y = d3.scaleLinear().domain(yExt).range([cellH - pad - 10, pad + 32]);
  const lineFn = d3.line().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveCatmullRom.alpha(0.6));

  // baseline
  panels.append("line")
    .attr("x1", pad).attr("x2", cellW - pad)
    .attr("y1", y(0)).attr("y2", y(0))
    .attr("stroke", C.ruleSoft)
    .attr("stroke-dasharray", "2 4");

  panels.append("path")
    .attr("class", "arch-line")
    .attr("d", d => {
      const ys = d3.range(1, 21).map(i => d[`w${String(i).padStart(2, "0")}`]);
      return lineFn(ys);
    })
    .attr("fill", "none")
    .attr("stroke", d => ARCH_COLOR[d.archetype_id])
    .attr("stroke-width", 2.5)
    .attr("stroke-opacity", 0.35);

  archetypes.highlight = (archId) => {
    panels.select(".arch-line")
      .transition().duration(400)
      .attr("stroke-opacity", d => (archId === null || d.archetype_id === archId) ? 1 : 0.15)
      .attr("stroke-width", d => d.archetype_id === archId ? 3.5 : 2);
    panels.select("rect")
      .transition().duration(400)
      .attr("stroke", d => d.archetype_id === archId ? ARCH_COLOR[d.archetype_id] : C.rule);
  };

  archetypes.highlight(null);
}

// ─────────────────────────────────────────────────────────
// ERA, decade/genre stacked bars
const era = { view: "decade", data: {} };

async function drawEra() {
  const dec = await d3.csv(`${DATA}/archetype_decade_weights.csv`, d3.autoType);
  const films = await d3.csv(`${DATA}/emotional_arcs_clustered.csv`, d3.autoType);

  // decade: already in CSV as shares
  const decadeRows = dec.map(d => {
    const row = { key: d.decade };
    for (let i = 0; i < 6; i++) row[i] = d[`Arch ${i}`];
    return row;
  });

  // genre: compute share of dominant archetype within each primary genre
  const genreGroups = d3.rollups(
    films.filter(f => f.primary_genre && f.primary_genre !== ""),
    v => {
      const tot = v.length;
      const row = { key: v[0].primary_genre, _n: tot };
      for (let i = 0; i < 6; i++) row[i] = 0;
      v.forEach(f => { row[f.dominant_archetype] += 1 / tot; });
      return row;
    },
    f => f.primary_genre
  );
  // keep top 8 by count, alphabetize
  const genreRows = genreGroups
    .map(g => g[1])
    .sort((a, b) => b._n - a._n)
    .slice(0, 8)
    .sort((a, b) => d3.ascending(a.key, b.key));

  era.data.decade = decadeRows;
  era.data.genre = genreRows;

  // legend
  const legend = d3.select("#era-legend");
  legend.selectAll("span.item")
    .data(ARCH_ORDER)
    .join("span")
    .attr("class", "item")
    .html(id => `<span class="swatch" style="background:${ARCH_COLOR[id]}"></span>${ARCHETYPE_NAMES[id]}`);

  renderEra();

  d3.selectAll(".toggle-btn").on("click", function () {
    d3.selectAll(".toggle-btn").classed("is-active", false);
    d3.select(this).classed("is-active", true);
    era.view = this.dataset.view;
    d3.select("#era-note").text(
      era.view === "decade"
        ? "Each bar shows how the six archetypes divide up films from that decade. Widths are the share of films."
        : "Each bar is a genre. A row for romance looks very different from a row for horror, and that is the point."
    );
    renderEra();
  });
}

function renderEra() {
  const svg = d3.select(".era-svg");
  svg.selectAll("*").remove();
  const rect = svg.node().getBoundingClientRect();
  const W = rect.width, H = rect.height;
  const m = { top: 20, right: 20, bottom: 30, left: 110 };

  const rows = era.data[era.view];
  const keys = ARCH_ORDER.map(String);

  // normalize each row so widths sum to 1 (decade rows already ~do; safer)
  rows.forEach(r => {
    const s = d3.sum(keys, k => r[+k] || 0);
    keys.forEach(k => { r[+k] = (r[+k] || 0) / s; });
  });

  const y = d3.scaleBand()
    .domain(rows.map(r => r.key))
    .range([m.top, H - m.bottom])
    .padding(0.25);

  const x = d3.scaleLinear().domain([0, 1]).range([m.left, W - m.right]);

  // row labels
  svg.append("g").selectAll("text")
    .data(rows)
    .join("text")
    .attr("x", m.left - 14).attr("y", r => y(r.key) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", "end")
    .attr("fill", C.ink)
    .attr("font-family", "Fraunces, serif")
    .attr("font-size", 15)
    .text(r => r.key);

  // stacks
  const stack = d3.stack().keys(keys).value((d, k) => d[+k] || 0);
  const series = stack(rows);

  const g = svg.append("g");
  g.selectAll("g.layer")
    .data(series)
    .join("g")
    .attr("class", "layer")
    .attr("fill", s => ARCH_COLOR[+s.key])
    .selectAll("rect")
    .data(s => s.map(pt => ({ ...pt, key: s.key })))
    .join("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d.data.key))
    .attr("width", 0)
    .attr("height", y.bandwidth())
    .transition().duration(700)
    .attr("width", d => x(d[1]) - x(d[0]));
}

// ─────────────────────────────────────────────────────────
// EXPLORER
const explorer = { current: null };

async function buildExplorer() {
  const grid = d3.select("#film-grid");
  grid.selectAll(".film-cell")
    .data(CURATED)
    .join("div")
    .attr("class", "film-cell")
    .html(([title, year]) => `${title}<span class="year">${year}</span>`)
    .on("click", function (_, d) {
      d3.selectAll(".film-cell").classed("is-active", false);
      d3.select(this).classed("is-active", true);
      loadFilm(d);
    });

  // auto-select first
  const first = grid.select(".film-cell").node();
  if (first) first.click();
}

async function loadFilm([title, year, slug]) {
  const svg = d3.select(".explorer-svg");
  svg.selectAll("*").remove();

  let arc, rev;
  try {
    arc = await d3.json(`${DATA}/arcs/${slug}_arc.json`);
  } catch (e) {
    d3.select("#stage-title").text(`${title} (not in corpus)`);
    d3.select("#stage-sub").text("");
    d3.select("#stage-blob").text("This film isn't in the 1,627-screenplay dataset yet.");
    return;
  }
  const revAll = await d3.json(`${DATA}/reversals.json`);
  rev = revAll.find(r => r.slug === slug);

  d3.select("#stage-title").text(`${arc.title} · ${arc.year}`);
  const nRev = rev?.reversals?.length ?? 0;
  d3.select("#stage-sub").html(
    `${arc.token_count?.toLocaleString() ?? "?"} TOKENS &nbsp;·&nbsp; ${nRev} REVERSALS &nbsp;·&nbsp; ` +
    `<span style="color:${C.peak}">● PEAK</span> &nbsp;` +
    `<span style="color:${C.trough}">● TROUGH</span>`
  );
  d3.select("#stage-blob").text("Hover a dot to see its position and sentiment. Screenplay blobs coming soon.");

  const rect = svg.node().getBoundingClientRect();
  const W = rect.width, H = rect.height;
  const m = { top: 40, right: 30, bottom: 40, left: 50 };

  const xs = arc.main_arc.map(p => p.position);
  const ys = arc.main_arc.map(p => p.z_score);
  const yExt = d3.extent(ys);
  const yPad = 0.6;

  const x = d3.scaleLinear().domain([0, 1]).range([m.left, W - m.right]);
  const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H - m.bottom, m.top]);

  // zero line
  svg.append("line")
    .attr("x1", m.left).attr("x2", W - m.right)
    .attr("y1", y(0)).attr("y2", y(0))
    .attr("stroke", C.rule).attr("stroke-dasharray", "2 4");

  // labels
  svg.append("text")
    .attr("x", m.left).attr("y", H - 14)
    .attr("fill", C.inkFaint).attr("font-family", "JetBrains Mono").attr("font-size", 10)
    .text("BEGINNING");
  svg.append("text")
    .attr("x", W - m.right).attr("y", H - 14)
    .attr("text-anchor", "end")
    .attr("fill", C.inkFaint).attr("font-family", "JetBrains Mono").attr("font-size", 10)
    .text("END");

  const lineFn = d3.line()
    .x((_, i) => x(xs[i]))
    .y(d => y(d))
    .curve(d3.curveCatmullRom.alpha(0.6));

  const path = svg.append("path")
    .datum(ys)
    .attr("d", lineFn)
    .attr("fill", "none")
    .attr("stroke", C.ink)
    .attr("stroke-width", 2);

  // animate
  const total = path.node().getTotalLength();
  path.attr("stroke-dasharray", `${total} ${total}`)
      .attr("stroke-dashoffset", total)
      .transition().duration(1200).ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0);

  if (rev && rev.reversals) {
    const dots = svg.append("g").selectAll("circle")
      .data(rev.reversals)
      .join("circle")
      .attr("cx", d => x(d.position))
      .attr("cy", d => y(d.value))
      .attr("r", 0)
      .attr("fill", d => d.type === "peak" ? C.peak : C.trough)
      .attr("stroke", C.bg)
      .attr("stroke-width", 2)
      .on("mouseenter", function (_, d) {
        d3.select(this).transition().duration(120).attr("r", 8);
        const pct = Math.round(d.position * 100);
        d3.select("#stage-blob").html(
          `<strong style="color:var(--ink);font-style:normal;font-family:var(--sans);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase">${d.type}</strong><br/>
           At <span class="num">${pct}%</span> of the screenplay · z = <span class="num">${d.value.toFixed(2)}</span><br/>
           <em style="color:var(--ink-faint)">[screenplay blob at this moment, to be wired in]</em>`
        );
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(120).attr("r", 6);
      });

    dots.transition().delay(1000).duration(500).attr("r", 6);
  }
}

// ─────────────────────────────────────────────────────────
// SCROLLAMA wiring
function wireScrollama() {
  // Intro
  const scInt = scrollama();
  scInt.setup({
    step: "#intro .step",
    offset: 0.55,
  }).onStepEnter(({ element }) => {
    d3.selectAll("#intro .step").classed("is-active", false);
    d3.select(element).classed("is-active", true);
    if (intro.render) intro.render(+element.dataset.step);
  });

  // Archetypes
  const scArch = scrollama();
  scArch.setup({
    step: "#archetypes .step",
    offset: 0.55,
  }).onStepEnter(({ element }) => {
    d3.selectAll("#archetypes .step").classed("is-active", false);
    d3.select(element).classed("is-active", true);
    const a = element.dataset.arch;
    if (archetypes.highlight) {
      archetypes.highlight(a === "all" ? null : +a);
    }
  });

  window.addEventListener("resize", () => {
    scInt.resize();
    scArch.resize();
  });
}

// ─────────────────────────────────────────────────────────
// boot
async function boot() {
  // Pick tonight's film FIRST so both hero and intro share the same random arc.
  // If this fails there is no point continuing the top of the page.
  try { await pickTonightsFilm(); }
  catch (err) {
    console.error("[pickTonightsFilm] failed:", err);
    return;
  }

  // run each section independently so one failure does not blank the page
  const jobs = [
    ["hero",       drawHero],
    ["intro",      drawIntro],
    ["archetypes", drawArchetypes],
    ["era",        drawEra],
    ["explorer",   buildExplorer],
  ];
  for (const [name, fn] of jobs) {
    try { await fn(); }
    catch (err) {
      console.error(`[${name}] failed:`, err);
    }
  }
  wireScrollama();
}

// Wait for the window load event so fonts and layout have settled before
// we measure element sizes. Using DOMContentLoaded is too early because
// webfonts can still shift layout after parse.
if (document.readyState === "complete") {
  boot();
} else {
  window.addEventListener("load", boot, { once: true });
}
