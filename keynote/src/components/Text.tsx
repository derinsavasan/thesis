import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme, fonts } from "../theme";

// Pure-opacity fade. No translate-rise — that's the "motion-graphics-
// template" look the user explicitly didn't want.

type FadeProps = {
  children: React.ReactNode;
  inFrame?: number;
  outFrame?: number;
  duration?: number;
  style?: React.CSSProperties;
};

// Slower default fade (was 14 frames). Editorial pacing prefers a more
// deliberate reveal — element should take ~0.8s to fully resolve, not
// 0.5s. Scenes can still pass `duration={N}` to override.
export const Fade: React.FC<FadeProps> = ({
  children,
  inFrame = 0,
  outFrame,
  duration = 24,
  style,
}) => {
  const frame = useCurrentFrame();
  const opIn = interpolate(frame, [inFrame, inFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opOut =
    outFrame === undefined
      ? 1
      : interpolate(frame, [outFrame, outFrame + duration], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return <div style={{ opacity: opIn * opOut, ...style }}>{children}</div>;
};

// .eyebrow style from styles.css (Inter, uppercase, 0.22em tracking).
export const Eyebrow: React.FC<{
  children: React.ReactNode;
  inFrame?: number;
  color?: string;
}> = ({ children, inFrame = 0, color = theme.inkDim }) => (
  <Fade
    inFrame={inFrame}
    duration={20}
    style={{
      fontFamily: fonts.sans,
      textTransform: "uppercase",
      letterSpacing: "0.22em",
      fontSize: 18,
      color,
    }}
  >
    {children}
  </Fade>
);

// Display headline (Fraunces).
//
// Site variation-settings (from styles.css):
//   .hero-title           "opsz" 144, "SOFT" 20      (display, non-italic)
//   .hero-title em        "opsz" 144, "SOFT" 80      (italic emphasis)
//   h2                    "opsz" 120, "SOFT" 30      (section titles)
//   h3                    "opsz" 48,  "SOFT" 20
//   h4                    "opsz" 24,  "SOFT" 30
//
// Default here is the section h2 setting; for hero-style display titles
// pass scale="hero".
export type TitleScale = "hero" | "h2" | "h3" | "h4";
const SCALE_VSETTINGS: Record<TitleScale, string> = {
  // Lock weight to 350 (slightly lighter than regular). Fraunces at opsz
  // 144 looks chunky at its display size — the website's hero uses opsz
  // 144 but at a much smaller pixel size (~64px), so the display chunky-
  // ness reads as elegant there. At 140px+ on our keynote canvas we need
  // a touch less weight to keep the editorial feel.
  hero: '"wght" 350, "opsz" 144, "SOFT" 20',
  h2: '"wght" 380, "opsz" 96, "SOFT" 30',
  h3: '"wght" 400, "opsz" 48, "SOFT" 20',
  h4: '"wght" 400, "opsz" 24, "SOFT" 30',
};
// Italic emphasis on the hero gets the chunky "SOFT" 80 cut.
const HERO_ITALIC_VSETTINGS = '"wght" 400, "opsz" 144, "SOFT" 80';

// Defaults to NON-italic. The website italicizes specific emphasis words
// inside otherwise-regular headlines (e.g. "of <em>Stories</em>", "<em>right.</em>"
// in the closing). Use the `<Em>` helper or plain JSX <em> inside the
// title for those — don't italicize the whole headline.
export const Title: React.FC<{
  children: React.ReactNode;
  inFrame?: number;
  size?: number;
  italic?: boolean;
  color?: string;
  align?: "left" | "center";
  scale?: TitleScale;
  // Per-scene override of font-variation-settings, e.g. for a custom mix.
  vSettings?: string;
}> = ({
  children,
  inFrame = 6,
  size = 84,
  italic = false,
  color = theme.ink,
  align = "left",
  scale = "h2",
  vSettings,
}) => {
  const vs =
    vSettings ?? (scale === "hero" && italic ? HERO_ITALIC_VSETTINGS : SCALE_VSETTINGS[scale]);
  return (
    <Fade
      inFrame={inFrame}
      duration={28}
      style={{
        fontFamily: fonts.display,
        fontWeight: 400,
        fontStyle: italic ? "italic" : "normal",
        fontVariationSettings: vs,
        letterSpacing: "-0.015em",
        lineHeight: 1.02,
        fontSize: size,
        color,
        maxWidth: 1500,
        textAlign: align,
      }}
    >
      {children}
    </Fade>
  );
};

// Body paragraph (Source Serif 4). Site uses 18px, 1.55 line-height.
export const Body: React.FC<{
  children: React.ReactNode;
  inFrame?: number;
  size?: number;
  color?: string;
  maxWidth?: number;
}> = ({ children, inFrame = 14, size = 22, color = theme.inkDim, maxWidth = 1100 }) => (
  <Fade
    inFrame={inFrame}
    duration={26}
    style={{
      fontFamily: fonts.body,
      fontSize: size,
      lineHeight: 1.55,
      color,
      maxWidth,
    }}
  >
    {children}
  </Fade>
);

// Italic accent — styles.css uses var(--amber-soft) for em. Use this for
// the specific emphasis words inside an otherwise-regular headline.
//
// Lock in explicit variable-font axes so the italic glyphs don't render
// with the chunky display-soft variants Fraunces picks by default when
// the parent's font-variation-settings inherit imperfectly across the
// style change. SOFT 20 keeps the italic terminals tidy; opsz 60 reads
// well at the ~72px sizes we use for partial-headline accents.
export const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <em
    style={{
      fontStyle: "italic",
      color: theme.amberSoft,
      fontVariationSettings: '"wght" 500, "opsz" 60, "SOFT" 20',
    }}
  >
    {children}
  </em>
);

// Plain italic inside a Title (Fraunces italic, no color change). For the
// hero "of Stories" treatment, pass scale="hero" on the Title and wrap
// the italic words in <em> — the parent's font-variation-settings flips
// to the chunky SOFT 80 axis when italic style is applied to em.
export const Em: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <em style={{ fontStyle: "italic" }}>{children}</em>
);
