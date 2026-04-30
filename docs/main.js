// ─────────────────────────────────────────────────────────
//  The Shapes of Stories · scrollytelling site
//  Plain HTML/CSS/JS + D3 v7 + scrollama + GSAP/ScrollTrigger/SplitText.
//  Serve from docs/ with `python -m http.server 8000`.
// ─────────────────────────────────────────────────────────

const DATA = "./thesis-outputs";

// Register every GSAP plugin we use. Bonus plugins (MorphSVG, ScrambleText)
// became free in GSAP 3.13.
const _gsapPlugins = ["ScrollTrigger", "SplitText", "MorphSVGPlugin", "ScrambleTextPlugin"]
  .map(n => window[n]).filter(Boolean);
if (window.gsap && _gsapPlugins.length) gsap.registerPlugin(..._gsapPlugins);

// palette
const C = {
  ink:       "#16191e",
  inkDim:    "#3f4651",
  inkFaint:  "#6c7585",
  bg:        "#eef0e7",
  bgRaise:   "#e2e5db",
  amber:     "#8a5a14",
  amberSoft: "#b07a1f",
  rule:      "#b7bdac",
  ruleSoft:  "#c8cdba",
  turnWarm:  "#c25a18",
  turnCool:  "#2b4a6f",
};

const ARCHETYPE_NAMES = {
  0: "Oedipus",
  1: "Icarus",
  2: "Man in a Hole",
  3: "Tragedy",
  4: "Rags to Riches",
  5: "Cinderella",
};
const ARCHETYPE_SHAPES = {
  0: "fall · rise · fall",
  1: "rise · fall",
  2: "fall · rise",
  3: "fall",
  4: "rise",
  5: "rise · fall · rise",
};
const ARCHETYPE_BLURBS = {
  0: "Opens steady, dips early, spends its middle quietly recovering. Climbs late and gets you on its side, only to collapse just when the ending feels earned. Hope, then the hope taken back. <em>Reservoir Dogs</em> is the textbook case: a heist gone wrong, a brief flicker of escape, then everyone bleeds out on the warehouse floor. <em>Catch Me If You Can</em> and <em>Kill Bill: Volume 1</em> live close by.",
  1: "Climbs steadily through the first half and peaks at the midpoint, when everything looks like it’s working. Then it falls hard, bottoming out late before crawling back just enough to land. <em>The Nutty Professor</em> is the cleanest example: Sherman Klump invents a serum, becomes the man he always wanted to be, and watches it eat him alive before he claws his way back. <em>Fight Club</em> sits close behind.",
  2: "If Hollywood has a favourite shape, this is it. More films land here than anywhere else. Things start steady, drop into a long stretch of trouble past the middle, and climb to the highest finish of any shape. <em>Inception</em> and <em>The Matrix</em> are the same shape running in opposite directions, one inward through dream layers, the other outward through a simulation.",
  3: "Opens at the highest starting point of any shape, peaks early, then falls until the end. No recovery. No turn. Just descent. <em>Anora</em> is the textbook case: a Brooklyn stripper marries a Russian oligarch’s son, lives the fantasy for an act, then loses it all. <em>Wedding Crashers</em> runs the same shape as a romcom, despite the genre. Turns out genre doesn’t dictate shape.",
  4: "Opens low, stays under water through the first half, then climbs to the highest finish of any shape. Start bad, end good. In <em>Gladiator</em>, Maximus loses everything, fights his way up, dies a free man. <em>The Truman Show</em> does it inside a TV set: a life built on a lie, the slow waking up to it, and a door that opens at the end.",
  5: "Opens high, falls hard in the first third, then climbs steadily back to finish near where it started. The structure is symmetrical: what was lost is restored. <em>Die Hard 2</em> nails it. <em>The Hangover</em> runs the same pattern played for laughs: four friends wake up in a trashed Vegas suite with no memory and a missing groom, retrace the night, and find him in time for the wedding.",
};
const ARCH_COLOR = {
  0: "#4a6da7",
  1: "#c84630",
  2: "#2a9d8f",
  3: "#8b2a4d",
  4: "#d4a017",
  5: "#6a4c93",
};
// Short, conversational blurbs shown on the flip side of each cluster card.
const ARCHETYPE_FLIP = {
  0: "From the Greek tragedy. He’s born under a curse, thinks he’s outrun it, finds out he hasn’t. Hope, then the hope taken back.",
  1: "From the Greek myth. A boy builds wax wings, flies too close to the sun, falls into the sea. Ambition that ends in the water.",
  2: "The shape that put Vonnegut on the lecture circuit. Someone falls into trouble and climbs back out. The dip is the whole story.",
  3: "Sometimes called “Riches to Rags.” Borrowed from the Greeks. Things are fine, then they aren’t, and they don’t recover.",
  4: "The underdog idiom. Someone starts with nothing and climbs into something. The simplest possible rise.",
  5: "The fairy tale traced as a curve. She makes it to the ball, loses it all at midnight, and is found again by the prince. Three turns, one happy ending.",
};
const ARCH_ORDER = [0, 1, 2, 3, 4, 5];

// Curated set: [title, year, slug, directors[]]
const CURATED = [
  ["Fight Club", 1999, "fight-club-1999", ["Fincher"]],
  ["Interstellar", 2014, "interstellar-2014", ["Nolan"]],
  ["When Harry Met Sally", 1989, "when-harry-met-sally-1989", ["Reiner"]],
  ["Inside Out", 2015, "inside-out-2015", []],
  ["The Wolf of Wall Street", 2013, "the-wolf-of-wall-street-2013", ["Scorsese"]],
  ["Kill Bill: Volume 1", 2003, "kill-bill-vol-1-2003", ["Tarantino"]],
  ["Whiplash", 2014, "whiplash-2014", []],
  ["Inglourious Basterds", 2009, "inglourious-basterds-2009", ["Tarantino"]],
  ["American Beauty", 1999, "american-beauty-1999", []],
  ["The Truman Show", 1998, "the-truman-show-1998", []],
  ["Dead Poets Society", 1989, "dead-poets-society-1989", []],
  ["There Will Be Blood", 2007, "there-will-be-blood-2007", ["Anderson"]],
  ["Se7en", 1995, "se7en-1995", ["Fincher"]],
  ["Eternal Sunshine of the Spotless Mind", 2004, "eternal-sunshine-of-the-spotless-mind-2004", []],
  ["La La Land", 2016, "la-la-land-2016", []],
  ["Blade Runner", 1982, "blade-runner-1982", []],
  ["Prisoners", 2013, "prisoners-2013", ["Villeneuve"]],
  ["WALL-E", 2008, "wall-e-2008", []],
  ["Schindler’s List", 1993, "schindlers-list-1993", ["Spielberg"]],
  ["Forrest Gump", 1994, "forrest-gump-1994", []],
  ["Shutter Island", 2010, "shutter-island-2010", ["Scorsese"]],
  ["Good Will Hunting", 1997, "good-will-hunting-1997", []],
  ["500 Days of Summer", 2009, "500-days-of-summer-2009", []],
  ["Black Swan", 2010, "black-swan-2010", []],
];

// Hand-written notes per turning point — keyed by slug, ordered to match
// reversals.json's reversals array. Add more entries as they are written.
const NOTES = {
  "fight-club-1999": [
    "Narrator finally meets Tyler. The pivot from insomnia and IKEA into a different life entirely.",
    "First fight in the parking lot. The body learning a vocabulary the mind had been suppressing.",
    "Project Mayhem hardens. The thing the narrator built starts moving without him.",
    "Marla on the phone. Tyler is gone, or was never there. The collapse begins.",
  ],
};

// ─────────────────────────────────────────────────────────
// Tonight's film: random pick from CURATED, used by hero + intro scrolly.
const tonight = { slug: null, arc: null, reversals: null };
// Cached reversals.json — fetched once at boot, reused on every shuffle so
// shuffles don't pay the network + parse cost repeatedly.
let reversalsAll = null;
async function getReversalsAll() {
  if (!reversalsAll) reversalsAll = await d3.json(`${DATA}/reversals.json`);
  return reversalsAll;
}

async function pickTonightsFilm() {
  const pool = CURATED.map(c => c[2]);
  tonight.slug = pool[Math.floor(Math.random() * pool.length)];
  seenSlugs.add(tonight.slug);
  tonight.arc = await d3.json(`${DATA}/arcs/${tonight.slug}_arc.json`);
  const revAll = await getReversalsAll();
  tonight.reversals = revAll.find(r => r.slug === tonight.slug);
}

// ─────────────────────────────────────────────────────────
// HERO
function measure(el) {
  const r = el.getBoundingClientRect();
  return { w: Math.max(r.width, 320), h: Math.max(r.height, 240) };
}

// One bold zero baseline (the "plane" the line sits on), BEGIN/END anchored
// to that baseline, and rotated POSITIVE / NEGATIVE labels on the far left
// edge — out of the way of any annotations or busy chart areas.
function drawAxisFrame(svg, { x, y, x0, x1, withYSides = true, ySide = "left", withEndLabels = true } = {}) {
  // prominent zero baseline
  svg.append("line")
    .attr("class", "y-zero")
    .attr("x1", x0).attr("x2", x1)
    .attr("y1", y(0)).attr("y2", y(0))
    .attr("stroke", "#9aa18d")
    .attr("stroke-width", 1.4)
    .attr("stroke-opacity", 0.7);

  // BEGIN / END at the baseline endpoints — anchored to where the line
  // begins and ends, not at chart corners that get covered by overlay text.
  if (withEndLabels) {
    svg.append("text").attr("class", "axis-end")
      .attr("x", x0).attr("y", y(0) + 18)
      .attr("text-anchor", "start")
      .text("BEGINNING");
    svg.append("text").attr("class", "axis-end")
      .attr("x", x1).attr("y", y(0) + 18)
      .attr("text-anchor", "end")
      .text("END");
  }

  // POSITIVE / NEGATIVE — horizontal labels at the top and bottom of the plot
  // area. ySide picks left or right anchoring.
  if (withYSides) {
    const topPx = y.range()[1];
    const botPx = y.range()[0];
    const onRight = ySide === "right";
    const xLab = onRight ? x1 : x0;
    const anchor = onRight ? "end" : "start";
    svg.append("text").attr("class", "axis-y-side")
      .attr("x", xLab).attr("y", topPx - 8)
      .attr("text-anchor", anchor)
      .text("POSITIVE :)");
    svg.append("text").attr("class", "axis-y-side")
      .attr("x", xLab).attr("y", botPx + 18)
      .attr("text-anchor", anchor)
      .text("NEGATIVE :(");
  }
}

// Render the hero arc path. Idempotent — clears any previous path first so it
// can be called both at boot and on a reshuffle.
function renderHeroArc() {
  if (!tonight.arc) return;
  const svg = d3.select(".hero-arc");
  svg.selectAll("path").remove();

  const { w, h } = measure(svg.node().parentNode);
  svg.attr("viewBox", `0 0 ${w} ${h}`).attr("preserveAspectRatio", "none");

  const pad = 80;
  const ys = tonight.arc.main_arc.map(p => p.z_score);
  const yExt = d3.extent(ys);
  const x = d3.scaleLinear().domain([0, 1]).range([pad, w - pad]);
  const y = d3.scaleLinear().domain([yExt[0] - 0.5, yExt[1] + 0.5]).range([h - pad, pad]);
  const lineFn = d3.line()
    .x((_, i, a) => x(i / (a.length - 1)))
    .y(d => y(d))
    .curve(d3.curveCatmullRom.alpha(0.6));

  const path = svg.append("path")
    .datum(ys)
    .attr("d", lineFn)
    .attr("fill", "none")
    .attr("stroke", C.ink)
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round")
    .attr("vector-effect", "non-scaling-stroke");

  const total = path.node().getTotalLength();
  path.attr("stroke-dasharray", `${total} ${total}`)
      .attr("stroke-dashoffset", total);

  if (window.gsap) {
    gsap.to(path.node(), {
      strokeDashoffset: 0,
      duration: 2.4,
      ease: "power2.inOut",
      delay: 0.2,
    });
  }
}

// Render the "tonight's film" label content.
function renderHeroLabel() {
  const label = document.querySelector("#hero-film");
  if (!label || !tonight.arc) return;
  label.innerHTML =
    `<span class="hero-film-key">tonight’s film</span>` +
    `<span class="hero-film-val"><em>${tonight.arc.title}</em> (${tonight.arc.year})</span>`;
}

// Sync the intro-prelude headline scramble target to the current film title.
// The chars pool is the title's OWN letters (data-scramble-chars), so during
// the scramble each random character has a width close to the final text —
// keeps the headline stable at the same line count instead of flickering
// between 2 and 3 lines as wide-vs-narrow random chars are picked.
function renderIntroPreludeLabels({ animate = false } = {}) {
  if (!tonight.arc) return;
  const titleEl = document.getElementById("intro-prelude-title");
  if (!titleEl) return;
  const t = tonight.arc.title;
  // Build the scramble pool from the title's own letters PLUS a small set of
  // common letters so ScrambleText has enough variety to avoid leaving any
  // edge-case residual character in unusually short titles.
  const titleLetters = t.replace(/\s+/g, "");
  const charsPool = (titleLetters + "abcdefghijklmnoprstu") || "lowerCase";
  titleEl.dataset.final = t;
  titleEl.dataset.scrambleChars = charsPool;
  if (animate && window.gsap && window.ScrambleTextPlugin) {
    // Kill any in-flight scramble on this element so a rapid second click
    // can't leave orphan characters from the previous chars pool. Also
    // blank the textContent for a clean scramble start.
    gsap.killTweensOf(titleEl);
    titleEl.textContent = "";
    gsap.to(titleEl, {
      duration: 1.1,
      scrambleText: {
        text: t,
        chars: charsPool,
        revealDelay: 0.25,
        speed: 0.45,
        tweenLength: false,
      },
      ease: "none",
    });
  } else {
    titleEl.textContent = t;
  }
}

// Pick a different film from the curated set and re-render hero arc, label,
// and intro pin. Triggered by the "Haven't seen, give me another" button.
//
// The scramble + label updates fire IMMEDIATELY using the title we already
// have in CURATED — we don't wait for the arc fetch, so the user gets a
// smooth, responsive flicker the moment they click. The heavy redraw work
// is deferred to the next animation frame so it doesn't block the scramble.
//
// reshuffleGen is a monotonic counter so a stale fetch from a previous click
// can't apply its arc data after a newer click has already moved on. Without
// this, rapid double-clicks could trigger two redraws and lock the scramble
// mid-animation while the second relayout blocks the main thread.
let reshuffleGen = 0;
// Films the user has already been shown across the warm-up section. Initial
// pickTonightsFilm seeds it; each reshuffle adds the new slug. Once the user
// has cycled through all 24 curated films, the set resets so the loop can
// continue.
const seenSlugs = new Set();
async function reshuffleFilm() {
  const oldSlug = tonight.slug;
  if (oldSlug) seenSlugs.add(oldSlug);
  const pool = CURATED.filter(c => c[2] !== oldSlug);
  if (!pool.length) return;

  // Prefer films the user hasn't seen yet. Only fall back to seen films when
  // every other curated title has been shown.
  let candidates = pool.filter(c => !seenSlugs.has(c[2]));
  if (candidates.length === 0) {
    seenSlugs.clear();
    if (oldSlug) seenSlugs.add(oldSlug);
    candidates = pool;
  }

  // Soft length bias — closer-in-length titles get more weight, but every
  // candidate keeps a non-zero chance so distant lengths can still come up.
  // weight = 1 / (1 + 0.5 * |Δlen|) — delta 0 → 1.0, delta 10 → 0.17, etc.
  const currentLen = (tonight.arc?.title || "").length;
  const weighted = candidates.map(c => ({
    c,
    w: 1 / (1 + 0.5 * Math.abs(c[0].length - currentLen)),
  }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  let pick = weighted[weighted.length - 1].c;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) { pick = x.c; break; }
  }
  const [nextTitle, nextYear, nextSlug] = pick;
  const gen = ++reshuffleGen;
  tonight.slug = nextSlug;

  // Fire the scramble + label updates with the title we already know. Stub
  // tonight.arc with the title so renderHeroLabel / renderIntroPreludeLabels
  // can paint without waiting on the arc JSON.
  const stubArc = { title: nextTitle, year: nextYear };
  tonight.arc = stubArc;
  renderHeroLabel();
  renderIntroPreludeLabels({ animate: true });
  const beatFilmEl = document.getElementById("intro-beat-film");
  if (beatFilmEl) beatFilmEl.textContent = nextTitle;

  // Now fetch the new arc (+ cached reversals) and redraw the heavy bits.
  let arc, reversals;
  try {
    arc = await d3.json(`${DATA}/arcs/${nextSlug}_arc.json`);
    const revAll = await getReversalsAll();
    reversals = revAll.find(r => r.slug === nextSlug);
  } catch (err) {
    console.error("[reshuffle] failed:", err);
    return;
  }
  // Bail if a newer shuffle has fired in the meantime — that click's data is
  // the truth now, this one is stale.
  if (gen !== reshuffleGen) return;
  tonight.arc = arc;
  tonight.reversals = reversals;

  // Defer to the next frame so the scramble animation gets its own paint
  // before the synchronous redraw + dot-snap work runs.
  requestAnimationFrame(() => {
    if (gen !== reshuffleGen) return;  // a newer shuffle landed first
    renderHeroArc();
    if (intro.relayout) intro.relayout();
  });
}

let heroSetupDone = false;

async function drawHero() {
  if (!tonight.arc) { console.warn("[hero] no tonight.arc — skipping"); return; }
  renderHeroArc();
  renderHeroLabel();
  if (heroSetupDone) return;
  heroSetupDone = true;

  if (window.gsap) {
    if (window.ScrollTrigger) {
      // Fade the whole hero out by ~70% of its scroll, so by the time the
      // user is approaching vonnegut-1, hero is visually gone — no more
      // "two sections in the same frame" feeling.
      gsap.to(".hero-arc", {
        opacity: 0, y: -80,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true }
      });
      gsap.to(".hero-inner", {
        y: -80, opacity: 0,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true }
      });
      // Hero film label — one-shot scroll fade (initial opacity is 0 in CSS).
      // fromTo with immediateRender:false keeps it hidden until triggered.
      gsap.fromTo(".hero-film",
        { opacity: 1, y: 0 },
        {
          opacity: 0, y: -20, duration: 0.4, ease: "power2.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: ".hero",
            start: "55% top",
            toggleActions: "play none none reverse",
          },
        }
      );
      // Reveal label as the hero arc nears completion of its draw.
      gsap.to(".hero-film", { opacity: 1, duration: 0.8, ease: "power2.out", delay: 2.0 });

      // Reveal the scroll arrow AFTER the hero entrance settles.
      const hint = document.querySelector(".scroll-hint");
      if (hint) gsap.delayedCall(2.0, () => hint.classList.add("is-revealed"));

      // First-scroll handler dismisses the scroll arrow — single-fire.
      const onFirstScroll = () => {
        if (window.scrollY < 4) return;
        if (hint) {
          hint.classList.add("is-dismissed");
          setTimeout(() => hint.remove(), 500);
        }
        window.removeEventListener("scroll", onFirstScroll);
      };
      window.addEventListener("scroll", onFirstScroll, { passive: true });
    }
  }

  // Wire the shuffle button.
  const shuffleBtn = document.getElementById("hero-shuffle");
  if (shuffleBtn) shuffleBtn.addEventListener("click", reshuffleFilm);
}

// ─────────────────────────────────────────────────────────
// INTRO PIN — full-bleed, scroll-scrubbed scene with two floating beats.
// The arc draws as you scroll the first segment, beat copy fades, dashed
// connectors "boop boop boop" in sequence after the line is drawn.
const intro = { arc: null, reversals: null };

// Decide whether each beat should sit in the top half or bottom half of the
// stage based on where the arc passes through the LEFT region (both beats
// are anchored to the left edge of the stage). Keeps the copy from sitting
// on top of the line.
function placeIntroBeats(ys, yScale) {
  const stagePxMid = (yScale.range()[1] + yScale.range()[0]) / 2;

  // Both beats live at left: var(--gutter), so we use the LEFT third of the
  // arc as the avoidance zone for both. (When beat 1 is active, the entire
  // line is drawn and dots are armed — but the text still only collides with
  // the line in the left region of the stage where it sits.)
  const leftThird = ys.slice(0, Math.ceil(ys.length / 3));
  const leftAvgPx = leftThird.reduce((s, v) => s + yScale(v), 0) / leftThird.length;

  const place = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    if (leftAvgPx < stagePxMid) {
      // Line is in upper half here — push beat to lower half
      el.style.top = "auto";
      el.style.bottom = "12vh";
    } else {
      // Line is in lower half — beat goes upper
      el.style.top = "12vh";
      el.style.bottom = "auto";
    }
  };
  place('.intro-beat[data-beat="0"]');
  place('.intro-beat[data-beat="1"]');
}

function drawIntro() {
  if (!tonight.arc) { console.warn("[intro] no tonight.arc — skipping"); return; }
  const svg = d3.select(".intro-svg");
  const stage = svg.node().parentNode;

  const fc = tonight.arc;
  const revFc = tonight.reversals;
  intro.arc = fc;
  intro.reversals = revFc;

  const ref = document.querySelector("#intro-film-ref");
  if (ref) ref.textContent = fc.title;
  // Beat-0 copy mentions the film's peaks/valleys; sync the inline em
  // (intro-beat-film) to the current movie title.
  const beatFilmEl = document.getElementById("intro-beat-film");
  if (beatFilmEl) beatFilmEl.textContent = fc.title;

  function layoutAndDraw() {
    const r = stage.getBoundingClientRect();
    const W = Math.max(r.width, 480);
    const H = Math.max(r.height, 360);
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "none");
    svg.selectAll("*").remove();

    const m = { top: 80, right: 80, bottom: 80, left: 80 };
    const ys = fc.main_arc.map(p => p.z_score);
    const xs = fc.main_arc.map(p => p.position);
    const yExt = d3.extent(ys);
    const yPad = 0.6;

    const x = d3.scaleLinear().domain([0, 1]).range([m.left, W - m.right]);
    const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H - m.bottom, m.top]);

    drawAxisFrame(svg, { x, y, x0: m.left, x1: W - m.right, ySide: "right" });

    // Hide the axis elements so the scrub onUpdate can fade them in
    // sequentially (baseline → BEGIN/END → POSITIVE/NEGATIVE → beat 0 text).
    svg.select(".y-zero").style("opacity", 0);
    svg.selectAll(".axis-end").style("opacity", 0);
    svg.selectAll(".axis-y-side").style("opacity", 0);

    const lineFn = d3.line()
      .x((_, i) => x(xs[i]))
      .y(d => y(d))
      .curve(d3.curveCatmullRom.alpha(0.6));

    // Approximate runtime in minutes from token count (≈250 tokens per page,
    // ≈1 page per minute of screen time). Falls back to 110 if missing.
    const runtimeMin = tonight.arc.token_count
      ? Math.max(60, Math.round(tonight.arc.token_count / 250))
      : 110;

    // Arc-to-baseline dashed connectors — one vertical dashed line per data
    // point, from the arc value down to y(0). They start collapsed at the
    // dot and animate sequentially via a TIME-BASED transition (not scrub)
    // once the line finishes drawing.
    const arcConnectors = svg.append("g").attr("class", "arc-connectors");
    const connectorData = ys.map((v, i) => ({
      px: x(xs[i]),
      py: y(v),
      t: i / Math.max(1, ys.length - 1),
    }));
    arcConnectors.selectAll("line")
      .data(connectorData)
      .join("line")
      .attr("x1", d => d.px).attr("x2", d => d.px)
      .attr("y1", d => d.py).attr("y2", d => d.py)  // collapsed at the dot
      .attr("stroke", C.inkDim)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2 4")
      .attr("opacity", 0)
      .attr("pointer-events", "none");
    intro.arcConnectors = arcConnectors;
    intro.connectorData = connectorData;
    intro.zeroY = y(0);

    // Minute labels — small mono numbers under each connector, on the same
    // baseline row as BEGIN / END. Endpoints are hidden so they don't crash
    // into BEGIN / END text.
    const minuteLabelsG = svg.append("g").attr("class", "intro-minute-labels");
    minuteLabelsG.selectAll("text")
      .data(connectorData)
      .join("text")
      .attr("x", d => d.px)
      .attr("y", y(0) + 36)            // separate row below BEGIN / END
      .attr("text-anchor", "middle")
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", 9)
      .attr("letter-spacing", "0.04em")
      .attr("fill", C.inkFaint)
      .attr("opacity", 0)
      .style("display", d => (d.t < 0.03 || d.t > 0.97) ? "none" : null)
      .text(d => `${Math.round(d.t * runtimeMin)}m`);
    intro.minuteLabelsG = minuteLabelsG;
    intro.connectorBooped = false;

    const path = svg.append("path")
      .attr("class", "intro-path")
      .datum(ys)
      .attr("d", lineFn)
      .attr("fill", "none")
      .attr("stroke", C.ink)
      .attr("stroke-width", 2.4);

    const total = path.node().getTotalLength();
    path.attr("stroke-dasharray", `${total} ${total}`)
        .attr("stroke-dashoffset", total);
    intro.path = path;
    intro.totalLen = total;

    // Turning-point dots. Hidden (r=0) until the line finishes drawing.
    const notes = NOTES[tonight.slug] || [];
    const dotsG = svg.append("g").attr("class", "intro-dots");
    // Tooltip — same style as the archetype-pin closest-15 hover tooltip:
    // Inter sans-serif 12px, ink, white-ish bg, faint rule border, padded.
    const tooltip = svg.append("g").attr("class", "intro-tip").style("display", "none")
      .attr("pointer-events", "none");
    const tipBg = tooltip.append("rect").attr("fill", C.bg).attr("stroke", C.rule).attr("rx", 2);
    const tipText = tooltip.append("text")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-size", 12)
      .attr("fill", C.ink);

    // Placeholder annotations for peak/trough hover — until real scene
    // notes are written into the NOTES table, the tooltip surfaces one of
    // these so the interaction shape is visible.
    const placeholderAnnotations = [
      "The page tightens. Dialogue narrows, the action accelerates.",
      "A reversal — what looked settled comes apart.",
      "Quiet beat. The character is alone with a consequence.",
      "The high point of the act. The room they’ve been moving toward.",
      "Crisis. Words run hot, scenes shorten.",
      "Pause. Someone says the unspoken thing.",
      "The trailer scene — big movement, big swing.",
      "A small triumph that the next page will undo.",
    ];

    // Compute local extrema (peaks and troughs) directly from the z_score
    // samples. These are the moments where the rendered arc visually turns —
    // exactly what an audience reads as a "turning point." Each entry holds
    // the data-space position/value plus a type tag for downstream styling
    // / annotation (peak vs. trough). Endpoints are excluded since they
    // don't have neighbors on both sides.
    const extrema = [];
    for (let i = 1; i < ys.length - 1; i++) {
      const isPeak   = ys[i] > ys[i - 1] && ys[i] > ys[i + 1];
      const isTrough = ys[i] < ys[i - 1] && ys[i] < ys[i + 1];
      if (isPeak || isTrough) {
        extrema.push({
          position: xs[i],
          value: ys[i],
          type: isPeak ? "peak" : "trough",
        });
      }
    }

    if (extrema.length) {
      // Snap each extremum onto the rendered Catmull-Rom curve so the dot
      // sits exactly on the line. The path is x-monotonic, so we binary-
      // search by length (~18 iterations) instead of sweeping hundreds of
      // samples — keeps shuffle responsive.
      const pathNode = path.node();
      const snapped = extrema.map(d => {
        const targetX = x(d.position);
        let lo = 0, hi = total;
        for (let i = 0; i < 18; i++) {
          const mid = (lo + hi) / 2;
          const p = pathNode.getPointAtLength(mid);
          if (p.x < targetX) lo = mid;
          else hi = mid;
        }
        const p = pathNode.getPointAtLength((lo + hi) / 2);
        return { cx: p.x, cy: p.y };
      });

      dotsG.selectAll("circle")
        .data(extrema)
        .join("circle")
        .attr("cx", (_, i) => snapped[i].cx).attr("cy", (_, i) => snapped[i].cy)
        .attr("r", 0)
        .attr("fill", C.inkDim)               // neutral dark for both peaks and troughs
        .attr("stroke", C.bg).attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseenter", function (_, d) {
          const i = extrema.indexOf(d);
          d3.select(this).transition().duration(150).attr("r", 9);
          // NOTES is now indexed by extrema order (peak/trough) — the user
          // re-annotates against this stable list per slug. Falls back to
          // the placeholder copy until real notes are written.
          const note = notes[i] || placeholderAnnotations[i % placeholderAnnotations.length];
          tipText.text(note);
          const bb = tipText.node().getBBox();
          const padX = 14, padY = 10;
          const boxW = bb.width + padX * 2;
          const boxH = bb.height + padY * 2;
          // Anchor the tooltip beside the dot, flipping side / clamping to
          // chart bounds so it never escapes the visible area.
          const cx = snapped[i].cx, cy = snapped[i].cy;
          let tx = cx + 14;
          if (tx + boxW > W - 8) tx = cx - boxW - 14;
          tx = Math.max(8, tx);
          let ty = cy - boxH - 10;
          if (ty < 8) ty = cy + 14;
          tipText.attr("x", tx + padX).attr("y", ty + padY + bb.height - 3);
          tipBg.attr("x", tx).attr("y", ty)
            .attr("width", boxW).attr("height", boxH);
          tooltip.style("display", null);
        })
        .on("mouseleave", function () {
          d3.select(this).transition().duration(150).attr("r", 6);
          tooltip.style("display", "none");
        });
    }
    intro.dotsG = dotsG;
    intro.yScale = y;

    // Dynamic beat placement — push each beat into the half of the chart
    // (top or bottom) where the line ISN'T spending most of its time, so the
    // copy doesn't overlap the arc. Recomputed per layout (and per shuffle).
    placeIntroBeats(ys, y, m, H);
  }

  layoutAndDraw();
  intro.relayout = layoutAndDraw;

  // ScrollTrigger drives three beats. Each beat = 1/3 of the section progress.
  // Beat 0 (0..0.45): line draws from 0 → fully drawn. Beat 0 copy visible.
  // Beat 1 (0.45..0.7): line stays. Beat 1 copy visible.
  // Beat 2 (0.7..1):    dots pop in. Beat 2 copy visible.
  if (window.gsap && window.ScrollTrigger) {
    const beats = [...document.querySelectorAll(".intro-beat")];
    gsap.set(beats, { opacity: 0, y: 24 });

    let activeBeat = -1;
    const setBeat = idx => {
      if (idx === activeBeat) return;
      activeBeat = idx;
      beats.forEach((b, i) => {
        gsap.to(b, {
          opacity: i === idx ? 1 : 0,
          y: i === idx ? 0 : (i < idx ? -16 : 24),
          duration: 0.4, ease: "power2.out",
        });
      });
    };

    let dotsArmed = false;
    const armDots = (on) => {
      if (on === dotsArmed) return;
      dotsArmed = on;
      const dots = intro.dotsG.selectAll("circle");
      if (on) dots.transition("dots").delay((_, i) => 100 + i * 80).duration(360).attr("r", 6);
      else    dots.transition("dots").duration(200).attr("r", 0);
    };

    // Linear interpolator clamped to [0, 1] over a sub-range of progress.
    const phase = (p, a, b) => {
      if (p <= a) return 0;
      if (p >= b) return 1;
      return (p - a) / (b - a);
    };

    // Time-based "boop boop boop" reveal of the arc-to-baseline connectors
    // and minute labels. Runs once when the line finishes drawing; reverses
    // if the user scrolls back into the line-drawing phase.
    const startConnectorBoop = () => {
      if (!intro.arcConnectors || intro.connectorBooped) return;
      intro.connectorBooped = true;
      intro.arcConnectors.selectAll("line").transition("boop")
        .delay((d, i) => i * 75)
        .duration(220)
        .ease(d3.easeQuadOut)
        .attr("y2", intro.zeroY)
        .attr("opacity", 0.55);
      if (intro.minuteLabelsG) {
        intro.minuteLabelsG.selectAll("text").transition("boop-label")
          .delay((d, i) => i * 75 + 80)
          .duration(180)
          .ease(d3.easeQuadOut)
          .attr("opacity", 0.6);
      }
    };
    const resetConnectors = () => {
      if (!intro.connectorBooped) return;
      intro.connectorBooped = false;
      if (intro.arcConnectors) {
        intro.arcConnectors.selectAll("line").interrupt("boop")
          .attr("y2", d => d.py)
          .attr("opacity", 0);
      }
      if (intro.minuteLabelsG) {
        intro.minuteLabelsG.selectAll("text").interrupt("boop-label")
          .attr("opacity", 0);
      }
    };

    // Phased reveal driven by scroll progress.
    //
    //  0.00 → 0.05  zero baseline fades in
    //  0.05 → 0.12  BEGINNING / END labels fade in (staggered)
    //  0.12 → 0.20  POSITIVE / NEGATIVE labels fade in (staggered)
    //  0.20 → 0.30  beat 0 ("Highs and lows.") fades up
    //  0.30 → 0.55  arc draws (connectors stay hidden)
    //  0.55 → 0.78  arc-to-baseline dashed connectors "boop boop boop" in
    //               sequence; dots arm in the same window
    //  0.78 → 1.00  beat 1 ("turning points") transitions in
    ScrollTrigger.create({
      trigger: ".intro-pin",
      pin: ".intro-stage",
      start: "top top",
      end: "+=340%",
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: self => {
        const p = self.progress;

        // Axis structure
        const yZeroEl = svg.select(".y-zero").node();
        if (yZeroEl) yZeroEl.style.opacity = phase(p, 0.00, 0.05);
        svg.selectAll(".axis-end").nodes().forEach((el, i) => {
          el.style.opacity = phase(p, 0.05 + i * 0.025, 0.12 + i * 0.025);
        });
        svg.selectAll(".axis-y-side").nodes().forEach((el, i) => {
          el.style.opacity = phase(p, 0.12 + i * 0.025, 0.20 + i * 0.025);
        });

        // Beat text — beat 0 stays visible through the boop sequence
        let idx = -1;
        if (p >= 0.20 && p < 0.78) idx = 0;
        else if (p >= 0.78) idx = 1;
        setBeat(idx);

        // Arc draws 0.30 → 0.55
        const drawT = phase(p, 0.30, 0.55);
        if (intro.path && intro.totalLen) {
          intro.path.attr("stroke-dashoffset", intro.totalLen * (1 - drawT));
        }

        // Connectors auto-load (time-based) once the line finishes drawing.
        // They retract if the user scrolls back into the line-drawing phase.
        if (drawT >= 1) startConnectorBoop();
        else if (drawT < 0.95) resetConnectors();

        // Dots arm only at beat 1 ("turning points") — they're the subject
        // of that beat, so reserving them for that stage keeps beat 0
        // focused on the line + connectors + minute labels.
        armDots(p >= 0.78);
      }
    });

    // initial state
    setBeat(-1);
  }
}

// ─────────────────────────────────────────────────────────
// ARCHETYPE DATA (preloaded, used by both the cluster overview and the pin)
// ARCH_DATA[id] = {
//   mean: number[20],          // archetype mean arc
//   closest: number[20][],     // top-N closest cluster members by weight
//   color: string,
//   filmCount: number,
// }
const ARCH_DATA = {};
let CLUSTERED = null;

async function loadArchData() {
  const shapes = await d3.csv(`${DATA}/archetype_shapes.csv`, d3.autoType);
  CLUSTERED = await d3.csv(`${DATA}/emotional_arcs_clustered.csv`, d3.autoType);

  const wcols = d3.range(1, 21).map(i => `w${String(i).padStart(2, "0")}`);
  const arcOf = row => wcols.map(c => +row[c]);

  // archetype_shapes.csv is 1-indexed by archetype_id, but emotional_arcs_clustered.csv
  // uses 0-indexed dominant_archetype. Match by arc_name to bridge the two.
  const CLOSEST_N = 20;
  for (const id of ARCH_ORDER) {
    const shape = shapes.find(r => r.arc_name === ARCHETYPE_NAMES[id]);
    if (!shape) { console.warn(`[archdata] no shape row for ${ARCHETYPE_NAMES[id]}`); continue; }
    const members = CLUSTERED.filter(r => r.dominant_archetype === id);
    const closest = [...members]
      .sort((a, b) => b[`arch_${id}_weight`] - a[`arch_${id}_weight`])
      .slice(0, CLOSEST_N)
      .map(r => ({
        ys: arcOf(r),
        title: r.title,
        year: r.year,
        weight: r[`arch_${id}_weight`],
      }));
    ARCH_DATA[id] = {
      mean: arcOf(shape),
      closest,
      color: ARCH_COLOR[id],
      filmCount: shape.film_count,
    };
  }

  // copy-side updates
  d3.selectAll("[data-count]").each(function () {
    const id = +this.dataset.count;
    this.textContent = ARCH_DATA[id]?.filmCount?.toLocaleString() ?? "…";
  });
}

// ─────────────────────────────────────────────────────────
// CLUSTER OVERVIEW — six flip cards in a 3×2 grid. Front: the mean arc with
// labels. Back: short blurb on the archetype's color. Click to flip; click
// elsewhere to flip back.
function drawClusterOverview() {
  const grid = document.querySelector(".cluster-grid");
  if (!grid) return;
  grid.innerHTML = "";

  ARCH_ORDER.forEach(id => {
    const card = document.createElement("div");
    card.className = "flip-card";
    card.dataset.archId = id;
    card.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-front"><svg class="cell-svg"></svg></div>
        <div class="flip-back" style="background:${ARCH_COLOR[id]}">
          <h3 class="arch-name">${ARCHETYPE_NAMES[id]}</h3>
          <p class="arch-blurb">${ARCHETYPE_FLIP[id]}</p>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Shared y-extent so all six cards use the same vertical scale.
  const allYs = ARCH_ORDER.flatMap(id => [
    ...ARCH_DATA[id].mean,
    ...ARCH_DATA[id].closest.flatMap(c => c.ys),
  ]);
  const yExt = d3.extent(allYs);
  const yPad = 0.4;

  ARCH_ORDER.forEach(id => {
    const cardEl = grid.querySelector(`.flip-card[data-arch-id="${id}"]`);
    const svgEl = cardEl.querySelector("svg.cell-svg");
    const { w: W, h: H } = measure(svgEl.parentNode);
    const svg = d3.select(svgEl)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "none");
    svg.selectAll("*").remove();

    const pad = 28;
    const x = d3.scaleLinear().domain([0, 19]).range([pad, W - pad]);
    const y = d3.scaleLinear()
      .domain([yExt[0] - yPad, yExt[1] + yPad])
      .range([H - pad - 14, pad + 76]);
    const lineFn = d3.line()
      .x((_, i) => x(i))
      .y(d => y(d))
      .curve(d3.curveCatmullRom.alpha(0.6));

    svg.append("text")
      .attr("x", pad).attr("y", pad + 18)
      .attr("fill", C.ink)
      .attr("font-family", "Fraunces, serif")
      .attr("font-variation-settings", '"opsz" 72, "SOFT" 30')
      .attr("font-size", 32)
      .text(ARCHETYPE_NAMES[id]);

    svg.append("text")
      .attr("x", pad).attr("y", pad + 40)
      .attr("fill", ARCH_COLOR[id])
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", 10)
      .attr("letter-spacing", "0.14em")
      .text(ARCHETYPE_SHAPES[id].toUpperCase());

    svg.append("text")
      .attr("x", pad).attr("y", pad + 56)
      .attr("fill", C.inkFaint)
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", 10)
      .attr("letter-spacing", "0.08em")
      .text(`${ARCH_DATA[id].filmCount} FILMS`);

    svg.append("line")
      .attr("x1", pad).attr("x2", W - pad)
      .attr("y1", y(0)).attr("y2", y(0))
      .attr("stroke", "#8e9683")
      .attr("stroke-width", 1.2)
      .attr("stroke-opacity", 0.7);

    svg.append("g").attr("class", "ghosts")
      .selectAll("path")
      .data(ARCH_DATA[id].closest)
      .join("path")
      .attr("d", c => lineFn(c.ys))
      .attr("fill", "none")
      .attr("stroke", ARCH_COLOR[id])
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.35);

    svg.append("path")
      .attr("class", "mean")
      .attr("d", lineFn(ARCH_DATA[id].mean))
      .attr("fill", "none")
      .attr("stroke", ARCH_COLOR[id])
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round");
  });

  // GSAP: stagger-draw the six mean arcs as the section enters view.
  if (window.gsap && window.ScrollTrigger) {
    const means = [...grid.querySelectorAll(".flip-front .mean")];
    const totals = means.map(p => p.getTotalLength());
    means.forEach((p, i) => {
      gsap.set(p, { strokeDasharray: `${totals[i]} ${totals[i]}`, strokeDashoffset: totals[i] });
    });
    gsap.to(means, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: "power2.inOut",
      stagger: 0.12,
      scrollTrigger: { trigger: ".cluster-board", start: "top 75%" }
    });
    gsap.fromTo([...grid.querySelectorAll(".flip-front .ghosts path")],
      { opacity: 0 },
      {
        opacity: 0.18, duration: 0.5, ease: "power2.out", stagger: 0.005, delay: 0.2,
        scrollTrigger: { trigger: ".cluster-board", start: "top 75%" }
      }
    );
  }

  // Click-to-flip. Each card toggles independently — multiple can be open at
  // once. Click anywhere outside the grid flips all of them back.
  grid.querySelectorAll(".flip-card").forEach(card => {
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      card.classList.toggle("is-flipped");
    });
  });
  document.addEventListener("click", () => {
    grid.querySelectorAll(".flip-card.is-flipped")
      .forEach(c => c.classList.remove("is-flipped"));
  });
}

// ─────────────────────────────────────────────────────────
// ARCHETYPES PIN — single big chart, scrub-driven morph through all six.
const arch = {};

function setupArchPin() {
  const svg = d3.select(".pin-svg");
  const stage = svg.node().parentNode;
  arch.svg = svg;
  arch.stage = stage;
  arch.scrollTrigger = null;

  function layoutAndDraw() {
    const r = stage.getBoundingClientRect();
    const W = Math.max(r.width, 480);
    const H = Math.max(r.height, 360);
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "none");
    svg.selectAll("*").remove();

    // Tight margins so the chart fills the entire viewport. The caption sits
    // bottom-left over a fade-to-bg backdrop (see .pin-stage .pin-meta).
    const m = { top: 60, right: 60, bottom: 60, left: 60 };
    const allYs = ARCH_ORDER.flatMap(id => [
      ...ARCH_DATA[id].mean,
      ...ARCH_DATA[id].closest.flatMap(c => c.ys),
    ]);
    const yExt = d3.extent(allYs);
    const yPad = 0.35;

    const x = d3.scaleLinear().domain([0, 19]).range([m.left, W - m.right]);
    const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H - m.bottom, m.top]);
    const lineFn = d3.line().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveCatmullRom.alpha(0.6));

    arch.dims = { W, H, m };
    arch.x = x; arch.y = y; arch.lineFn = lineFn;

    drawAxisFrame(svg, { x, y, x0: m.left, x1: W - m.right, withYSides: false, withEndLabels: false });

    // Hide the axis baseline initially — the intro timeline fades it in
    // before the proxy lines unravel.
    svg.select(".y-zero").style("opacity", 0);

    // Pre-compute d-strings for mean and closest-match paths at every
    // archetype, so MorphSVG can tween between them without rebuilding the
    // path each frame.
    arch.meanD    = ARCH_ORDER.map(id => lineFn(ARCH_DATA[id].mean));
    arch.closestD = ARCH_ORDER.map(id => ARCH_DATA[id].closest.map(c => lineFn(c.ys)));

    // Closest-match outlines — one path element per slot, MorphSVG tweens d
    // between archetypes (paired by index). Hover any line to see its film
    // title, year, and how strong a match (%) it is to the archetype average.
    // Each path has stroke-dasharray set to its own length so the intro
    // timeline can "unravel" them one by one (sequential stroke draw).
    const ghostsLayer = svg.append("g").attr("class", "ghosts-layer");
    arch.ghostNodes = [];
    arch.ghostLens = [];
    const slots = arch.closestD[0].length;
    for (let k = 0; k < slots; k++) {
      const node = ghostsLayer.append("path")
        .attr("d", arch.closestD[0][k] || arch.closestD[0][0])
        .attr("fill", "none")
        .attr("stroke", ARCH_COLOR[0])
        .attr("stroke-width", 1.4)
        .attr("stroke-opacity", 0.55)
        .style("cursor", "pointer")
        .style("pointer-events", "stroke")
        .on("mouseenter", function () {
          // Block hover until the intro animation finishes — no tooltip while
          // the proxy lines are still drawing in.
          if (!arch.introPlayed || arch.introLocked) return;
          const id = arch.activeIdx;
          const meta = (ARCH_DATA[id]?.closest || [])[k];
          if (!meta) return;
          const pct = Math.round(meta.weight * 100);
          d3.select(this)
            .attr("stroke-opacity", 1)
            .attr("stroke-width", 2.4);
          showPinTip(
            { name: meta.title, year: meta.year },
            { pct, archetype: ARCHETYPE_NAMES[id] },
            ARCH_COLOR[id],
          );
        })
        .on("mouseleave", function () {
          d3.select(this)
            .attr("stroke-opacity", 0.55)
            .attr("stroke-width", 1.4);
          hidePinTip();
        })
        .node();
      const len = node.getTotalLength();
      node.style.strokeDasharray = `${len} ${len}`;
      node.style.strokeDashoffset = String(len);
      arch.ghostNodes.push(node);
      arch.ghostLens.push(len);
    }

    // Tooltip for closest-match hover lives in HTML (.pin-tip-corner) so it
    // can mirror the corner-count's CSS positioning exactly. arch.W/H still
    // tracked here for layout-dependent code further down.
    arch.W = W; arch.H = H;

    // MEAN arc — drawn but hidden via stroke-dashoffset for the intro reveal.
    arch.meanNode = svg.append("path")
      .attr("class", "mean")
      .attr("d", arch.meanD[0])
      .attr("fill", "none")
      .attr("stroke", ARCH_COLOR[0])
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")
      .node();
    const meanLen = arch.meanNode.getTotalLength();
    arch.meanNode.style.strokeDasharray = `${meanLen} ${meanLen}`;
    arch.meanNode.style.strokeDashoffset = String(meanLen);
    arch.meanLen = meanLen;

    // If the intro has already played (e.g., a resize while past the section)
    // skip the hidden state and show everything immediately.
    if (arch.introPlayed) showArchpinFrame();
  }

  layoutAndDraw();
  arch.relayout = () => {
    layoutAndDraw();
    rebuildArchTimeline();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };

  // Caption DOM refs
  arch.captionEls = {
    title:  document.getElementById("pin-title"),
    shape:  document.getElementById("pin-shape"),
    blurb:  document.getElementById("pin-blurb"),
    count:  document.getElementById("pin-count"),
    idx:    document.getElementById("pin-idx"),
  };
  arch.activeIdx = -1;
  setArchCaption(0, true);

  // Hide the caption block + corner count until the intro reveals them — they
  // shouldn't be visible during the intermission scroll-in or before the
  // average line starts drawing on first archetype.
  const meta = document.querySelector(".pin-stage .pin-meta");
  const corner = document.querySelector(".pin-stage .pin-progress-corner");
  if (!arch.introPlayed) {
    if (meta) meta.style.opacity = "0";
    if (corner) corner.style.opacity = "0";
  }

  rebuildArchTimeline();

  // Phased intro on first view — fires once, runs in real time (NOT scrubbed
  // with scroll). Triggered at "top top" so it fires the instant the section
  // pins, not while the user is still on the prior intermission. Order:
  // baseline → ghost lines → mean arc + text + count. Subsequent archetype
  // morphs are still scroll-driven by rebuildArchTimeline.
  if (window.gsap && window.ScrollTrigger && !arch.introPlayed) {
    ScrollTrigger.create({
      trigger: ".archetypes-pin",
      start: "top top",
      once: true,
      onEnter: playArchpinIntro,
    });
  }
}

// Reveal everything on the archpin SVG immediately — used when the intro has
// already played (e.g., on resize) so we don't strand elements at opacity 0.
function showArchpinFrame() {
  const svg = arch.svg;
  if (!svg) return;
  svg.select(".y-zero").style("opacity", null);
  (arch.ghostNodes || []).forEach(n => {
    n.style.strokeDasharray = "none";
    n.style.strokeDashoffset = "0";
  });
  if (arch.meanNode) {
    arch.meanNode.style.strokeDasharray = "none";
    arch.meanNode.style.strokeDashoffset = "0";
  }
  const meta = document.querySelector(".pin-stage .pin-meta");
  const corner = document.querySelector(".pin-stage .pin-progress-corner");
  if (meta) meta.style.opacity = "";
  if (corner) corner.style.opacity = "";
}

// Wheel + touch scroll lock used by the archpin intro. Listener is attached
// once at module load; flipping arch.introLocked toggles whether scroll input
// is swallowed.
window.addEventListener("wheel", e => {
  if (arch.introLocked) e.preventDefault();
}, { passive: false });
window.addEventListener("touchmove", e => {
  if (arch.introLocked) e.preventDefault();
}, { passive: false });
window.addEventListener("keydown", e => {
  if (!arch.introLocked) return;
  // Block keys that scroll the page during intro.
  const blocked = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
  if (blocked.includes(e.key)) e.preventDefault();
}, { passive: false });

function playArchpinIntro() {
  if (arch.introPlayed) return;
  arch.introPlayed = true;
  const svg = arch.svg;
  if (!svg) return;

  // Lock scroll for the duration of the intro so the user can't scrub the
  // morph timeline into Icarus / Man in a Hole / etc. before the proxy lines
  // and average finish drawing.
  arch.introLocked = true;

  // Freeze the morph timeline at progress 0 and disable its ScrollTrigger so
  // any incidental scroll (trackpad inertia from before the lock engaged,
  // scrollbar drag, etc.) can't slide the line through Icarus / MIH colors
  // mid-intro. disable(false) preserves the pin state — the section stays
  // pinned, just stops responding to scroll. Re-enable on completion.
  //
  // Before freezing, kill any in-flight tweens AND explicitly reset every
  // morphable path back to its Oedipus shape + color. Otherwise MorphSVG's
  // captured FROM state can be a partially-morphed path (if a fraction of
  // scroll snuck through before the lock engaged), and timeline.progress(0)
  // will "rewind" to that wrong state — the bounce-back the user observed.
  const morphST = arch.timeline?.scrollTrigger;
  if (morphST) {
    // SNAP scroll to pin-start so the morph timeline sits at progress 0
    // regardless of how far the user overshot. The section is pinned, so the
    // user sees no visual jump — only the underlying scrollY is corrected.
    window.scrollTo({ top: morphST.start, behavior: "instant" });

    // Reset every morphable path to its Oedipus shape + color. Then invalidate
    // the timeline so its child tweens recapture FROM on next render — using
    // killTweensOf here would destroy the timeline's children entirely and
    // break all subsequent archetype morphs.
    arch.meanNode.setAttribute("d", arch.meanD[0]);
    arch.meanNode.setAttribute("stroke", ARCH_COLOR[0]);
    arch.ghostNodes.forEach((node, k) => {
      node.setAttribute("d", arch.closestD[0][k] || arch.closestD[0][0]);
      node.setAttribute("stroke", ARCH_COLOR[0]);
    });
    arch.timeline.invalidate();
    arch.timeline.progress(0);
    morphST.disable(false);
  }

  const tl = gsap.timeline({
    onComplete: () => {
      arch.introLocked = false;
      if (morphST) morphST.enable();
    },
  });
  // 1. Zero baseline first — the "plane" everything sits on.
  tl.to(svg.select(".y-zero").node(), {
    opacity: 1, duration: 0.55, ease: "power2.out",
  });
  // 2. The 20 proxy lines unravel one by one — slower per-line draw + larger
  // stagger so the bundle "finds itself" gradually instead of crashing in.
  // ~1.8s per line, 0.13s between starts → ~4.4s total reveal.
  tl.to(arch.ghostNodes, {
    strokeDashoffset: 0,
    duration: 1.8,
    ease: "power2.out",
    stagger: { each: 0.13, from: "start" },
    onComplete: () => {
      // Clear the dasharray so future MorphSVG morphs to longer paths aren't
      // clipped by the original (shorter) dash length.
      arch.ghostNodes.forEach(n => { n.style.strokeDasharray = "none"; });
    },
  }, "+=0.2");
  // 3. Average arc draws — and the caption text + corner count fade in WITH
  // it, so they appear together with the bold line.
  tl.to(arch.meanNode, {
    strokeDashoffset: 0,
    duration: 1.5,
    ease: "power2.inOut",
    onComplete: () => {
      arch.meanNode.style.strokeDasharray = "none";
    },
  }, "+=0.15");
  const meta = document.querySelector(".pin-stage .pin-meta");
  const corner = document.querySelector(".pin-stage .pin-progress-corner");
  const captionTargets = [meta, corner].filter(Boolean);
  if (captionTargets.length) {
    tl.to(captionTargets, {
      opacity: 1, duration: 0.9, ease: "power2.out",
    }, "<");  // start at the same moment the mean line begins drawing
  }
}

// MorphSVG-driven scrubbed timeline. One scroll pass through .archetypes-pin
// runs five sequential segments (0→1, 1→2, ... 4→5). MorphSVG tweens the
// d attribute natively — smoother and more efficient than manual y-lerp.
function rebuildArchTimeline() {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (arch.timeline) { arch.timeline.scrollTrigger?.kill(); arch.timeline.kill(); arch.timeline = null; }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".archetypes-pin",
      pin: ".pin-stage",
      start: "top top",
      end: "+=600%",
      scrub: 0.6,
      anticipatePin: 1,
      onUpdate: self => {
        // active archetype = current segment majority
        const seg = Math.min(self.progress, 0.9999) * (ARCH_ORDER.length);
        const idx = Math.min(Math.floor(seg), ARCH_ORDER.length - 1);
        if (idx !== arch.activeIdx) setArchCaption(idx);
      },
    }
  });

  for (let i = 0; i < ARCH_ORDER.length - 1; i++) {
    const next = i + 1;
    const useMorph = !!window.MorphSVGPlugin;
    const meanTween = useMorph
      ? { morphSVG: arch.meanD[next], duration: 1, ease: "none" }
      : { attr: { d: arch.meanD[next] }, duration: 1, ease: "none" };
    tl.to(arch.meanNode, { ...meanTween, stroke: ARCH_COLOR[next] });

    arch.ghostNodes.forEach((node, k) => {
      const target = arch.closestD[next][k] || arch.closestD[next][0];
      const ghostTween = useMorph
        ? { morphSVG: target, duration: 1, ease: "none" }
        : { attr: { d: target }, duration: 1, ease: "none" };
      tl.to(node, { ...ghostTween, stroke: ARCH_COLOR[next] }, "<");
    });
  }

  arch.timeline = tl;
}

function setArchCaption(id, instant = false) {
  arch.activeIdx = id;
  const e = arch.captionEls;
  const apply = () => {
    e.title.textContent = ARCHETYPE_NAMES[id];
    e.shape.textContent = ARCHETYPE_SHAPES[id];
    e.shape.style.color = ARCH_COLOR[id];          // descriptor matches line color
    e.title.style.color = ARCH_COLOR[id];          // and so does the archetype name
    e.blurb.innerHTML   = ARCHETYPE_BLURBS[id];
    e.blurb.style.setProperty("--archetype-color", ARCH_COLOR[id]);
    e.count.innerHTML   = `<span class="num">${ARCH_DATA[id].filmCount.toLocaleString()}</span> films`;
    e.idx.textContent   = String(id + 1);
  };
  if (instant || !window.gsap) { apply(); return; }
  const block = [e.title, e.shape, e.blurb, e.count];
  gsap.to(block, {
    opacity: 0, y: 8, duration: 0.18, ease: "power1.in",
    onComplete: () => {
      apply();
      gsap.fromTo(block, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" });
    }
  });
}

// title: { name, year } — italic film name + non-italic parenthesized year
// match: { pct, archetype } — "82%" bold + "match to Oedipus" normal weight
// color: archetype hex applied to the whole match line
function showPinTip(title, match, color) {
  const el = document.getElementById("pin-tip");
  if (!el) return;
  // Sanitize: data values are static and from our own arrays, but build via
  // textContent on child spans rather than innerHTML interpolation to be safe.
  el.textContent = "";
  const titleSpan = document.createElement("span");
  titleSpan.className = "pin-tip-title";
  const nameSpan = document.createElement("span");
  nameSpan.className = "pin-tip-name";
  nameSpan.textContent = title.name;
  const yearSpan = document.createElement("span");
  yearSpan.className = "pin-tip-year";
  yearSpan.textContent = ` (${title.year})`;
  titleSpan.appendChild(nameSpan);
  titleSpan.appendChild(yearSpan);

  const matchSpan = document.createElement("span");
  matchSpan.className = "pin-tip-match";
  matchSpan.style.color = color;
  const pctSpan = document.createElement("span");
  pctSpan.className = "pin-tip-pct";
  pctSpan.textContent = `${match.pct}% match`;
  const tailSpan = document.createElement("span");
  tailSpan.className = "pin-tip-tail";
  tailSpan.textContent = ` to ${match.archetype}`;
  matchSpan.appendChild(pctSpan);
  matchSpan.appendChild(tailSpan);

  el.appendChild(titleSpan);
  el.appendChild(matchSpan);
  el.removeAttribute("hidden");
}
function hidePinTip() {
  const el = document.getElementById("pin-tip");
  if (el) el.setAttribute("hidden", "");
}

// ─────────────────────────────────────────────────────────
// DECADE RANK — bump chart. Each archetype's rank (by mixture share) traced
// across five decades. The crossover in the 2020s is the point.
//
// renderBump() lays out the chart in static form, optionally with elements
// pre-set to invisible/dashed-out so playDecadeRankReveal() can animate them
// in once. The reveal is scroll-gated, so the user always sees the animation
// when they reach the section.
const decadeRank = { rows: [], shapes: new Map(), played: false };

async function drawDecadeRank() {
  const [dec, shapes] = await Promise.all([
    d3.csv(`${DATA}/archetype_decade_weights.csv`, d3.autoType),
    d3.csv(`${DATA}/archetype_shapes.csv`, d3.autoType),
  ]);
  const films = CLUSTERED;

  const decadeRows = dec.map(d => {
    const row = { key: d.decade, _films: [] };
    for (let i = 0; i < 6; i++) row[i] = d[ARCHETYPE_NAMES[i]];
    return row;
  });
  films.forEach(f => {
    const dec = decadeRows.find(r => r.key === f.decade);
    if (dec) dec._films.push(f);
  });

  decadeRank.rows = decadeRows;
  // archetype_shapes.csv uses arc_name (1-indexed by archetype_id) so look up
  // by the canonical name string — same approach the close-up section uses.
  decadeRank.shapes = new Map(shapes.map(s => [s.arc_name, s]));
  renderBump();

  // Scroll-gated reveal — fires once when the section enters view.
  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: ".decade-rank",
      start: "top 70%",
      once: true,
      onEnter: () => { if (!decadeRank.played) playDecadeRankReveal(); },
    });
  } else {
    playDecadeRankReveal();
  }
}

// Spotlight bump chart with cinematic zoom on the crossing.
// All six archetypes show their rank trajectory in their own colors —
// Man in a Hole + Tragedy at full strength, the other four faded.
// monotone-X curves prevent rank-overshoot at the endpoints.
const DR_SPOTLIGHT = new Set([2, 3]); // Man in a Hole, Tragedy

function renderBump() {
  const svg = d3.select(".decade-rank-svg");
  svg.selectAll("*").remove();
  const rect = svg.node().getBoundingClientRect();
  const W = Math.max(rect.width, 480), H = Math.max(rect.height, 480);
  const initialVB = `0 0 ${W} ${H}`;
  svg.attr("viewBox", initialVB);
  // Symmetric vertical margins so the rank rows breathe evenly between
  // the top of the SVG and the bottom.
  const m = { top: 44, right: 180, bottom: 44, left: 80 };

  const rows = decadeRank.rows;
  const decKeys = rows.map(r => r.key);

  // Per-archetype rank trajectory across decades.
  const ranks = {};
  ARCH_ORDER.forEach(id => { ranks[id] = []; });
  rows.forEach((row, di) => {
    const ordered = ARCH_ORDER
      .map(id => ({ id, v: row[id] || 0 }))
      .sort((a, b) => d3.descending(a.v, b.v) || d3.ascending(a.id, b.id));
    ordered.forEach((o, rank) => {
      const prior = di > 0 ? ranks[o.id][di - 1].rank : null;
      ranks[o.id][di] = {
        rank: rank + 1,
        share: o.v,
        decade: row.key,
        decadeIdx: di,
        films: row._films || [],
        prior,
      };
    });
  });

  const x = d3.scalePoint()
    .domain(decKeys)
    .range([m.left, W - m.right])
    .padding(0.3);
  const y = d3.scalePoint()
    .domain(d3.range(1, 7))
    .range([m.top, H - m.bottom])
    .padding(0.5);

  const played = decadeRank.played;
  const opIfPlayed = played ? 1 : 0;
  const tooltip = d3.select("#decade-rank-tooltip");

  // ── Frame hairlines (top + bottom) ──
  const yTop = y(1) - 24;
  const yBot = y(6) + 24;
  [yTop, yBot].forEach(yy => {
    svg.append("line")
      .attr("class", "dr-frame")
      .attr("x1", m.left - 30).attr("x2", W - m.right + 30)
      .attr("y1", yy).attr("y2", yy)
      .attr("stroke", C.rule)
      .attr("stroke-width", 0.6)
      .attr("opacity", opIfPlayed)
      .attr("vector-effect", "non-scaling-stroke");
  });

  // ── Decade labels (top) ──
  svg.append("g").selectAll("text")
    .data(decKeys)
    .join("text")
    .attr("class", "dr-decade-label")
    .attr("data-di", (_, i) => i)
    .attr("x", d => x(d))
    .attr("y", yTop - 14)
    .attr("text-anchor", "middle")
    .attr("fill", C.inkDim)
    .attr("font-family", "Inter, sans-serif")
    .attr("font-size", 11)
    .attr("font-weight", 500)
    .style("letter-spacing", "0.18em")
    .attr("opacity", opIfPlayed)
    .text(d => d.toUpperCase());

  // ── Rank caption + numbers (left) ──
  svg.append("text")
    .attr("class", "dr-rank-caption")
    .attr("x", m.left - 22)
    .attr("y", yTop - 14)
    .attr("text-anchor", "end")
    .attr("fill", C.inkFaint)
    .attr("font-family", "Inter, sans-serif")
    .attr("font-size", 10)
    .attr("font-weight", 600)
    .style("letter-spacing", "0.18em")
    .attr("opacity", opIfPlayed)
    .text("RANK");

  svg.append("g").selectAll("text")
    .data(d3.range(1, 7))
    .join("text")
    .attr("class", "dr-rank-text")
    .attr("x", m.left - 22)
    .attr("y", r => y(r) + 8)
    .attr("text-anchor", "end")
    .attr("fill", C.inkFaint)
    .attr("font-family", "Fraunces, serif")
    .attr("font-style", "italic")
    .attr("font-variation-settings", '"opsz" 144, "SOFT" 30')
    .attr("font-size", 22)
    .attr("opacity", opIfPlayed)
    .text(r => r);

  // ── Lines per archetype ──
  // monotone-X prevents rank overshoot at the endpoints (the previous
  // Catmull-Rom whipped past rank 1 / rank 6 because the curve had no
  // anchor beyond the last decade).
  const lineGen = d3.line()
    .x((_, i) => x(decKeys[i]))
    .y(d => y(d.rank))
    .curve(d3.curveMonotoneX);

  // Spotlight lines render on top of muted ones.
  const order = [...ARCH_ORDER].sort((a, b) => DR_SPOTLIGHT.has(a) - DR_SPOTLIGHT.has(b));

  order.forEach(id => {
    const series = ranks[id];
    const isSpot = DR_SPOTLIGHT.has(id);
    const grp = svg.append("g")
      .attr("class", `dr-line-grp ${isSpot ? "is-spotlight" : "is-muted"}`)
      .attr("data-arch", id);

    const path = grp.append("path")
      .attr("class", "dr-line")
      .attr("d", lineGen(series))
      .attr("fill", "none")
      .attr("stroke", ARCH_COLOR[id])
      .attr("stroke-width", isSpot ? 3.5 : 2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("vector-effect", "non-scaling-stroke")
      .attr("opacity", played ? (isSpot ? 0.95 : 0.22) : 0);

    if (!played) {
      const len = path.node().getTotalLength();
      path.attr("stroke-dasharray", `${len} ${len}`)
        .attr("stroke-dashoffset", len);
    }

    // Visible dots. Spotlight = filled in archetype color (becomes the
    // visual swatch next to the name); muted = hollow ring of the same
    // color, larger and bolder so it actually reads as a hover target.
    // Opacity stays at the resting value at all times — the reveal hides
    // them via r=0 instead, so they grow into view rather than fading.
    grp.selectAll("circle.dr-node")
      .data(series)
      .join("circle")
      .attr("class", "dr-node")
      .attr("data-di", d => d.decadeIdx)
      .attr("cx", (_, i) => x(decKeys[i]))
      .attr("cy", d => y(d.rank))
      .attr("r", played ? (isSpot ? 5.5 : 5) : 0)
      .attr("fill", isSpot ? ARCH_COLOR[id] : C.bg)
      .attr("stroke", ARCH_COLOR[id])
      .attr("stroke-width", isSpot ? 0 : 2)
      .attr("opacity", isSpot ? 1 : 0.95)
      .attr("vector-effect", "non-scaling-stroke");

    // Invisible 18px hit-targets — pointer-events: all forces event
    // capture even with a transparent fill (the default visiblePainted
    // mode would otherwise skip transparent areas, breaking hover).
    // Pointer-events stays "none" during the reveal animation so hovering
    // mid-animation can't fire tooltips before the chart has fully loaded.
    grp.selectAll("circle.dr-hit")
      .data(series)
      .join("circle")
      .attr("class", "dr-hit")
      .attr("cx", (_, i) => x(decKeys[i]))
      .attr("cy", d => y(d.rank))
      .attr("r", 18)
      .attr("fill", "transparent")
      .style("pointer-events", played ? "all" : "none")
      .style("cursor", "pointer");
  });

  // ── Right-end labels (all 6) ──
  // The line-end dot itself serves as the color swatch — no redundant
  // decorative dot in front of the name. Spotlight = ink + bigger,
  // muted = ink-dim + smaller. Hovering the label shows a mini canonical-
  // shape popup positioned ABOVE the name so it never overflows right.
  const labelLayer = svg.append("g").attr("class", "dr-label-layer");
  ARCH_ORDER.forEach(id => {
    const series = ranks[id];
    const last = series[series.length - 1];
    const isSpot = DR_SPOTLIGHT.has(id);
    const labelX = x(decKeys[decKeys.length - 1]) + 14; // sits just past the dot
    const labelY = y(last.rank) + 6;

    const labelGrp = labelLayer.append("g")
      .attr("class", "dr-end-label-grp")
      .attr("data-arch", id)
      .attr("opacity", played ? 1 : 0)
      .style("cursor", "pointer")
      .style("pointer-events", played ? "auto" : "none");

    const labelText = labelGrp.append("text")
      .attr("class", "dr-end-label")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("fill", isSpot ? C.ink : C.inkDim)
      .attr("font-family", "Fraunces, serif")
      .attr("font-variation-settings", '"opsz" 72, "SOFT" 30')
      .attr("font-size", isSpot ? 18 : 14)
      .attr("font-weight", 400)
      .text(ARCHETYPE_NAMES[id]);

    // Canonical-shape popup — always to the right of the label,
    // vertically aligned with it. SVG overflow:visible lets it extend
    // past the SVG's right edge if needed.
    const shape = decadeRank.shapes.get(ARCHETYPE_NAMES[id]);
    if (shape) {
      const popW = 100, popH = 40;
      const labelW = labelText.node().getBBox().width;
      const popX = labelX + labelW + 12;
      const popY = labelY - popH / 2 - 4;
      const popG = labelGrp.append("g")
        .attr("class", "dr-shape-pop")
        .attr("transform", `translate(${popX}, ${popY})`)
        .attr("opacity", 0)
        .attr("pointer-events", "none");
      popG.append("rect")
        .attr("width", popW).attr("height", popH)
        .attr("fill", C.bg)
        .attr("stroke", ARCH_COLOR[id])
        .attr("stroke-width", 0.6)
        .attr("opacity", 0.85);
      const ys = d3.range(1, 21).map(i => shape[`w${String(i).padStart(2, "0")}`]);
      const yExt = d3.extent(ys);
      const xs = d3.scaleLinear().domain([0, 19]).range([8, popW - 8]);
      const yMini = d3.scaleLinear().domain([yExt[0] - 0.3, yExt[1] + 0.3]).range([popH - 8, 8]);
      const lnMini = d3.line().x((_, i) => xs(i)).y(d => yMini(d)).curve(d3.curveCatmullRom.alpha(0.6));
      popG.append("path")
        .attr("d", lnMini(ys))
        .attr("fill", "none")
        .attr("stroke", ARCH_COLOR[id])
        .attr("stroke-width", 1.6);
      labelGrp
        .on("mouseenter.shape", () => popG.transition().duration(140).attr("opacity", 1))
        .on("mouseleave.shape", () => popG.transition().duration(140).attr("opacity", 0));
    }
  });

  // ── Highlight wiring (line + label cross-link) ──
  // When a muted line is the active one, boost its path opacity so it
  // briefly reads as a hero. On clear, spotlight stays bright, muted dims.
  const lineGrps = svg.selectAll("g.dr-line-grp");
  const labelGrps = labelLayer.selectAll("g.dr-end-label-grp");
  function highlightArch(activeId) {
    lineGrps.each(function () {
      const archId = +this.getAttribute("data-arch");
      const isActive = archId === activeId;
      const sel = d3.select(this);
      sel.transition().duration(140).attr("opacity", isActive ? 1 : 0.3);
      sel.select(".dr-line").transition().duration(140)
        .attr("opacity", isActive ? 0.95 : (DR_SPOTLIGHT.has(archId) ? 0.95 : 0.22));
    });
    labelGrps.transition().duration(140).attr("opacity", function () {
      return +this.getAttribute("data-arch") === activeId ? 1 : 0.4;
    });
  }
  function clearHighlight() {
    lineGrps.transition().duration(160).attr("opacity", 1);
    lineGrps.selectAll(".dr-line").transition().duration(160).attr("opacity", function () {
      const archId = +this.parentNode.getAttribute("data-arch");
      return DR_SPOTLIGHT.has(archId) ? 0.95 : 0.22;
    });
    labelGrps.transition().duration(160).attr("opacity", 1);
    tooltip.classed("is-visible", false);
  }
  labelGrps
    .on("mouseenter.highlight", function () { highlightArch(+this.getAttribute("data-arch")); })
    .on("mouseleave.highlight", clearHighlight);

  // ── Per-dot tooltips (rank, share, films, delta) ──
  const SMALL_WORDS = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into",
    "of", "off", "on", "or", "the", "to", "vs", "with", "nor", "yet", "so"
  ]);
  const smartTitle = title => {
    if (!title) return "";
    const parts = String(title).split(" ");
    return parts.map((w, i) => {
      if (i === 0) return w;
      const wl = w.toLowerCase();
      if (!SMALL_WORDS.has(wl)) return w;
      const prev = parts[i - 1];
      return /[a-zA-Z]$/.test(prev) ? wl : w;
    }).join(" ");
  };

  // Pick a fresh sample of 6 films each hover, biased toward titles the
  // average viewer is most likely to recognize. The list below is hand-
  // curated — broadly known across the 1980s → 2020s. Films in the pool
  // are bucketed: "popular" first (sorted by archetype weight), then
  // others by weight, top 14 combined, then shuffled and sliced to 6.
  const POPULAR_TITLES = new Set([
    "back to the future", "back to the future part ii", "back to the future part iii",
    "the empire strikes back", "return of the jedi", "raiders of the lost ark",
    "indiana jones and the last crusade", "indiana jones and the temple of doom",
    "et the extraterrestrial", "e t the extra terrestrial",
    "ghostbusters", "ghostbusters ii", "the breakfast club", "ferris buellers day off",
    "die hard", "die hard 2", "blade runner", "aliens", "alien", "predator",
    "the terminator", "terminator 2 judgment day",
    "robocop", "the goonies", "beverly hills cop", "footloose", "dirty dancing",
    "rain man", "wall street", "platoon", "fatal attraction", "the karate kid",
    "big", "stand by me", "the princess bride", "lethal weapon", "beetlejuice",
    "tootsie", "coming to america", "the shining", "rocky iii", "rocky iv",
    "scarface", "top gun", "when harry met sally", "fast times at ridgemont high",
    "a christmas story", "good morning vietnam", "spaceballs",
    "pulp fiction", "the shawshank redemption", "forrest gump", "the matrix",
    "titanic", "goodfellas", "schindlers list", "jurassic park", "fight club",
    "saving private ryan", "toy story", "heat", "se7en", "seven", "the big lebowski",
    "the sixth sense", "good will hunting", "reservoir dogs", "trainspotting",
    "american beauty", "braveheart", "independence day", "men in black",
    "dumb and dumber", "home alone", "mrs doubtfire", "speed", "the lion king",
    "aladdin", "beauty and the beast", "edward scissorhands", "groundhog day",
    "theres something about mary", "a few good men", "total recall",
    "the silence of the lambs", "scream", "boogie nights", "twister",
    "the truman show", "office space", "you’ve got mail", "youve got mail",
    "the rock", "armageddon", "the green mile", "magnolia",
    "the lord of the rings the fellowship of the ring",
    "the lord of the rings the two towers",
    "the lord of the rings the return of the king",
    "gladiator", "the dark knight", "memento",
    "eternal sunshine of the spotless mind", "there will be blood",
    "no country for old men", "the departed", "inception", "wall e", "wall·e",
    "up", "avatar", "the bourne identity", "the bourne supremacy",
    "the bourne ultimatum", "spider man", "spider man 2",
    "pirates of the caribbean the curse of the black pearl",
    "shrek", "finding nemo", "brokeback mountain", "mystic river",
    "slumdog millionaire", "lost in translation", "almost famous",
    "american psycho", "o brother where art thou", "a beautiful mind",
    "donnie darko", "mulholland dr", "mulholland drive",
    "kill bill volume 1", "kill bill vol 1", "kill bill vol 2", "300",
    "sin city", "children of men", "pans labyrinth", "juno",
    "little miss sunshine", "anchorman the legend of ron burgundy",
    "mean girls", "superbad", "the hangover", "the prestige", "casino royale",
    "skyfall", "iron man", "the incredibles", "ratatouille",
    "the social network", "black swan", "the kings speech", "the avengers",
    "argo", "the wolf of wall street", "12 years a slave", "interstellar",
    "whiplash", "mad max fury road", "the revenant", "spotlight",
    "la la land", "moonlight", "get out", "lady bird", "three billboards outside ebbing missouri",
    "parasite", "joker", "once upon a time in hollywood", "marriage story",
    "the irishman", "knives out", "john wick", "birdman", "boyhood",
    "frozen", "inside out", "toy story 3", "tangled",
    "how to train your dragon", "coco", "shutter island", "black panther",
    "avengers infinity war", "avengers endgame", "spider man homecoming",
    "spider man into the spider verse", "a quiet place", "hereditary", "it",
    "deadpool", "guardians of the galaxy", "django unchained", "inglourious basterds",
    "the grand budapest hotel", "ex machina", "arrival", "blade runner 2049",
    "dunkirk", "1917", "logan", "captain america the winter soldier",
    "tenet", "soul", "mank", "the father", "nomadland", "promising young woman",
    "minari", "dune", "the power of the dog", "coda", "west side story",
    "belfast", "dont look up", "encanto", "spider man no way home",
    "top gun maverick", "everything everywhere all at once",
    "avatar the way of water", "tár", "tar", "the banshees of inisherin",
    "rrr", "glass onion a knives out mystery", "the whale", "babylon",
    "anora", "oppenheimer", "barbie", "killers of the flower moon",
    "past lives", "dune part two", "the substance", "challengers", "civil war",
    "poor things", "anatomy of a fall",
  ]);
  const normalizeTitle = t =>
    String(t || "").toLowerCase()
      .replace(/[''"".,:;!?\-–—()&]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const isPopular = title => POPULAR_TITLES.has(normalizeTitle(title));

  const sampleFilms = (films, archId) => {
    const titled = films.filter(f => f && f.title);
    const byWeight = (a, b) => (b[`arch_${archId}_weight`] || 0) - (a[`arch_${archId}_weight`] || 0);
    const popular = titled.filter(f => isPopular(f.title)).sort(byWeight);
    const others  = titled.filter(f => !isPopular(f.title)).sort(byWeight);
    // Pool = popular first, padded with canonical examples until we have 14.
    const pool = popular.concat(others).slice(0, 14);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 6);
  };

  // Smart placement: tooltip must always fit inside the chart container.
  //   - Vertical: prefer ABOVE the cursor (cursor is on data, content goes
  //     up where there's empty axis space). Fall back BELOW only when there
  //     isn't enough room above. Final clamp pins it inside if neither fits.
  //   - Horizontal: prefer to the RIGHT of the cursor; flip LEFT if the
  //     tooltip would overflow the right edge.
  function positionTooltip(e) {
    const parent = svg.node().parentNode.getBoundingClientRect();
    const ttRect = tooltip.node().getBoundingClientRect();
    // Use a generous fallback height if the rect is suspiciously small
    // (can happen on first frame before the browser has flushed layout).
    const ttH = ttRect.height > 40 ? ttRect.height : 220;
    const ttW = ttRect.width  > 40 ? ttRect.width  : 240;

    const cursorX = e.clientX - parent.left;
    const cursorY = e.clientY - parent.top;

    // Vertical: above by default.
    let top = cursorY - ttH - 14;
    if (top < 4) top = cursorY + 16;
    // Last-resort clamp inside the container.
    if (top + ttH > parent.height - 4) {
      top = Math.max(4, parent.height - ttH - 4);
    }

    // Horizontal: right by default.
    let left = cursorX + 16;
    if (left + ttW > parent.width - 4) {
      left = cursorX - ttW - 16;
    }
    if (left < 4) left = 4;

    tooltip.style("left", left + "px").style("top", top + "px");
  }

  svg.selectAll("circle.dr-hit")
    .on("mouseenter", function (e, d) {
      const archId = +d3.select(this.parentNode).attr("data-arch");
      highlightArch(archId);
      const dot = d3.select(this.parentNode).selectAll("circle.dr-node").filter(n => n.decadeIdx === d.decadeIdx);
      dot.transition().duration(120).attr("r", 7);

      const allFilms = Array.isArray(d.films) ? d.films : [];
      const archFilms = allFilms.filter(f => f && f.dominant_archetype === archId);
      const picks = sampleFilms(archFilms, archId);
      const sample = picks.map(f => smartTitle(f.title)).join(" · ");
      const more = archFilms.length > picks.length ? ` +${archFilms.length - picks.length}` : "";
      const decadeFilms = allFilms.length;
      let delta;
      if (d.prior == null) delta = `<span class="delta">first decade in the dataset</span>`;
      else if (d.prior === d.rank) delta = `<span class="delta">→ steady at #${d.rank}</span>`;
      else if (d.prior > d.rank) delta = `<span class="delta">↑ up from #${d.prior}</span>`;
      else delta = `<span class="delta">↓ down from #${d.prior}</span>`;
      tooltip.html(
        `<strong>${ARCHETYPE_NAMES[archId]}</strong> · ${d.decade}<br/>` +
        `rank <strong>${d.rank}</strong> · ${(d.share).toLocaleString(undefined, { style: "percent", maximumFractionDigits: 1 })} mixture share<br/>` +
        `<span style="color:var(--ink-faint);font-size:0.78rem">${archFilms.length} of ${decadeFilms} films lead with this shape</span>` +
        delta +
        (picks.length ? `<span class="films">${sample}${more}</span>` : "")
      );
      tooltip.classed("is-visible", true);
      positionTooltip(e);
    })
    .on("mousemove", positionTooltip)
    .on("mouseleave", function (e, d) {
      const archId = +d3.select(this.parentNode).attr("data-arch");
      const isSpot = DR_SPOTLIGHT.has(archId);
      const dot = d3.select(this.parentNode).selectAll("circle.dr-node").filter(n => n.decadeIdx === d.decadeIdx);
      dot.transition().duration(150).attr("r", isSpot ? 5.5 : 5);
      clearHighlight();
    });

  // ── Zoomed viewBox: focuses on 2000s onwards, framing the crossing ──
  // The zoom does the storytelling — no on-chart annotation needed.
  const yCross = y(2) + (y(3) - y(2)) * 0.2;
  const aspect = W / H;
  const zoomXStart = x(decKeys[2]) - 30;
  const zoomXEnd = W;
  const zoomW = zoomXEnd - zoomXStart;
  const zoomH = zoomW / aspect;
  const zoomYStart = Math.max(0, yCross - zoomH / 2 - 10);
  const zoomedVB = `${zoomXStart} ${zoomYStart} ${zoomW} ${zoomH}`;
  svg.attr("data-initial-vb", initialVB);
  svg.attr("data-zoomed-vb", zoomedVB);
}

// ─────────────────────────────────────────────────────────
// Decade-rank reveal — runs once when the section enters view.
//
// Pacing is deliberately slow with explicit gaps between phases so each
// element registers before the next begins. Total run ≈ 15s.
//
//   t=0.00  FRAME        hairlines fade in
//   t=0.20  X-AXIS       decade labels stagger left→right
//   t=1.50  Y-AXIS       RANK caption then rank numbers top→bottom
//   t=3.10  BACKDROP     four muted lines draw over 2.7s, dots pop
//   t=5.85  HEROES       Man in a Hole + Tragedy draw over 3.6s, dots pop
//   t=9.45  LEGEND       all six right-end labels fade in stagger
//   t=10.8  ZOOM IN      viewBox eases onto the crossing (the payoff)
//   t=14.0  PULL BACK    viewBox eases back to the wide view
function playDecadeRankReveal() {
  if (decadeRank.played) return;
  decadeRank.played = true;
  const svg = d3.select(".decade-rank-svg");

  // 1. Frame.
  svg.selectAll(".dr-frame")
    .transition().duration(700).ease(d3.easeCubicOut)
    .attr("opacity", 1);

  // 2. X-axis: decade labels left → right, with breathing room.
  svg.selectAll(".dr-decade-label").each(function (_, i) {
    d3.select(this)
      .transition().delay(200 + i * 140).duration(580).ease(d3.easeCubicOut)
      .attr("opacity", 1);
  });

  // 3. Y-axis: RANK caption, then rank numbers top → bottom.
  svg.select(".dr-rank-caption")
    .transition().delay(1500).duration(520).ease(d3.easeCubicOut)
    .attr("opacity", 1);
  svg.selectAll(".dr-rank-text").each(function (_, i) {
    d3.select(this)
      .transition().delay(1700 + i * 110).duration(500).ease(d3.easeCubicOut)
      .attr("opacity", 1);
  });

  // 4. BACKDROP — four muted lines draw together, slowly.
  const mutedDelay = 3100;
  const mutedDur = 2700;
  svg.selectAll(".dr-line-grp.is-muted .dr-line").each(function () {
    d3.select(this)
      .attr("opacity", 0.22)
      .transition().delay(mutedDelay).duration(mutedDur).ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0)
      .on("end", function () { d3.select(this).attr("stroke-dasharray", null); });
  });
  const decadeCount = 5;
  svg.selectAll(".dr-line-grp.is-muted circle.dr-node").each(function () {
    const di = +this.dataset.di;
    const t = di / (decadeCount - 1);
    d3.select(this)
      .transition()
      .delay(mutedDelay + Math.round(t * mutedDur))
      .duration(340).ease(d3.easeCubicOut)
      .attr("r", 5);
  });

  // 5. HEROES — spotlight lines draw, slower for emphasis.
  const spotDelay = 5850;
  const spotDur = 3600;
  svg.selectAll(".dr-line-grp.is-spotlight .dr-line").each(function () {
    d3.select(this)
      .attr("opacity", 0.95)
      .transition().delay(spotDelay).duration(spotDur).ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0)
      .on("end", function () { d3.select(this).attr("stroke-dasharray", null); });
  });
  svg.selectAll(".dr-line-grp.is-spotlight circle.dr-node").each(function () {
    const di = +this.dataset.di;
    const t = di / (decadeCount - 1);
    d3.select(this)
      .transition()
      .delay(spotDelay + Math.round(t * spotDur))
      .duration(380)
      .ease(d3.easeBackOut.overshoot(1.6))
      .attr("r", 5.5);
  });

  // 6. LEGEND — all six right-end labels fade in stagger.
  const legendDelay = spotDelay + spotDur;
  svg.selectAll("g.dr-end-label-grp").each(function (_, i) {
    d3.select(this)
      .transition()
      .delay(legendDelay + i * 110)
      .duration(560).ease(d3.easeCubicOut)
      .attr("opacity", 1);
  });

  // 7. CAMERA — zoom in on the crossing.
  const zoomInDelay = legendDelay + 1350;
  const zoomInDur = 1500;
  const initialVB = svg.attr("data-initial-vb").split(" ").map(Number);
  const zoomedVB = svg.attr("data-zoomed-vb").split(" ").map(Number);
  const interpVB = (from, to) => t => from.map((s, i) => s + (to[i] - s) * t).join(" ");

  svg.transition()
    .delay(zoomInDelay).duration(zoomInDur).ease(d3.easeCubicInOut)
    .attrTween("viewBox", () => interpVB(initialVB, zoomedVB));

  // 8. PULL BACK — hold ~1.0s on the crossing, then ease back out.
  // Once the camera lands, enable hover so tooltips and label popups
  // become available — never during the reveal itself.
  const zoomOutDelay = zoomInDelay + zoomInDur + 1000;
  const zoomOutDur = 1300;
  svg.transition("zoomout")
    .delay(zoomOutDelay).duration(zoomOutDur).ease(d3.easeCubicInOut)
    .attrTween("viewBox", () => interpVB(zoomedVB, initialVB))
    .on("end", () => {
      svg.selectAll("circle.dr-hit").style("pointer-events", "all");
      svg.selectAll("g.dr-end-label-grp").style("pointer-events", "auto");
    });
}

// ─────────────────────────────────────────────────────────
// EXPLORER
const explorer = { current: null, filter: "all", showTurns: false };

// Full-corpus searchable index, built from the clustered CSV. Each entry
// has { title, year, slug } so the search can return any of the 1,627 films.
let CORPUS = [];
let CURATED_SLUGS = new Set();

function buildCorpusIndex() {
  CURATED_SLUGS = new Set(CURATED.map(c => c[2]));
  // Degrade gracefully: if the clustered CSV failed to load, search across
  // the curated set so the search bar still works rather than blowing up.
  if (!CLUSTERED) {
    CORPUS = CURATED.map(([title, year, slug]) => ({ title, year, slug }));
    return;
  }
  const slugify = s => s.toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  CORPUS = CLUSTERED.map(r => ({
    title: r.title,
    year: r.year,
    slug: `${slugify(r.title)}-${r.year}`,
  }));
}

function buildExplorer() {
  // 1. Render the curated 24-film grid FIRST. This must never fail; nothing
  //    here depends on CLUSTERED, ARCH_DATA, or any async-loaded state.
  const grid = d3.select("#film-grid");
  grid.selectAll(".film-cell")
    .data(CURATED, d => d[2])
    .join("div")
    .attr("class", "film-cell")
    .attr("data-slug", d => d[2])
    .attr("data-directors", d => (d[3] || []).join(","))
    .html(([title, year]) => `${title}<span class="year">${year}</span>`)
    .on("click", function (_, d) {
      d3.selectAll(".film-cell").classed("is-active", false);
      d3.select(this).classed("is-active", true);
      loadFilm({ title: d[0], year: d[1], slug: d[2] });
    });

  // 2. Auto-load the first curated film into the chart.
  const first = grid.select(".film-cell").node();
  if (first) first.click();

  // 3. Build the search index now that the grid is committed. If CLUSTERED
  //    is missing, this falls back to the curated set (handled inside).
  try { buildCorpusIndex(); }
  catch (err) {
    console.error("[buildCorpusIndex] failed:", err);
    CORPUS = CURATED.map(([title, year, slug]) => ({ title, year, slug }));
    CURATED_SLUGS = new Set(CURATED.map(c => c[2]));
  }

  // ── search across the full corpus ──
  const input = document.getElementById("film-search");
  const list = document.getElementById("search-results");
  let focusIdx = -1;

  function rankMatches(q) {
    const ql = q.toLowerCase();
    const out = [];
    for (const f of CORPUS) {
      const tl = f.title.toLowerCase();
      const idx = tl.indexOf(ql);
      if (idx === -1) continue;
      // rank: prefix > word-start > anywhere; tiebreak by recency
      const wordStart = idx === 0 || /\s/.test(tl[idx - 1]);
      const rank = idx === 0 ? 0 : (wordStart ? 1 : 2);
      out.push({ f, rank, idx });
      if (out.length > 400) break;
    }
    out.sort((a, b) => a.rank - b.rank || a.idx - b.idx || b.f.year - a.f.year);
    return out.slice(0, 8).map(o => o.f);
  }

  function renderSuggestions(q) {
    list.innerHTML = "";
    if (!q || q.length < 2) { list.hidden = true; return; }
    const matches = rankMatches(q);
    if (!matches.length) { list.hidden = true; return; }
    matches.forEach(m => {
      const li = document.createElement("li");
      li.innerHTML = `${m.title}<span class="year">${m.year}</span>`;
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        // If the film is in the curated grid, activate that cell.
        // Otherwise, just load it into the stage and clear cell selection.
        if (CURATED_SLUGS.has(m.slug)) {
          const cell = document.querySelector(`.film-cell[data-slug="${m.slug}"]`);
          if (cell) {
            cell.click();
            cell.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        } else {
          d3.selectAll(".film-cell").classed("is-active", false);
          loadFilm(m);
          document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
        }
        input.value = "";
        list.hidden = true;
      });
      list.appendChild(li);
    });
    list.hidden = false;
    focusIdx = -1;
  }
  input.addEventListener("input", e => renderSuggestions(e.target.value));
  input.addEventListener("blur", () => setTimeout(() => list.hidden = true, 150));
  input.addEventListener("focus", e => { if (e.target.value) renderSuggestions(e.target.value); });
  input.addEventListener("keydown", e => {
    const items = [...list.querySelectorAll("li")];
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      focusIdx = (focusIdx + 1) % items.length;
      items.forEach((el, i) => el.classList.toggle("is-focus", i === focusIdx));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      focusIdx = (focusIdx - 1 + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle("is-focus", i === focusIdx));
      e.preventDefault();
    } else if (e.key === "Enter" && focusIdx >= 0) {
      items[focusIdx].dispatchEvent(new MouseEvent("mousedown"));
    }
  });

  d3.selectAll(".filter-tile").on("click", function () {
    d3.selectAll(".filter-tile").classed("is-active", false);
    d3.select(this).classed("is-active", true);
    explorer.filter = this.dataset.filter;
    d3.selectAll(".film-cell").classed("is-hidden", function () {
      if (explorer.filter === "all") return false;
      const dirs = (this.dataset.directors || "").trim();
      return dirs.length === 0;
    });
  });

  // turning-points toggle: shows/hides the turning-point dots on the loaded arc
  const turnInput = document.getElementById("turn-toggle");
  if (turnInput) {
    turnInput.addEventListener("change", e => {
      explorer.showTurns = e.target.checked;
      applyTurns();
    });
  }
}

function applyTurns() {
  const dots = d3.select(".explorer-svg").select("g.turn-dots");
  if (dots.empty()) return;
  if (explorer.showTurns) {
    dots.transition().duration(280).attr("opacity", 1)
      .selectAll("circle").attr("r", 6);
  } else {
    dots.transition().duration(220).attr("opacity", 0)
      .selectAll("circle").attr("r", 0);
  }
  d3.select("#stage-sub").text(
    explorer.showTurns
      ? "Hover a dot for the moment behind it"
      : "Toggle turning points to see the dots"
  );
}

async function loadFilm(film) {
  explorer.current = film;
  const { title, year, slug } = film;
  const svg = d3.select(".explorer-svg");
  svg.selectAll("*").remove();

  let arc, rev;
  try { arc = await d3.json(`${DATA}/arcs/${slug}_arc.json`); }
  catch (e) {
    d3.select("#stage-title").text(`${title} (not in corpus)`);
    d3.select("#stage-sub").text("");
    d3.select("#stage-blob").text("This film isn’t in the dataset yet.");
    return;
  }
  const revAll = await d3.json(`${DATA}/reversals.json`);
  rev = revAll.find(r => r.slug === slug);

  d3.select("#stage-title").text(`${arc.title} · ${arc.year}`);
  const nRev = rev?.reversals?.length ?? 0;
  d3.select("#stage-sub").text(
    explorer.showTurns
      ? `${nRev} TURNING POINTS · HOVER A DOT`
      : `${nRev} TURNING POINTS · TOGGLE TO REVEAL`
  );
  d3.select("#stage-blob").html(
    `<em>${arc.token_count?.toLocaleString() ?? "?"} tokens · ${arc.year}.</em>`
  );

  const rect = svg.node().getBoundingClientRect();
  const W = Math.max(rect.width, 480), H = Math.max(rect.height, 360);
  svg.attr("viewBox", `0 0 ${W} ${H}`);
  const m = { top: 36, right: 28, bottom: 36, left: 48 };

  const xs = arc.main_arc.map(p => p.position);
  const ys = arc.main_arc.map(p => p.z_score);
  const yExt = d3.extent(ys);
  const yPad = 0.6;

  const x = d3.scaleLinear().domain([0, 1]).range([m.left, W - m.right]);
  const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H - m.bottom, m.top]);

  drawAxisFrame(svg, { x, y, x0: m.left, x1: W - m.right });

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

  const total = path.node().getTotalLength();
  path.attr("stroke-dasharray", `${total} ${total}`)
      .attr("stroke-dashoffset", total)
      .transition().duration(1300).ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0);

  // Dots are always rendered, but their visibility is controlled by the
  // toggle. Default state: hidden. The user opts in via the picker control.
  if (rev && rev.reversals) {
    const notes = NOTES[slug] || [];
    const startR = explorer.showTurns ? 6 : 0;
    const dotsG = svg.append("g")
      .attr("class", "turn-dots")
      .attr("opacity", explorer.showTurns ? 1 : 0);
    dotsG.selectAll("circle")
      .data(rev.reversals)
      .join("circle")
      .attr("cx", d => x(d.position))
      .attr("cy", d => y(d.value))
      .attr("r", 0)
      .attr("fill", d => d.type === "peak" ? C.turnWarm : C.turnCool)
      .attr("stroke", C.bgRaise).attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function (_, d) {
        if (!explorer.showTurns) return;
        d3.select(this).transition().duration(120).attr("r", 9);
        const i = rev.reversals.indexOf(d);
        const note = notes[i];
        const pct = Math.round(d.position * 100);
        const label = d.type === "peak" ? "Peak" : "Trough";
        d3.select("#stage-blob").html(
          `<strong style="font-family:var(--sans);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink)">${label} · <span class="num">${pct}%</span></strong>` +
          (note ? `<span class="note">${note}</span>` : `<span class="note">[note pending]</span>`)
        );
      })
      .on("mouseleave", function () {
        if (!explorer.showTurns) return;
        d3.select(this).transition().duration(120).attr("r", 6);
      });

    if (explorer.showTurns) {
      dotsG.selectAll("circle")
        .transition().delay(1100).duration(420).attr("r", 6);
    }
  }
}

// ─────────────────────────────────────────────────────────
// METHODOLOGY DRAWER
function wireMethodology() {
  const drawer = document.getElementById("meth-drawer");
  const scrim = document.getElementById("meth-scrim");
  const open = () => {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    scrim.classList.add("is-open");
    scrim.hidden = false;
  };
  const close = () => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    scrim.classList.remove("is-open");
    setTimeout(() => { if (!scrim.classList.contains("is-open")) scrim.hidden = true; }, 320);
  };
  document.querySelectorAll("[data-meth-open]").forEach(el => {
    el.addEventListener("click", e => { e.preventDefault(); open(); });
  });
  document.querySelectorAll("[data-meth-close]").forEach(el => {
    el.addEventListener("click", e => { e.preventDefault(); close(); });
  });
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

// ─────────────────────────────────────────────────────────
// GSAP REVEALS (intermissions, hero/closing splits, vonnegut copy)
function wireGsapReveals() {
  if (!window.gsap || !window.ScrollTrigger) {
    // GSAP failed to load — make sure scramble + hero targets stay readable.
    document.documentElement.classList.add("no-gsap");
    document.querySelectorAll(".scramble").forEach(n => n.classList.add("is-revealed"));
    return;
  }

  // Helper that primes a .scramble element (caches final text, blanks it,
  // unhides it) and returns the tween config. Used by both the hero timeline
  // and the scroll-triggered universal loop.
  const primeScramble = el => {
    const finalText = el.dataset.final || el.textContent;
    el.dataset.final = finalText;
    el.classList.add("is-revealed");
    el.textContent = "";
    // Numbers (.num) get a digit-only chars pool. Elements with an explicit
    // data-scramble-chars override (e.g. the prelude title, which uses its
    // own letters to keep width variation small) honor that. Otherwise
    // default to lowerCase. All three minimize layout shift.
    const charsPool = el.dataset.scrambleChars
      || (el.classList.contains("num") ? "0123456789," : "lowerCase");
    return {
      duration: 1.1,
      scrambleText: {
        text: finalText,
        chars: charsPool,
        revealDelay: 0.25,
        speed: 0.45,
        tweenLength: false,
      },
      ease: "none",
    };
  };

  // ── Hero entrance ──
  // Subtle fade-up on eyebrow → title → subtitle. Any .scramble inside the
  // hero (the 1,627 number in the subtitle) runs ON THE SAME TIMELINE,
  // positioned at "<" of the sub tween so it starts at the exact moment the
  // line begins fading in — locked together regardless of duration tweaks.
  if (document.querySelector(".hero-title")) {
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(".hero .eyebrow", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" })
      .to(".hero-title",     { opacity: 1, y: 0, duration: 0.95, ease: "power3.out" }, "-=0.4")
      .to(".hero-sub",       { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" }, "-=0.4");

    document.querySelectorAll(".hero .scramble").forEach(el => {
      if (!window.ScrambleTextPlugin) {
        el.classList.add("is-revealed");
        return;
      }
      tl.to(el, primeScramble(el), "<");  // start with the .hero-sub tween
    });
  }

  // ── Universal scramble loop (everything OUTSIDE the hero) ──
  // Scrambles fire at "top 65%" — LATER in scroll than the intermission
  // fade-up at "top 75%" — so the surrounding headline has time to fade up
  // first, and the italic word then scrambles inside an already-visible h2.
  // Trigger element is the nearest block ancestor (h2/h3/section/intermission)
  // — inline spans get blanked to empty by primeScramble and ScrollTrigger
  // can mis-measure 0-width inline triggers after a layout refresh.
  document.querySelectorAll(".scramble:not(.hero .scramble)").forEach(el => {
    if (el.closest(".hero")) return;  // already handled above
    const trigger = el.closest("h1, h2, h3, .intermission, section") || el;
    if (window.ScrambleTextPlugin) {
      gsap.to(el, {
        ...primeScramble(el),
        scrollTrigger: { trigger, start: "top 65%", once: true },
      });
    } else {
      el.classList.add("is-revealed");
      gsap.from(el, {
        opacity: 0, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger, start: "top 65%", once: true },
      });
    }
  });

  // Intermissions — fade-up on eyebrow, title, sub, and warm-up's shuffle
  // button so every line has the same subtle reveal as Vonnegut and friends.
  // The .scramble inside each title still does its own letter-rise on top
  // of this fade-up; they compose cleanly.
  //
  // Trigger on the title (which sits at the section's vertical center) with
  // "top 85%" — the reveal fires as the title is just entering the viewport
  // from the bottom, not when the section's top edge crosses (which would
  // be way too early for a 100vh centered-content intermission).
  gsap.utils.toArray(".intermission").forEach(sec => {
    const trigger = sec.querySelector(".intermission-title") || sec;
    gsap.from(sec.querySelectorAll(".intermission-eyebrow, .intermission-title, .intermission-sub, .warmup-shuffle"), {
      y: 22, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power2.out",
      scrollTrigger: { trigger, start: "top 85%" }
    });
  });

  // Vonnegut subsection 1 — quiet, choreographed reveal when the section
  // enters view. Image fades up softly; caption, lede, and paragraphs
  // follow on the same timeline.
  const von1 = document.querySelector(".vonnegut-1");
  if (von1) {
    const portrait = von1.querySelector(".von-portrait img");
    const caption  = von1.querySelector(".von-portrait figcaption");
    const lede     = von1.querySelector(".lede");
    const paras    = von1.querySelectorAll("p:not(.lede)");

    const tl = gsap.timeline({
      scrollTrigger: { trigger: von1, start: "top 78%", once: true }
    });
    if (portrait) tl.from(portrait, { y: 18, opacity: 0, duration: 1.1,  ease: "power2.out" }, 0);
    if (caption)  tl.from(caption,  { y: 12, opacity: 0, duration: 0.6,  ease: "power2.out" }, "-=0.55");
    if (lede)     tl.from(lede,     { y: 22, opacity: 0, duration: 0.85, ease: "power2.out" }, "-=0.8");
    if (paras.length) tl.from(paras, {
      y: 18, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out"
    }, "-=0.55");
  }

  // Vonnegut subsection 2 — text-only block, fades up when scrolled into view.
  const von2 = document.querySelector(".vonnegut-2");
  if (von2) {
    gsap.from(von2.querySelectorAll(".lede, p"), {
      y: 32, opacity: 0, duration: 1.0, stagger: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: von2, start: "top 78%", once: true }
    });
  }

  // Cluster overview — eyebrow, title, and sub all fade up with the same
  // soft stagger as the intermissions and Vonnegut copy.
  gsap.from(".cluster-overview .eyebrow, .cluster-title, .cluster-sub", {
    y: 22, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out",
    scrollTrigger: { trigger: ".cluster-overview .eyebrow", start: "top 85%", once: true }
  });

  // Decade rank — text reveal matches the cluster-overview pattern.
  // The chart's own scroll-gated timeline (playDecadeRankReveal) fires after.
  gsap.from(".decade-rank .eyebrow, .decade-rank-title, .decade-rank-sub", {
    y: 22, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out",
    scrollTrigger: { trigger: ".decade-rank .eyebrow", start: "top 85%", once: true }
  });

  // Closing line — the .scramble spans on the closing title are handled by
  // the universal .scramble loop above; here we just fade in the supporting
  // line + methodology link.
  gsap.from(".closing-line, .closing .meth-link", {
    y: 30, opacity: 0, duration: 0.9, stagger: 0.15, ease: "power2.out",
    scrollTrigger: { trigger: ".closing", start: "top 75%" }
  });
}


// ─────────────────────────────────────────────────────────
// boot
async function boot() {
  // Each prep step is independent — a failure in one MUST NOT cascade and
  // wipe out the rest of the page. A bad arc fetch shouldn't take the explorer
  // grid down with it.
  try { await pickTonightsFilm(); }
  catch (err) { console.error("[pickTonightsFilm] failed:", err); }

  // Sync the intro-prelude scramble word to the current film title BEFORE
  // wireGsapReveals reads it as the scramble target.
  renderIntroPreludeLabels();

  try { await loadArchData(); }
  catch (err) { console.error("[loadArchData] failed:", err); }

  // visual jobs (each independent)
  const jobs = [
    ["hero",     drawHero],
    ["intro",    drawIntro],
    ["cluster",  drawClusterOverview],
    ["archpin",  setupArchPin],
    ["decade-rank", drawDecadeRank],
    ["explorer", buildExplorer],
  ];
  for (const [name, fn] of jobs) {
    try { await fn(); }
    catch (err) { console.error(`[${name}] failed:`, err); }
  }

  wireGsapReveals();
  wireMethodology();

  // Re-render layout-sensitive views on resize
  let rT;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      if (intro.relayout) intro.relayout();
      drawClusterOverview();
      if (arch.relayout) arch.relayout();
      renderBump();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 180);
  });

  // After everything is laid out, force a ScrollTrigger refresh so the
  // archetype pin uses the correct section height.
  if (window.ScrollTrigger) {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
}

if (document.readyState === "complete") {
  boot();
} else {
  window.addEventListener("load", boot, { once: true });
}
