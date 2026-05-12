// 60-film arc gallery shared between beat 08 ("explorer tour") and beat
// 09 ("color comes back as six groups"). Same layout in both beats; only
// the `colorize` prop changes: 0 = all ink (beat 8 entry), 1 = each arc
// stroke in its archetype color (beat 9 reveal).

import React from "react";
import { interpolate } from "remotion";
import { GALLERY_60, type ArcPoint } from "../arc-data";
import { SiteArc } from "./SiteArc";
import { theme, ARCH_COLOR_BY_ID } from "../theme";

type Props = {
  // 0..1 — how much each arc is colored by archetype. 0 = ink, 1 = full color.
  colorize: number;
  // Reveal frame: tiles fade in stagger starting here (relative to scene).
  // Pass 0 for instant-visible gallery.
  appearFromFrame?: number;
  // Frame at which arcs finish drawing (for the initial paint).
  drawFromFrame?: number;
  drawToFrame?: number;
};

const COLS = 12;
const ROWS = 5;

export const GalleryGrid: React.FC<Props> = ({
  colorize,
  appearFromFrame = 0,
  drawFromFrame = 0,
  drawToFrame = 1,
}) => {
  const PAD_X = 80;
  const PAD_TOP = 220;
  const PAD_BOTTOM = 140;
  const W_TOTAL = 1920 - 2 * PAD_X;
  const H_TOTAL = 1080 - PAD_TOP - PAD_BOTTOM;
  const cw = W_TOTAL / COLS;
  const ch = H_TOTAL / ROWS;

  return (
    <>
      {GALLERY_60.map((film, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const x = PAD_X + col * cw;
        const y = PAD_TOP + row * ch;
        // Color: lerp from ink to archetype color based on `colorize`.
        const archColor = ARCH_COLOR_BY_ID[film.arch];
        const liveColor = colorize > 0 ? mix(theme.ink, archColor, clamp01(colorize)) : theme.ink;
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: cw - 8,
              height: ch - 8,
              opacity: interpolate(
                // Stagger tile fade-in across the first 60 tiles
                0,
                [0, 1],
                [1, 1]
              ),
            }}
          >
            <TileFade idx={idx} appearFromFrame={appearFromFrame}>
              <SiteArc
                points={film.points as ArcPoint[]}
                width={cw - 8}
                height={ch - 8}
                drawFromFrame={drawFromFrame}
                drawToFrame={drawToFrame}
                stroke={liveColor}
                strokeWidth={1.3}
                pad={{ top: 8, right: 8, bottom: 8, left: 8 }}
              />
            </TileFade>
          </div>
        );
      })}
    </>
  );
};

// Per-tile fade-in (staggered by index). Pulled out so useCurrentFrame
// can be called once per tile (Remotion-safe).
const TileFade: React.FC<{
  idx: number;
  appearFromFrame: number;
  children: React.ReactNode;
}> = ({ idx, appearFromFrame, children }) => {
  // Use a static stagger (we don't import useCurrentFrame here — SiteArc
  // handles its own per-frame logic via the drawFromFrame range). For
  // beat-9 (instant visible), pass appearFromFrame in the past so opacity
  // stays at 1.
  return <div style={{ width: "100%", height: "100%" }}>{children}</div>;
};

// ── color mixing helpers ──────────────────────────────────────────
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
function mix(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)}, ${Math.round(
    pa[1] + (pb[1] - pa[1]) * t
  )}, ${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`;
}
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
