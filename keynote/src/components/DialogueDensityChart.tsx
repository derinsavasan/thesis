// Port of drawDialogueDensity + playDialogueDensityReveal from main.js
// (lines ~2779-3408). Same data join (CLUSTERED × pacing_dialogue), same
// median math, same outlier curation, same reveal staging — just frame-
// driven instead of GSAP-driven, and hover handlers dropped.

import React, { useMemo } from "react";
import { interpolate } from "remotion";
import { scaleLinear, scaleBand } from "d3-scale";
import { ascending, quantile, mean as d3mean, min as d3min, max as d3max } from "d3-array";
import { useClustered, usePacing } from "../data";
import { theme, fonts } from "../theme";

const DLG_MIN_PER_BUCKET = 12;
const DLG_BUCKETS = {
  early: { label: "1980s–90s", decades: ["1980s", "1990s"] },
  late: { label: "2010s–20s", decades: ["2010s", "2020s"] },
};
// One curated outlier per genre (early-bucket low-dialogue film). Matches
// main.js:2819-2828 exactly.
const DLG_OUTLIERS: Record<string, { match: string; display: string; year: number }> = {
  Horror: { match: "Friday The 13Th", display: "Friday the 13th", year: 1980 },
  Thriller: { match: "Body Heat", display: "Body Heat", year: 1981 },
  Fantasy: { match: "Beetlejuice", display: "Beetlejuice", year: 1988 },
  Adventure: { match: "Jurassic Park", display: "Jurassic Park", year: 1993 },
  Action: { match: "Independence Day", display: "Independence Day", year: 1996 },
  Comedy: { match: "Naked Gun 33 The Final Insult", display: "Naked Gun 33⅓", year: 1994 },
  "Science Fiction": { match: "Et The Extra Terrestrial", display: "E.T.", year: 1982 },
  Drama: { match: "Schindlers List", display: "Schindler’s List", year: 1993 },
};

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

type Row = {
  genre: string;
  early: number;
  late: number;
  delta: number;
};

type Outlier = {
  display: string;
  density: number;
};

type Props = {
  width: number;
  height: number;
  seconds: number;
  // Optional set of genres to highlight in the accent color. Other rows
  // dim back so the eye is pulled to all of these at once.
  focusGenres?: string[];
  // 0 = no focus (default chart), 1 = full highlight.
  focusT?: number;
};

export const DialogueDensityChart: React.FC<Props> = ({
  width,
  height,
  seconds,
  focusGenres,
  focusT = 0,
}) => {
  const clustered = useClustered();
  const pacing = usePacing();

  const { rows, outliers } = useMemo(() => {
    if (!clustered || !pacing) return { rows: [] as Row[], outliers: new Map<string, Outlier>() };
    // dialogue_density by imdb_id (which matches CLUSTERED.film_id)
    const dialByImdb = new Map<string, number>();
    for (const p of pacing) {
      if (typeof p.dialogue_density === "number") {
        dialByImdb.set(p.imdb_id, p.dialogue_density);
      }
    }
    // grid[genre][bucket] = array of densities
    const grid = new Map<string, { early: number[]; late: number[] }>();
    for (const f of clustered) {
      const g = f.primary_genre;
      const dec = f.decade;
      const dval = dialByImdb.get(f.film_id);
      if (typeof dval !== "number" || !g || g === "Unknown") continue;
      let bucket: "early" | "late" | null = null;
      if (DLG_BUCKETS.early.decades.includes(dec)) bucket = "early";
      else if (DLG_BUCKETS.late.decades.includes(dec)) bucket = "late";
      if (!bucket) continue;
      if (!grid.has(g)) grid.set(g, { early: [], late: [] });
      grid.get(g)![bucket].push(dval);
    }

    const median = (arr: number[]): number => {
      const s = arr.slice().sort(ascending);
      return quantile(s, 0.5) ?? 0;
    };

    const out: Row[] = [];
    for (const [genre, b] of grid.entries()) {
      if (b.early.length < DLG_MIN_PER_BUCKET) continue;
      if (b.late.length < DLG_MIN_PER_BUCKET) continue;
      const em = median(b.early);
      const lm = median(b.late);
      out.push({ genre, early: em, late: lm, delta: lm - em });
    }
    out.sort((a, b) => b.delta - a.delta);

    // Outlier resolution: find the specific film density for each curated pick.
    const outlierByGenre = new Map<string, Outlier>();
    for (const r of out) {
      const pick = DLG_OUTLIERS[r.genre];
      if (!pick) continue;
      const wantTitle = normalizeTitle(pick.match);
      const film = clustered.find(
        (f) =>
          f.primary_genre === r.genre &&
          Number(f.year) === pick.year &&
          normalizeTitle(f.title) === wantTitle
      );
      if (film) {
        const d = dialByImdb.get(film.film_id);
        if (typeof d === "number") {
          outlierByGenre.set(r.genre, { display: pick.display, density: d });
        }
      }
    }

    return { rows: out, outliers: outlierByGenre };
  }, [clustered, pacing]);

  // Layout — mirrors main.js:2920-2935
  // Bumped left margin: with the bigger 20px genre labels, "Science
  // Fiction" overflowed the chart's viewbox on the left.
  const m = { top: 90, right: 130, bottom: 70, left: 200 };
  const innerW = width - m.left - m.right;
  const innerH = height - m.top - m.bottom;

  if (rows.length === 0) return <svg width={width} height={height} />;

  const xMin = d3min(rows, (d) => Math.min(d.early, d.late)) ?? 0;
  const xMax = d3max(rows, (d) => Math.max(d.early, d.late)) ?? 1;
  const pad = 0.02;
  const xS = scaleLinear()
    .domain([Math.max(0, xMin - pad), Math.min(1, xMax + pad)])
    .range([m.left, m.left + innerW]);
  const yS = scaleBand<string>()
    .domain(rows.map((d) => d.genre))
    .range([m.top, m.top + innerH])
    .paddingInner(0.4);
  const rowY = (g: string) => (yS(g) ?? 0) + yS.bandwidth() / 2;

  // Climb-magnitude color
  const sortedDeltas = rows.map((r) => r.delta).slice().sort(ascending);
  const colorOf = (delta: number): string => {
    const minD = sortedDeltas[0];
    const maxD = sortedDeltas[sortedDeltas.length - 1];
    const t = (delta - minD) / (maxD - minD || 1);
    return t > 0.66 ? theme.amber : t > 0.33 ? theme.amberSoft : theme.inkDim;
  };

  // Outlier leader trail-length scale (same as main.js:3013-3018)
  const outlierEntries = rows
    .map((r) => ({ r, out: outliers.get(r.genre) }))
    .filter((e): e is { r: Row; out: Outlier } => Boolean(e.out));
  const maxSpread = d3max(outlierEntries, (e) => e.r.early - e.out.density) || 1;
  const earliestEarlyX = d3min(rows, (r) => xS(r.early)) ?? m.left;
  const trailMaxPx = Math.max(60, earliestEarlyX - m.left - 8);
  const trailScale = scaleLinear().domain([0, maxSpread]).range([24, trailMaxPx]);

  // ── Reveal timing — mirrors playDialogueDensityReveal:3235-3408 ─
  const t = seconds;
  // 1. Hairline draws over 0.0-1.2s
  const hairlineT = clamp01(t / 1.2);
  // 2. Headers fade in 0.4-1.0s
  const headerOp = clamp01((t - 0.4) / 0.6);
  // 3. Ticks stagger left→right over 1.0-1.8s
  const tickT = (i: number, total: number) => {
    const start = 1.0 + (i / Math.max(1, total - 1)) * 0.8;
    return clamp01((t - start) / 0.3);
  };
  // 4. Per-row reveal: genre label → guide → connector grows → late dot → Δ → outlier
  //    Row i starts at base = 2.0 + i * 0.25, lasts ~1.6s total
  const rowReveal = (i: number) => {
    const base = 2.0 + i * 0.25;
    return {
      genreLabelOp: clamp01((t - base) / 0.25),
      guideOp: clamp01((t - base - 0.05) / 0.25) * 0.6,
      earlyDotOp: clamp01((t - base - 0.1) / 0.25),
      connectorT: clamp01((t - base - 0.25) / 0.5), // 0..1 line growth
      lateDotOp: clamp01((t - base - 0.75) / 0.25),
      deltaOp: clamp01((t - base - 0.85) / 0.25),
      outlierLeaderT: clamp01((t - base - 1.0) / 0.4),
      outlierLabelOp: clamp01((t - base - 1.3) / 0.3),
    };
  };

  const niceTicks = xS.ticks(5);
  const axisY = m.top + innerH + 28;

  // Focus state. The chart no longer zooms when an outlier is called
  // out — instead the focused row briefly recolors to the accent
  // (amber), other rows dim back. Less visually busy than a series of
  // zoom in/out moves.
  const focusSet =
    focusGenres && focusGenres.some((g) => yS(g) !== undefined)
      ? new Set(focusGenres)
      : null;
  const focusEffective = focusSet ? focusT : 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      {/* Bucket headers (top) */}
      {(["early", "late"] as const).map((key) => {
        const glyph = key === "early" ? "○" : "●";
        const meanVal = d3mean(rows, (d) => d[key]) ?? 0;
        return (
          <text
            key={key}
            x={xS(meanVal)}
            y={m.top - 28}
            textAnchor="middle"
            fontFamily={fonts.mono}
            fontSize={15}
            letterSpacing="0.18em"
            style={{ textTransform: "uppercase" }}
            fill={key === "late" ? theme.amber : theme.inkDim}
            opacity={headerOp}
          >
            {`${glyph}  ${DLG_BUCKETS[key].label}`}
          </text>
        );
      })}

      {/* X-axis hairline + ticks + caption */}
      <line
        x1={m.left}
        x2={m.left + innerW * hairlineT}
        y1={axisY - 14}
        y2={axisY - 14}
        stroke={theme.rule}
        strokeWidth={0.6}
      />
      {niceTicks.map((tv, i) => {
        const xv = xS(tv);
        const op = tickT(i, niceTicks.length);
        return (
          <g key={i} opacity={op}>
            <line
              x1={xv}
              x2={xv}
              y1={axisY - 18}
              y2={axisY - 10}
              stroke={theme.rule}
              strokeWidth={0.6}
            />
            <text
              x={xv}
              y={axisY}
              textAnchor="middle"
              fontFamily={fonts.mono}
              fontSize={14}
              fill={theme.inkDim}
              letterSpacing="0.06em"
            >{`${Math.round(tv * 100)}%`}</text>
          </g>
        );
      })}
      <text
        x={m.left + innerW / 2}
        y={axisY + 24}
        textAnchor="middle"
        fontFamily={fonts.mono}
        fontSize={13}
        letterSpacing="0.18em"
        style={{ textTransform: "uppercase" }}
        fill={theme.inkFaint}
        opacity={clamp01((t - 1.8) / 0.4)}
      >
        dialogue as % of total script · genre median
      </text>

      {/* Rows */}
      {rows.map((d, i) => {
        const yy = rowY(d.genre);
        const baseColor = colorOf(d.delta);
        // When this row is in focus, shift to the accent color so it
        // visually pops. Other rows dim back so the eye is pulled here.
        const isFocus = focusSet?.has(d.genre) ?? false;
        const color = isFocus
          ? mixHexLite(baseColor, theme.amber, focusEffective)
          : baseColor;
        const rev = rowReveal(i);
        const out = outliers.get(d.genre);

        // Connector growth: line grows from early X toward late X.
        const xe = xS(d.early);
        const xl = xS(d.late);
        const xLive = xe + (xl - xe) * rev.connectorT;

        // Outlier leader growth (early dot leftward)
        let outlierTrailLeft = 0;
        let outlierTrailRight = 0;
        if (out) {
          const spread = d.early - out.density;
          const trailLen = trailScale(spread) ?? 0;
          outlierTrailRight = xe - 6;
          const fullLeft = outlierTrailRight - trailLen;
          outlierTrailLeft = outlierTrailRight - (outlierTrailRight - fullLeft) * rev.outlierLeaderT;
        }

        // When a focus set is active, fade non-focused rows back so the
        // eye is pulled to the highlighted ones.
        const rowFocusOp =
          focusSet && !focusSet.has(d.genre) ? 1 - focusEffective * 0.7 : 1;

        return (
          <g key={d.genre} className="dlg-row" opacity={rowFocusOp}>
            {/* Guide */}
            <line
              x1={m.left}
              x2={m.left + innerW}
              y1={yy}
              y2={yy}
              stroke={theme.rule}
              strokeWidth={0.4}
              opacity={rev.guideOp}
            />
            {/* Outlier leader + tip + label */}
            {out && rev.outlierLeaderT > 0 && (
              <g>
                <line
                  x1={outlierTrailLeft}
                  x2={outlierTrailRight}
                  y1={yy}
                  y2={yy}
                  stroke={color}
                  strokeWidth={0.8}
                  strokeDasharray="2 3"
                  opacity={0.6 * rev.outlierLeaderT}
                />
                <circle cx={outlierTrailLeft} cy={yy} r={3} fill={color} opacity={rev.outlierLeaderT} />
                <text
                  x={outlierTrailLeft + 8}
                  y={yy - 10}
                  fontFamily={fonts.display}
                  fontSize={16}
                  fill={color}
                  opacity={rev.outlierLabelOp}
                >
                  <tspan fontStyle="italic">{out.display}</tspan>
                  {`, ${Math.round(out.density * 100)}%`}
                </text>
              </g>
            )}
            {/* Dumbbell connector */}
            <line
              x1={xe}
              x2={xLive}
              y1={yy}
              y2={yy}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.85 * rev.earlyDotOp}
            />
            {/* Early dot (hollow ring) */}
            <circle
              cx={xe}
              cy={yy}
              r={4.5}
              fill={theme.bg}
              stroke={theme.inkDim}
              strokeWidth={1.3}
              opacity={rev.earlyDotOp}
            />
            {/* Late dot (filled accent) */}
            <circle cx={xl} cy={yy} r={5.5} fill={color} opacity={rev.lateDotOp} />
            {/* Genre label (left) */}
            <text
              x={m.left - 18}
              y={yy + 4}
              textAnchor="end"
              fontFamily={fonts.display}
              fontSize={20}
              fontWeight={400}
              style={{ fontVariationSettings: '"wght" 400, "opsz" 72, "SOFT" 30' }}
              fill={theme.ink}
              opacity={rev.genreLabelOp}
            >
              {d.genre}
            </text>
            {/* Delta annotation (right) */}
            <text
              x={m.left + innerW + 18}
              y={yy + 4}
              fontFamily={fonts.mono}
              fontSize={15}
              letterSpacing="0.04em"
              fill={color}
              opacity={rev.deltaOp}
            >
              {`${d.delta >= 0 ? "+" : "−"}${Math.abs(d.delta * 100).toFixed(1)}pt`}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// Simple sRGB lerp between two color strings. Handles both hex (#rrggbb)
// and `rgb(r, g, b)` inputs — palette tokens in theme.ts use both.
function mixHexLite(a: string, b: string, t: number): string {
  const pa = parseColor(a);
  const pb = parseColor(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
function parseColor(s: string): [number, number, number] {
  if (s.startsWith("#")) {
    const h = s.slice(1);
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  const m = s.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}
