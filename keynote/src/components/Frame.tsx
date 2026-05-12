import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

// Paper-bg (default) or ink-bg full-bleed wrapper. Matches the site's
// body background tokens 1:1.
export const Frame: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
  style?: React.CSSProperties;
}> = ({ children, dark, style }) => (
  <AbsoluteFill
    style={{
      background: dark ? theme.ink : theme.bg,
      color: dark ? theme.bg : theme.ink,
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);
