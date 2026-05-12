// Theme tokens lifted directly from docs/styles.css :root. If you change
// a token on the site, change it here too so the keynote stays in sync.
//
// Fonts use @remotion/google-fonts which bundles the actual font files
// into the rendered MP4. The previous (broken) approach relied on CSS
// font-family alone, which silently fell back to Georgia in headless
// Chrome because the site uses font-display: optional.

import { delayRender, continueRender } from "remotion";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadSourceSerif } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

// These calls register the fonts at module load. The studio + renderer
// guarantee them present before paint, so every <Composition> uses the
// real Fraunces / Source Serif 4 / Inter / JetBrains Mono, not a fallback.
const fraunces = loadFraunces();
const sourceSerif = loadSourceSerif();
const inter = loadInter();
const jetbrains = loadJetBrains();

// ALSO inject the website's exact Google Fonts URL so the variable axes
// (opsz, SOFT, ital, wght) are available for font-variation-settings.
// The @remotion/google-fonts modules above register a single weight by
// default — they don't enable the variable axes Fraunces needs for the
// hero's "opsz" 144, "SOFT" 25/20/80 look. This <link> brings them in.
// We use display=block instead of the site's display=optional so the
// renderer actually waits for them.
if (typeof document !== "undefined") {
  const HREF =
    "https://fonts.googleapis.com/css2" +
    "?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..900,0..100;1,9..144,300..900,0..100" +
    "&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900" +
    "&family=Inter:wght@300;400;500;600" +
    "&family=JetBrains+Mono:wght@400;500" +
    "&display=block";
  if (!document.querySelector(`link[data-keynote-fonts]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = HREF;
    link.setAttribute("data-keynote-fonts", "1");
    document.head.appendChild(link);
    // Wait for the *specific* variable-axis faces to load before render.
    const handle = delayRender("variable-fonts");
    Promise.all([
      document.fonts.load('italic 144px "Fraunces"'),
      document.fonts.load('400 144px "Fraunces"'),
      document.fonts.load('italic 56px "Source Serif 4"'),
      document.fonts.load('500 24px "Source Serif 4"'),
      document.fonts.load('500 18px "Inter"'),
      document.fonts.load('400 14px "JetBrains Mono"'),
    ])
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }
}

export const fonts = {
  display: fraunces.fontFamily, // Fraunces
  body: sourceSerif.fontFamily, // Source Serif 4
  sans: inter.fontFamily, // Inter
  mono: jetbrains.fontFamily, // JetBrains Mono
} as const;

// Palette (paste-for-paste from styles.css :root).
export const theme = {
  ink: "#16191e",
  inkDim: "#3f4651",
  inkFaint: "#6c7585",
  bg: "#eef0e7",
  bgRaise: "#e2e5db",
  bgDeep: "#d6dbcf",
  amber: "#8a5a14",
  amberSoft: "#b07a1f",
  red: "#8e2c25",
  rule: "#b7bdac",
  ruleSoft: "#c8cdba",
  turnWarm: "#c25a18",
  turnCool: "#2b4a6f",
} as const;

// Per-archetype colors lifted verbatim from main.js:69 (ARCH_COLOR).
// Two index conventions live side by side:
//   • by-name (used in our scenes for readability)
//   • by-id  (used in the website's CSV / chart code via dominant_archetype)
export const ARCH_COLOR_BY_ID: Record<number, string> = {
  0: "#4a6da7", // Oedipus
  1: "#c84630", // Icarus
  2: "#2a9d8f", // Man in a Hole
  3: "#8b2a4d", // Tragedy
  4: "#d4a017", // Rags to Riches
  5: "#6a4c93", // Cinderella
};
export const archetypeColors = {
  oedipus: ARCH_COLOR_BY_ID[0],
  icarus: ARCH_COLOR_BY_ID[1],
  "man-in-a-hole": ARCH_COLOR_BY_ID[2],
  tragedy: ARCH_COLOR_BY_ID[3],
  "rags-to-riches": ARCH_COLOR_BY_ID[4],
  cinderella: ARCH_COLOR_BY_ID[5],
} as const;
export const ARCHETYPE_NAMES_BY_ID: Record<number, string> = {
  0: "Oedipus",
  1: "Icarus",
  2: "Man in a Hole",
  3: "Tragedy",
  4: "Rags to Riches",
  5: "Cinderella",
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
