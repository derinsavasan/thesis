// Port of drawShapeShift + playShapeShiftReveal from main.js (~3380-4053).
// Genre view only (no drilldown) — same data, same stacking, same palette,
// same curve (curveMonotoneX), same band labels with leader lines.
//
// Reveal staging (matches playShapeShiftReveal):
//   t=0.0  y-grid lines fade in (zero line first, then 25/50/75/100%)
//   t=0.7  decade labels stagger left→right
//   t=1.5  baseline + clip-rect sweep
//   t=3.0  bands grow from baseline (areaFlat → area) bottom-up
//   t=6.3  right-edge band labels fade in (Drama first)
//   t=7.1  bottom caption

import React, { useMemo } from "react";
import { scalePoint, scaleLinear } from "d3-scale";
import { area as d3area, stack as d3stack, curveMonotoneX, stackOrderNone } from "d3-shape";
import { useClustered } from "../data";
import { theme, fonts, ARCH_COLOR_BY_ID, ARCHETYPE_NAMES_BY_ID } from "../theme";

const SS_DECADES = ["1980s", "1990s", "2000s", "2010s", "2020s"];
const SS_GENRE_ORDER = ["Drama", "Comedy", "Action", "Horror", "Adventure", "Animation", "Other"];
const SS_NAMED = new Set(["Drama", "Comedy", "Action", "Horror", "Adventure", "Animation"]);
const SS_GENRE_COLOR: Record<string, string> = {
  Drama: "#1a1d22",
  Comedy: "#3a4049",
  Action: "#5a626d",
  Horror: "#7a8290",
  Adventure: "#969da6",
  Animation: "#b0b6bb",
  Other: "#c8cbcd",
};
// Archetype stack order (bottom-up) from main.js:3408
const SS_ARCH_STACK_ORDER = [3, 1, 0, 2, 5, 4];

type DecadeRow = { decade: string; [genre: string]: string | number };

type Props = {
  width: number;
  height: number;
  seconds: number;
  // When set, render the archetype-share breakdown WITHIN this genre
  // instead of the genre stack. Mirrors the website's drilldown view.
  drilldownGenre?: string;
  // Optional: which archetype id (0-5) to spotlight inside the drilldown
  // (dims the other bands, calls out the label). Mirrors hover-row.
  spotlightArchetype?: number;
};

export const ShapeShiftChart: React.FC<Props> = ({
  width,
  height,
  seconds,
  drilldownGenre,
  spotlightArchetype,
}) => {
  const clustered = useClustered();

  // Aggregate proportions per decade. When `drilldownGenre` is set, this
  // computes archetype-share within that genre (matching main.js:3458-3490);
  // otherwise it computes genre-share across the whole corpus.
  const { decadeRows, keys, colorOf, labelOf } = useMemo(() => {
    if (!clustered) {
      return {
        decadeRows: [] as DecadeRow[],
        keys: [] as string[],
        colorOf: (_k: string) => theme.ink,
        labelOf: (_k: string) => "",
      };
    }
    if (drilldownGenre) {
      // Archetype-within-genre view
      const counts = new Map<string, number>();
      const totals = new Map<string, number>();
      for (const r of clustered) {
        if (!SS_DECADES.includes(r.decade)) continue;
        if (r.primary_genre !== drilldownGenre) continue;
        const a = +r.dominant_archetype;
        if (!Number.isFinite(a) || a < 0 || a > 5) continue;
        totals.set(r.decade, (totals.get(r.decade) || 0) + 1);
        const k = `${r.decade}|${a}`;
        counts.set(k, (counts.get(k) || 0) + 1);
      }
      const archKeys = SS_ARCH_STACK_ORDER.map((a) => `A${a}`);
      const rows: DecadeRow[] = SS_DECADES.map((dec) => {
        const tot = totals.get(dec) || 1;
        const row: DecadeRow = { decade: dec };
        SS_ARCH_STACK_ORDER.forEach((a) => {
          row[`A${a}`] = (counts.get(`${dec}|${a}`) || 0) / tot;
        });
        return row;
      });
      return {
        decadeRows: rows,
        keys: archKeys,
        colorOf: (k: string) => ARCH_COLOR_BY_ID[+k.slice(1)],
        labelOf: (k: string) => ARCHETYPE_NAMES_BY_ID[+k.slice(1)],
      };
    }
    // Genre view (default)
    const counts = new Map<string, number>();
    const totals = new Map<string, number>();
    for (const r of clustered) {
      if (!SS_DECADES.includes(r.decade)) continue;
      let g = r.primary_genre;
      if (!g || g === "Unknown") continue;
      if (!SS_NAMED.has(g)) g = "Other";
      totals.set(r.decade, (totals.get(r.decade) || 0) + 1);
      const k = `${r.decade}|${g}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    const rows: DecadeRow[] = SS_DECADES.map((dec) => {
      const tot = totals.get(dec) || 1;
      const row: DecadeRow = { decade: dec };
      SS_GENRE_ORDER.forEach((g) => {
        row[g] = (counts.get(`${dec}|${g}`) || 0) / tot;
      });
      return row;
    });
    return {
      decadeRows: rows,
      keys: SS_GENRE_ORDER,
      colorOf: (k: string) => SS_GENRE_COLOR[k],
      labelOf: (k: string) => k,
    };
  }, [clustered, drilldownGenre]);

  // Layout — mirrors main.js:3514-3520
  const m = { top: 70, right: 200, bottom: 80, left: 80 };
  const innerW = width - m.left - m.right;
  const innerH = height - m.top - m.bottom;

  const xS = scalePoint<string>().domain(SS_DECADES).range([m.left, m.left + innerW]).padding(0);
  const yS = scaleLinear().domain([0, 1]).range([height - m.bottom, m.top]);

  // Build stacked series using whichever keys the current view defines
  // (genre keys, or `A0..A5` archetype keys when drilled down).
  const series = useMemo(() => {
    if (decadeRows.length === 0) return [];
    return d3stack<DecadeRow, string>().keys(keys).order(stackOrderNone)(decadeRows);
  }, [decadeRows, keys]);

  // Area generators (full + flat baseline for grow-in transition)
  const area = d3area<[number, number]>()
    .x((_d, i) => xS(SS_DECADES[i]) as number)
    .y0((d) => yS(d[0]))
    .y1((d) => yS(d[1]))
    .curve(curveMonotoneX);
  const areaFlat = d3area<[number, number]>()
    .x((_d, i) => xS(SS_DECADES[i]) as number)
    .y0((d) => yS(d[0]))
    .y1((d) => yS(d[0]))
    .curve(curveMonotoneX);

  // ── Reveal timing ───────────────────────────────────────────────
  const t = seconds;
  // Y-grid: zero line at t=0, others stagger over 0.0-0.6s
  const gridOp = (i: number) => clamp01((t - i * 0.12) / 0.4);
  // Decade labels: 0.7-1.4s
  const decLabelOp = (i: number) =>
    clamp01((t - 0.7 - i * 0.12) / 0.3);
  // Clip-rect sweeps 1.5-2.9s, bands then grow from baseline 3.0-5.5s
  const clipT = clamp01((t - 1.5) / 1.4);
  // Each band's grow progress 0..1, staggered in stack order
  const bandGrowT = (i: number) => {
    const start = 3.0 + i * 0.18;
    return clamp01((t - start) / 1.3);
  };
  // Right-edge band labels: 6.3-7.0s
  const bandLabelOp = (i: number) => clamp01((t - 6.3 - i * 0.08) / 0.3);
  // Caption
  const captionOp = clamp01((t - 7.1) / 0.4);

  // Interpolated path: mix between areaFlat (start) and area (end) per band.
  const bandPath = (s: (typeof series)[number], i: number) => {
    const tt = bandGrowT(i);
    if (tt <= 0) return areaFlat(s as any) ?? "";
    if (tt >= 1) return area(s as any) ?? "";
    // Linearly mix d strings via per-point lerp
    const flatPts = (s as any).map((d: [number, number], idx: number) => {
      const x = xS(SS_DECADES[idx]) as number;
      const y0 = yS(d[0]);
      return { x, top: y0, bot: y0 };
    });
    const fullPts = (s as any).map((d: [number, number], idx: number) => {
      const x = xS(SS_DECADES[idx]) as number;
      const y0 = yS(d[0]);
      const y1 = yS(d[1]);
      return { x, top: y1, bot: y0 };
    });
    const mixed = flatPts.map((p: any, j: number) => ({
      x: p.x,
      top: p.top + (fullPts[j].top - p.top) * tt,
      bot: p.bot + (fullPts[j].bot - p.bot) * tt,
    }));
    // Build path manually using same curveMonotoneX
    // (Easier: pass mixed top/bot through a tiny area generator.)
    const subArea = d3area<{ x: number; top: number; bot: number }>()
      .x((d) => d.x)
      .y0((d) => d.bot)
      .y1((d) => d.top)
      .curve(curveMonotoneX);
    return subArea(mixed) ?? "";
  };

  // Right-edge label positions: place at right edge of last band slice (decade 2020s)
  const labelEntries = series.map((s, i) => {
    const key = s.key;
    const last = s[s.length - 1] ?? [0, 0];
    const yMid = yS(((last[0] as number) + (last[1] as number)) / 2);
    const heightOfBand = yS(last[0]) - yS(last[1]);
    return { key, yMid, heightOfBand, i };
  });

  if (decadeRows.length === 0) return <svg width={width} height={height} />;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id="ss-clip">
          <rect x={m.left} y={m.top} width={innerW * clipT} height={innerH} />
        </clipPath>
      </defs>

      {/* Y-grid + labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((tv, i) => {
        const isZero = tv === 0;
        return (
          <g key={tv} opacity={gridOp(i)}>
            <line
              x1={m.left}
              x2={m.left + innerW}
              y1={yS(tv)}
              y2={yS(tv)}
              stroke={isZero ? theme.inkDim : theme.rule}
              strokeWidth={isZero ? 1 : 0.5}
              strokeDasharray={isZero ? undefined : "2 6"}
            />
            <text
              x={m.left - 12}
              y={yS(tv) + 4}
              textAnchor="end"
              fontFamily={fonts.mono}
              fontSize={10}
              fill={theme.inkFaint}
            >
              {`${Math.round(tv * 100)}%`}
            </text>
          </g>
        );
      })}

      {/* Decade labels */}
      {SS_DECADES.map((dec, i) => (
        <text
          key={dec}
          x={xS(dec) as number}
          y={height - m.bottom + 24}
          textAnchor="middle"
          fontFamily={fonts.mono}
          fontSize={11}
          fill={theme.inkFaint}
          opacity={decLabelOp(i)}
        >
          {dec}
        </text>
      ))}

      {/* Bands (clipped). When a spotlightArchetype is active during a
          drilldown, non-matching bands dim — same hover-row interaction
          the site uses. */}
      <g clipPath="url(#ss-clip)">
        {series.map((s, i) => {
          let bandOp = clamp01(bandGrowT(i) * 1.1);
          if (drilldownGenre && spotlightArchetype != null) {
            const archId = parseInt(s.key.slice(1), 10);
            bandOp *= archId === spotlightArchetype ? 1 : 0.32;
          }
          return (
            <path key={s.key} d={bandPath(s, i)} fill={colorOf(s.key)} opacity={bandOp} />
          );
        })}
      </g>

      {/* Right-edge band labels */}
      {labelEntries.map((e) => {
        let labelOp = bandLabelOp(e.i);
        if (drilldownGenre && spotlightArchetype != null) {
          const archId = parseInt(e.key.slice(1), 10);
          labelOp *= archId === spotlightArchetype ? 1 : 0.35;
        }
        return (
          <text
            key={e.key}
            x={m.left + innerW + 12}
            y={e.yMid + 4}
            fontFamily={fonts.body}
            fontWeight={400}
            fontSize={14}
            style={{ fontVariationSettings: '"wght" 400, "opsz" 24, "SOFT" 30' }}
            fill={colorOf(e.key)}
            opacity={labelOp}
          >
            {labelOf(e.key)}
          </text>
        );
      })}

      {/* Breadcrumb */}
      <text
        x={m.left}
        y={m.top - 22}
        fontFamily={fonts.mono}
        fontSize={10}
        letterSpacing="0.22em"
        fill={drilldownGenre ? theme.inkFaint : theme.ink}
        opacity={clamp01((t - 0.4) / 0.4)}
      >
        ALL FILMS
      </text>
      {drilldownGenre && (
        <>
          <text
            x={m.left + 92}
            y={m.top - 22}
            fontFamily={fonts.mono}
            fontSize={10}
            fill={theme.inkFaint}
          >
            /
          </text>
          <text
            x={m.left + 110}
            y={m.top - 22}
            fontFamily={fonts.mono}
            fontSize={10}
            letterSpacing="0.22em"
            style={{ textTransform: "uppercase" }}
            fill={SS_GENRE_COLOR[drilldownGenre] || theme.ink}
          >
            {drilldownGenre}
          </text>
        </>
      )}

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
        {drilldownGenre
          ? `SHAPE MIX WITHIN ${drilldownGenre.toUpperCase()}`
          : "SHARE OF FILMS BY GENRE"}
      </text>
    </svg>
  );
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
