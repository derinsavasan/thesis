import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme, fonts } from "../theme";

// Eased numeric counter using ease-out-cubic so it slows as it lands.
export const NumberTicker: React.FC<{
  from: number;
  to: number;
  fromFrame: number;
  toFrame: number;
  size?: number;
  color?: string;
  format?: (n: number) => string;
}> = ({ from, to, fromFrame, toFrame, size = 120, color = theme.amber, format }) => {
  const frame = useCurrentFrame();
  const tRaw = interpolate(frame, [fromFrame, toFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - tRaw, 3);
  const v = Math.round(from + (to - from) * eased);
  const fmt = format ?? ((n: number) => n.toLocaleString("en-US"));
  return (
    <span
      style={{
        fontFamily: fonts.mono,
        fontSize: size,
        color,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      {fmt(v)}
    </span>
  );
};
