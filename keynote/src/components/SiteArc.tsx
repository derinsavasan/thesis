// Renders an arc the same way the live website does.
//
// Mirrors main.js drawIntroArc / drawExplorerArc:
//   • position-based x axis (uses each point's .position, not 0..1 linear)
//   • fixed y-domain [-2.5, 2.5]
//   • d3.curveCatmullRom.alpha(0.6)
//   • stroke-dasharray draw, 1300ms cubic-inOut equivalent
//   • optional color transition once the path completes
//   • optional turning-point dots (local extrema, endpoints excluded)
//
// Inputs come straight from arcs_all.json shape:
//   points: [{ position: number, z_score: number }, ...]

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { scaleLinear } from "d3-scale";
import { line as d3Line, curveCatmullRom } from "d3-shape";
import { theme, fonts } from "../theme";

export type ArcPoint = { position: number; z_score: number };

type Props = {
  points: ArcPoint[];
  width: number;
  height: number;
  // Frame range over which the stroke draws on (relative to scene start).
  drawFromFrame: number;
  drawToFrame: number;
  stroke?: string;
  // Optional color transition AFTER the draw — matches the site's
  // "stroke turns from ink to archetype color" beat.
  colorTransitionTo?: string;
  colorTransitionFrames?: number;
  strokeWidth?: number;
  // Show the BEGINNING / END axis labels and y=0 zero line.
  showAxes?: boolean;
  // Show local-extrema dots, fading in after the draw completes.
  showDots?: boolean;
  dotsFadeFrames?: number;
  // Optional hover-state highlight for a specific dot index (peak/trough).
  highlightDotIndex?: number;
  // Padding in pixels.
  pad?: { top: number; right: number; bottom: number; left: number };
};

// Cubic in-out easing — matches the site's d3.easeCubicInOut on the draw.
function easeCubicInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const SiteArc: React.FC<Props> = ({
  points,
  width,
  height,
  drawFromFrame,
  drawToFrame,
  stroke = theme.ink,
  colorTransitionTo,
  colorTransitionFrames = 16,
  strokeWidth = 2,
  showAxes = false,
  showDots = false,
  dotsFadeFrames = 12,
  highlightDotIndex,
  pad = { top: 36, right: 28, bottom: 36, left: 48 },
}) => {
  const frame = useCurrentFrame();

  // Y-domain fixed at the same ±2.5 the website uses.
  const Y_MIN = -2.5;
  const Y_MAX = 2.5;

  const x = scaleLinear().domain([0, 1]).range([pad.left, width - pad.right]);
  const y = scaleLinear().domain([Y_MIN, Y_MAX]).range([height - pad.bottom, pad.top]);

  // Build path with Catmull-Rom alpha=0.6, threading through (position, z_score).
  const pathBuilder = d3Line<ArcPoint>()
    .x((d) => x(d.position))
    .y((d) => y(d.z_score))
    .curve(curveCatmullRom.alpha(0.6));

  const d = pathBuilder(points) ?? "";

  // Stroke-dashoffset draw. We normalize via SVG's `pathLength` attribute
  // so the dash math is independent of the real path length — using a
  // raw `width * k` estimate undershoots wiggly arcs in narrow tiles
  // (the dash pattern then repeats and a second "ghost" trace draws
  // after the first).
  const drawTRaw = interpolate(frame, [drawFromFrame, drawToFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drawT = easeCubicInOut(drawTRaw);
  const dashOffset = 1 - drawT;

  // Stroke color: ink during draw, transitions to colorTransitionTo over
  // colorTransitionFrames once the draw lands.
  const colorT = colorTransitionTo
    ? interpolate(
        frame,
        [drawToFrame, drawToFrame + colorTransitionFrames],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;
  const liveStroke = colorTransitionTo ? mix(stroke, colorTransitionTo, colorT) : stroke;

  // Local-extrema dots (same math as main.js: peak/trough vs neighbors).
  const extrema: { i: number; type: "peak" | "trough" }[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const v = points[i].z_score;
    const prev = points[i - 1].z_score;
    const next = points[i + 1].z_score;
    if (v > prev && v > next) extrema.push({ i, type: "peak" });
    else if (v < prev && v < next) extrema.push({ i, type: "trough" });
  }

  const dotsOpacity = interpolate(
    frame,
    [drawToFrame, drawToFrame + dotsFadeFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // y(0) baseline for the axis frame.
  const yZero = y(0);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {showAxes && (
        <g style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {/* y=0 line */}
          <line
            x1={pad.left}
            y1={yZero}
            x2={width - pad.right}
            y2={yZero}
            stroke={theme.rule}
            strokeWidth={1}
          />
          {/* BEGINNING / END labels at the corners */}
          <text x={pad.left} y={yZero - 8} fill={theme.inkFaint}>
            BEGINNING
          </text>
          <text x={width - pad.right} y={yZero - 8} fill={theme.inkFaint} textAnchor="end">
            END
          </text>
          {/* Smile / frown face icons replace the POSITIVE / NEGATIVE
              text labels. Match the FaceIcon convention used in the
              Vonnegut / Process beats so emotion axes read the same
              way across the keynote. */}
          <AxisFace cx={pad.left - 22} cy={pad.top + 14} size={26} kind="smile" color={theme.inkFaint} />
          <AxisFace cx={pad.left - 22} cy={height - pad.bottom - 14} size={26} kind="frown" color={theme.inkFaint} />
        </g>
      )}

      <path
        d={d}
        fill="none"
        stroke={liveStroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={dashOffset}
      />

      {showDots &&
        extrema.map(({ i, type }, idx) => {
          const p = points[i];
          const cx = x(p.position);
          const cy = y(p.z_score);
          const isHighlight = idx === highlightDotIndex;
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={isHighlight ? 9 : 6}
              fill={type === "peak" ? theme.turnWarm : theme.turnCool}
              opacity={dotsOpacity * (isHighlight ? 1 : 0.85)}
            />
          );
        })}
    </svg>
  );
};

// Smile / frown glyph rendered inline inside SiteArc's parent SVG (a
// nested <svg> with its own 64×64 viewBox so the stroke math from the
// FaceIcon component carries over cleanly). Sits at the y-axis ends to
// label "positive" and "negative" without needing text.
const AxisFace: React.FC<{
  cx: number;
  cy: number;
  size: number;
  kind: "smile" | "frown";
  color: string;
}> = ({ cx, cy, size, kind, color }) => {
  const mouthD =
    kind === "smile"
      ? "M 19 37 Q 31 48, 45 37"
      : "M 19 43 Q 31 32, 45 43";
  return (
    <svg
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      overflow="visible"
    >
      <circle cx={32} cy={32} r={24} fill="none" stroke={color} strokeWidth={3} />
      <circle cx={23} cy={28} r={3} fill={color} />
      <circle cx={41} cy={28} r={3} fill={color} />
      <path d={mouthD} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
};

// Linear color mix in sRGB (good enough for inkable colors and short
// transitions; avoids the LAB-space rounding gymnastics).
function mix(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
