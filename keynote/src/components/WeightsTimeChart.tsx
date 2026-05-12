// Port of drawWeightsTime + playWeightsTimeReveal from main.js (lines
// ~2293-2829). Same data, same scales, same d3-force simulation, same
// archetype colors. GSAP/ScrollTrigger timing is replaced with Remotion's
// frame counter; hover/tooltip interactions are dropped (the keynote is
// not interactive, narrated over).
//
// Reveal timeline (matches the comment in main.js:2685-2705):
//   t=0.00  guide-lines fade in
//   t=0.50  row labels stagger top→bottom (Oedipus → Cinderella)
//   t=1.80  decade labels stagger left→right (1980s → 2020s)
//   t=2.90  caption fades in
//   t=3.40  swarm: dots fall in from above, simulation pulls each into
//           its (decade × archetype) cell, decade by decade
//   t=9.00  wiggle: small noise force keeps the swarm breathing

import React, { useMemo } from "react";
import { scalePoint } from "d3-scale";
import {
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
  type Simulation,
} from "d3-force";
import { useClustered, type ClusteredRow } from "../data";
import { theme, fonts, ARCH_COLOR_BY_ID, ARCHETYPE_NAMES_BY_ID } from "../theme";

const WEIGHTS_DECADES = ["1980s", "1990s", "2000s", "2010s", "2020s"];
const WEIGHTS_ARCH_IDS = [0, 1, 2, 3, 4, 5];

type Node = {
  decade: string;
  arch: number;
  title: string;
  year: number;
  tx: number;
  ty: number;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
};

type Props = {
  width: number;
  height: number;
  // Reveal progress in real-world seconds. Each beat clamps this to the
  // length of the reveal sequence (~10s).
  seconds: number;
  // Optional: skip the entry reveal entirely and start fully drawn.
  // Used by the "zoom + hover-isolate" beat where we want to demo the
  // chart's interactivity rather than its initial draw.
  startFullyRevealed?: boolean;
  // Optional: dim every dot EXCEPT those matching this archetype id.
  // Mirrors the website's hover-row-label-to-isolate-archetype interaction.
  isolateArchetype?: number;
  // Optional: dim every dot EXCEPT those in this decade.
  isolateDecade?: string;
};

export const WeightsTimeChart: React.FC<Props> = ({
  width,
  height,
  seconds,
  startFullyRevealed = false,
  isolateArchetype,
  isolateDecade,
}) => {
  const clustered = useClustered();

  // ── Build the node list (same filter as main.js:2299-2314) ──────
  // Use an empty list while data is loading so all downstream hooks run
  // unconditionally — React requires consistent hook counts per render.
  const films = useMemo(() => {
    if (!clustered) return [];
    const out: { decade: string; arch: number; title: string; year: number }[] = [];
    for (const r of clustered) {
      if (!WEIGHTS_DECADES.includes(r.decade)) continue;
      const a = +r.dominant_archetype;
      if (!Number.isFinite(a) || a < 0 || a > 5) continue;
      out.push({ decade: r.decade, arch: a, title: r.title, year: r.year });
    }
    return out;
  }, [clustered]);

  // ── Layout (matches main.js:2335-2370) ──────────────────────────
  const m = { top: 24, right: 56, bottom: 96, left: 184 };
  const innerW = width - m.left - m.right;
  const innerH = height - m.top - m.bottom;

  const decX = scalePoint<string>()
    .domain(WEIGHTS_DECADES)
    .range([m.left + innerW * 0.06, width - m.right - innerW * 0.06])
    .padding(0);

  const archY = scalePoint<number>()
    .domain(WEIGHTS_ARCH_IDS)
    .range([m.top + innerH * 0.02, height - m.bottom - innerH * 0.02])
    .padding(0);

  const R = Math.max(3.2, Math.min(4.4, innerH * 0.0066));
  const COLLIDE = R + 0.6;

  // Reveal timing. When `startFullyRevealed`, fast-forward everything.
  const t = startFullyRevealed ? Math.max(seconds, 12) : seconds;
  const guideOp = clamp01(t / 0.5);
  const captionOp = clamp01((t - 2.9) / 0.4);
  const COHORT_START = 3.4;
  const COHORT_GAP = 0.4;
  const COHORT_FADE = 0.6;

  // ── Deterministic simulation ────────────────────────────────────
  // For still renders (and for scrubbing in the studio), we need every
  // frame to be reproducible without depending on prior renders. Strategy:
  // for the requested `seconds`, run a fresh simulation from scratch,
  // releasing cohorts at their scheduled times and ticking enough to
  // match the elapsed wall-clock seconds. Heavy per-frame but correct.
  //
  // Bucket seconds to 100ms so consecutive frames within the same bucket
  // reuse the same simulation result (memo cache hit).
  const bucketed = Math.round(t * 10) / 10;
  const nodes = useMemo(() => {
    if (films.length === 0) return [];
    const rng = mulberry32(0x9b3a17);
    const aboveY = m.top - 60;
    const built: Node[] = films.map((f) => {
      const colJitter = (rng() - 0.5) * 28;
      const startX = (decX(f.decade) as number) + colJitter;
      const startY = aboveY + (rng() - 0.5) * 50;
      return {
        decade: f.decade,
        arch: f.arch,
        title: f.title,
        year: f.year,
        tx: decX(f.decade) as number,
        ty: archY(f.arch) as number,
        x: startX,
        y: startY,
        fx: startX,
        fy: startY,
      };
    });

    const sim: Simulation<Node, undefined> = forceSimulation<Node>(built)
      .force("x", forceX<Node>((d) => d.tx).strength(0.17))
      .force("y", forceY<Node>((d) => d.ty).strength(0.22))
      .force("collide", forceCollide<Node>(COLLIDE).strength(0.9))
      .alpha(0)
      .alphaDecay(0)
      .velocityDecay(0.55)
      .stop();

    // Walk simulation time in 1/60s ticks. At each tick, release any
    // cohort whose scheduled time has passed. Run until we've simulated
    // `max(0, bucketed - COHORT_START)` seconds.
    const TICKS_PER_SECOND = 60;
    const totalTicks = Math.max(0, Math.round((bucketed - COHORT_START) * TICKS_PER_SECOND));
    const releasedDecades = new Set<string>();
    for (let i = 0; i <= totalTicks; i++) {
      const simSeconds = COHORT_START + i / TICKS_PER_SECOND;
      WEIGHTS_DECADES.forEach((dec, decI) => {
        const releaseAt = COHORT_START + decI * COHORT_GAP;
        if (simSeconds >= releaseAt && !releasedDecades.has(dec)) {
          releasedDecades.add(dec);
          built.forEach((n) => {
            if (n.decade === dec) {
              n.fx = null;
              n.fy = null;
            }
          });
          // Goose alpha each time a new cohort enters so the simulation
          // does real work instead of decaying to rest.
          sim.alpha(0.6);
        }
      });
      if (i > 0) sim.tick();
    }
    return built;
  }, [films, bucketed, COLLIDE]);

  // Base reveal opacity per cohort.
  const cohortOpacity = (decade: string) => {
    const decI = WEIGHTS_DECADES.indexOf(decade);
    const releaseAt = COHORT_START + decI * COHORT_GAP;
    return clamp01((t - releaseAt) / COHORT_FADE);
  };

  // Combined dot opacity: cohort reveal × hover-isolate dimming. Mirrors
  // the website's highlightArch / highlightDecade behavior (main.js
  // ~2563-2585): matching dots stay at ~1.0, non-matching dots dim to
  // 0.08.
  const dotOpacity = (decade: string, arch: number) => {
    const cohort = cohortOpacity(decade) * 0.85;
    let dim = 1;
    if (isolateArchetype != null && arch !== isolateArchetype) dim = 0.08;
    if (isolateDecade != null && decade !== isolateDecade) dim = 0.08;
    if (isolateArchetype != null && arch === isolateArchetype) dim = 1;
    if (isolateDecade != null && decade === isolateDecade) dim = 1;
    return cohort * dim;
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      {/* Row guide lines */}
      {WEIGHTS_ARCH_IDS.map((id) => (
        <line
          key={`guide-${id}`}
          x1={m.left + 8}
          x2={width - m.right - 8}
          y1={archY(id) as number}
          y2={archY(id) as number}
          stroke={theme.rule}
          strokeWidth={1}
          strokeDasharray="2 6"
          opacity={guideOp}
        />
      ))}

      {/* Row labels — Source Serif 4, weight 500, opsz 32. Colored by arch. */}
      {WEIGHTS_ARCH_IDS.map((id) => {
        const labelStart = 0.5 + id * 0.16;
        const revealOp = clamp01((t - labelStart) / 0.3);
        let dim = 1;
        if (isolateArchetype != null && id !== isolateArchetype) dim = 0.25;
        if (isolateDecade != null) dim = 0.4;
        return (
          <text
            key={`row-${id}`}
            x={m.left - 16}
            y={(archY(id) as number) + 6}
            textAnchor="end"
            fontFamily={fonts.body}
            fontSize={16}
            fontWeight={400}
            style={{ fontVariationSettings: '"wght" 400, "opsz" 32, "SOFT" 30' }}
            fill={ARCH_COLOR_BY_ID[id]}
            opacity={revealOp * dim}
          >
            {ARCHETYPE_NAMES_BY_ID[id]}
          </text>
        );
      })}

      {/* Column (decade) labels */}
      {WEIGHTS_DECADES.map((dec, i) => {
        const labelStart = 1.8 + i * 0.14;
        const revealOp = clamp01((t - labelStart) / 0.3);
        let dim = 1;
        if (isolateDecade != null && dec !== isolateDecade) dim = 0.35;
        if (isolateArchetype != null) dim = 0.5;
        return (
          <text
            key={`col-${dec}`}
            x={decX(dec) as number}
            y={height - m.bottom + 44}
            textAnchor="middle"
            fontFamily={fonts.mono}
            fontSize={11}
            fill={theme.inkFaint}
            opacity={revealOp * dim}
          >
            {dec}
          </text>
        );
      })}

      {/* Caption */}
      <text
        x={m.left + innerW / 2}
        y={height - 18}
        textAnchor="middle"
        fontFamily={fonts.mono}
        fontSize={9}
        letterSpacing="0.18em"
        fill={theme.inkFaint}
        opacity={captionOp}
      >
        EACH DOT IS A FILM · COLUMN = DECADE · ROW = DOMINANT SHAPE
      </text>

      {/* Dots */}
      <g>
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={R}
            fill={ARCH_COLOR_BY_ID[n.arch]}
            fillOpacity={dotOpacity(n.decade, n.arch)}
          />
        ))}
      </g>
    </svg>
  );
};

// ── helpers ───────────────────────────────────────────────────────
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// Seeded RNG so the chart's initial scatter is reproducible across renders.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
