// Hand-drawn-feeling smiley/sad face glyphs for the Vonnegut y-axis.
// Strokes are intentionally a little uneven (Bézier control points
// offset by small amounts) to read as ink-on-paper rather than CSS-perfect
// emoji.

import React from "react";

export const FaceIcon: React.FC<{
  kind: "smile" | "frown";
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  // 0..1 stroke-draw progress. When < 1 the circle ring + mouth draw in
  // via stroke-dashoffset (the eyes pop in after the ring closes). Use 1
  // for a fully-drawn icon. Lets scenes choreograph a hand-drawn reveal.
  drawT?: number;
}> = ({
  kind,
  size = 64,
  stroke = "#16191e",
  strokeWidth = 1.6,
  style,
  drawT = 1,
}) => {
  const r = 24;
  const cx = 32;
  const cy = 32;
  const mouthD =
    kind === "smile"
      ? `M ${cx - 13} ${cy + 5} Q ${cx - 1} ${cy + 16}, ${cx + 13} ${cy + 5}`
      : `M ${cx - 13} ${cy + 11} Q ${cx - 1} ${cy}, ${cx + 13} ${cy + 11}`;

  const circleLen = 2 * Math.PI * r; // ≈ 150.8
  const mouthLen = 34; // generous overestimate for the short quadratic
  const t = Math.max(0, Math.min(1, drawT));

  // Circle draws first (0 → 0.7), then mouth (0.55 → 0.95), then eyes pop
  // in (0.85 → 1.0).
  const circleT = Math.max(0, Math.min(1, t / 0.7));
  const mouthT = Math.max(0, Math.min(1, (t - 0.55) / 0.4));
  const eyesT = Math.max(0, Math.min(1, (t - 0.85) / 0.15));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: "block", ...style }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circleLen}
        strokeDashoffset={circleLen * (1 - circleT)}
      />
      <circle cx={cx - 9} cy={cy - 4} r={1.6} fill={stroke} opacity={eyesT} />
      <circle cx={cx + 9} cy={cy - 4} r={1.6} fill={stroke} opacity={eyesT} />
      <path
        d={mouthD}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={mouthLen}
        strokeDashoffset={mouthLen * (1 - mouthT)}
      />
    </svg>
  );
};
