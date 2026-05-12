// All 20 scenes for the keynote. Each scene is a React component that
// renders inside a <Sequence> in Keynote.tsx. Frame counts are
// scene-local (0 at scene start) because each scene lives inside its own
// Sequence wrapper.
//
// Visual rules — all enforced by importing from theme.ts and using
// SiteArc for any film arc:
//   • Fraunces / Source Serif 4 / Inter / JetBrains Mono via theme.ts
//   • Palette tokens from styles.css :root
//   • Arc rendering exactly mirrors main.js (Catmull-Rom 0.6, ±2.5, draw)
//   • No la-linea preview before beat 09 — that's the reveal moment
//   • Rocky beat = placeholder slate (real footage coming later)

import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { scaleLinear } from "d3-scale";
import { line as d3Line, curveCatmullRom } from "d3-shape";
import { Frame } from "../components/Frame";
import { Fade, Eyebrow, Title, Body, Accent } from "../components/Text";
import { NumberTicker } from "../components/NumberTicker";
import { SiteArc } from "../components/SiteArc";
import { theme, fonts, archetypeColors, ARCH_COLOR_BY_ID } from "../theme";
import {
  INTERSTELLAR,
  GROUNDHOG_DAY,
  KNIVES_OUT,
  GLASS_ONION,
  GLADIATOR,
  ROCKY_BALBOA,
  GALLERY_60,
  ARCHETYPES,
  type ArcPoint,
} from "../arc-data";

// ── 01 · Rocky montage ─────────────────────────────────────────────
// Paper background + ROCKY eyebrow, matching the Vonnegut beat. The
// montage video sits centered, sized a touch larger than the centered
// Vonnegut clip (which is 920×580) so Rocky reads as the dominant
// visual without filling the whole frame. Both the video and the eyebrow
// fade out internally over the last ~1.2s so the handoff into beat 02
// is a single soft dissolve rather than a hard cut layered on top of
// the SceneFade's 12-frame crossfade.
export const RockyPlaceholder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ROCKY_W = 1040;
  const ROCKY_H = 640;
  const ROCKY_X = (1920 - ROCKY_W) / 2;
  const ROCKY_Y = (1080 - ROCKY_H) / 2 - 30;
  // Beat is 20s. Start fading 18.4s in (1.6s before the cut), land at
  // 19.6s so the SceneFade's last 0.4s sees nothing but paper.
  const outOp = interpolate(
    frame,
    [Math.round(18.4 * fps), Math.round(19.6 * fps)],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <Frame>
      <AbsoluteFill style={{ padding: "70px 80px", pointerEvents: "none", opacity: outOp }}>
        <Eyebrow inFrame={0}>ROCKY</Eyebrow>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: ROCKY_X,
          top: ROCKY_Y,
          width: ROCKY_W,
          height: ROCKY_H,
          border: `1px solid ${theme.rule}`,
          overflow: "hidden",
          background: theme.ink,
          opacity: outOp,
        }}
      >
        <OffthreadVideo
          src={staticFile("rocky.mp4")}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </Frame>
  );
};

// ── 02 · "That feeling has a shape." ───────────────────────────────
// User pauses on this beat. 8s, deliberately slow:
//   0.0 – 0.6s   hold paper while the SceneFade fade-in lands
//   0.6 – 3.4s   arc draws across the upper-middle of the frame
//   3.7s         "That feeling has a shape." fades up underneath
//   3.7 – 8.0s   hold on both — ~4.5 seconds of breathing room for the
//                spoken pause to land
export const FeelingShape: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Arc draw is delayed past the 12-frame SceneFade fade-in (0.4s), so
  // the line doesn't start under a transparent veil — it lands on a fully
  // settled paper background.
  const ARC_FROM = Math.round(0.6 * fps);
  const ARC_TO = Math.round(3.4 * fps);
  // Beat is 8s. Fade the whole composition out gradually 6.5–7.6s so
  // the handoff into beat 03 (where the Vonnegut video starts playing)
  // feels seamless — matching the same back-half fade we use between
  // beats 04 and 05.
  const fadeOut = interpolate(
    frame,
    [Math.round(6.5 * fps), Math.round(7.6 * fps)],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <Frame>
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          opacity: fadeOut,
        }}
      >
        <SiteArc
          points={INTERSTELLAR}
          width={1520}
          height={320}
          drawFromFrame={ARC_FROM}
          drawToFrame={ARC_TO}
          strokeWidth={3.5}
        />
        <Title
          inFrame={Math.round(3.7 * fps)}
          size={88}
          align="center"
          scale="hero"
        >
          That feeling has a&nbsp;
          <span style={{ color: theme.amberSoft }}>shape.</span>
        </Title>
      </AbsoluteFill>
    </Frame>
  );
};

// ── 03 · Vonnegut idea ─────────────────────────────────────────────
// Per the user's feedback:
//   • Everything on ONE page (no two-phase split).
//   • Video starts CENTERED + LARGE, playing.
//   • Year label on at all times.
//   • Around 4-5s, the video shrinks and slides to the upper-right corner,
//     where it keeps looping while the arcs draw underneath.
//   • Three arcs draw on a plane: Cinderella, Hamlet, Rocky.
//   • Shapes are HAND-DRAWN-FEELING / abstract — not real film data,
//     because Vonnegut's whole point was that they're chalkboard
//     gestures. Take the chalkboard image as reference.
//   • Labels don't overlap each other or get blocked by the arcs.
//   • BEGINNING label sits BELOW the y=0 baseline so the y-axis line
//     doesn't crash through it.
import { FaceIcon } from "../components/FaceIcon";

// Simple chalkboard-feeling shape data — just a handful of control
// points each, smoothed by Catmull-Rom. Z-scores chosen by hand to
// feel like Vonnegut's drawings, not film-by-film sentiment.
const CINDERELLA_GESTURE = [
  { position: 0.05, z_score: -0.2 },
  { position: 0.22, z_score: 0.4 },
  { position: 0.42, z_score: 1.4 }, // first rise
  { position: 0.58, z_score: 0.5 }, // dip
  { position: 0.72, z_score: 0.9 },
  { position: 0.9, z_score: 1.9 }, // higher rise
  { position: 1.0, z_score: 2.0 },
];
// Hamlet has a small early hopeful rise (ghost reveal / plans of revenge),
// then plunges with one tiny shoulder before bottoming out. NOT a
// straight diagonal — has shape.
const HAMLET_GESTURE = [
  { position: 0.05, z_score: 0.7 },
  { position: 0.16, z_score: 1.2 }, // early shoulder up
  { position: 0.3, z_score: 0.5 },
  { position: 0.46, z_score: -0.3 },
  { position: 0.6, z_score: -0.8 },
  { position: 0.7, z_score: -0.6 }, // micro-pause (false hope)
  { position: 0.82, z_score: -1.5 },
  { position: 0.94, z_score: -2.1 },
  { position: 1.0, z_score: -2.2 },
];
const ROCKY_GESTURE = [
  { position: 0.05, z_score: 0.3 },
  { position: 0.22, z_score: -0.4 },
  { position: 0.42, z_score: -1.6 }, // hits bottom
  { position: 0.6, z_score: -1.4 },
  { position: 0.78, z_score: 0.0 },
  { position: 0.92, z_score: 0.9 },
  { position: 1.0, z_score: 1.0 }, // lands on his feet
];

export const VonnegutThreeArcs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;

  // 22s timeline (longer hold on the centered video per user feedback):
  //   0.0 – 6.5s   Video centered + large, year eyebrow above
  //   6.5 – 7.5s   Video animates: scales down + moves to upper-right
  //   7.5 – 9.0s   Axes assemble (y-axis, baseline, face icons, BEG/END)
  //   9.0 – 12.0s  Cinderella gesture draws (with label)
  //  12.0 – 15.0s  Hamlet gesture draws (with label)
  //  15.0 – 18.0s  Rocky gesture draws (with label)
  //  18.0 – 22.0s  Hold all three visible.
  // Vonnegut video keeps looping in its corner thumbnail the whole time.

  // ── Stage geometry — narrow + tall for dramatic curves. Chart is
  // pulled LEFT of the video corner (RIGHT_X=1440 < video left=1460),
  // so it can extend up past where the video would otherwise crowd it.
  const STAGE_LEFT = 320; // shifted left ~60px to balance the corner video
  const STAGE_RIGHT = 1380;
  const STAGE_TOP = 200;
  const STAGE_BOTTOM = 920;
  const STAGE_W = STAGE_RIGHT - STAGE_LEFT; // 1060
  const STAGE_H = STAGE_BOTTOM - STAGE_TOP; // 760
  const Y_MID = (STAGE_TOP + STAGE_BOTTOM) / 2;

  // Video position: centered-large at t=0, then animates to a corner
  // thumbnail at t=4.5-5.5s, where it stays.
  const VIDEO_CENTER_W = 920;
  const VIDEO_CENTER_H = 580;
  const VIDEO_CENTER_X = (1920 - VIDEO_CENTER_W) / 2;
  const VIDEO_CENTER_Y = (1080 - VIDEO_CENTER_H) / 2 - 30;
  const VIDEO_CORNER_W = 380;
  const VIDEO_CORNER_H = 240;
  const VIDEO_CORNER_X = 1920 - VIDEO_CORNER_W - 80;
  const VIDEO_CORNER_Y = 80;

  const videoW = interpolate(s, [6.5, 7.5], [VIDEO_CENTER_W, VIDEO_CORNER_W], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const videoH = interpolate(s, [6.5, 7.5], [VIDEO_CENTER_H, VIDEO_CORNER_H], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const videoX = interpolate(s, [6.5, 7.5], [VIDEO_CENTER_X, VIDEO_CORNER_X], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const videoY = interpolate(s, [6.5, 7.5], [VIDEO_CENTER_Y, VIDEO_CORNER_Y], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Axes appear after the video docks.
  const yAxisLen = interpolate(s, [7.5, 9.0], [0, STAGE_H], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const xAxisLen = interpolate(s, [7.8, 9.0], [0, STAGE_W], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const faceOp = interpolate(s, [8.3, 9.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Smile + frown stroke-draw progress — same hand-drawn reveal as the
  // Process beat's face icons. Smile draws as the y-axis hits its top,
  // frown draws as the y-axis reaches the bottom.
  const smileDrawT = interpolate(s, [7.8, 9.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const frownDrawT = interpolate(s, [8.4, 9.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beLabelOp = interpolate(s, [8.6, 9.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Arc schedule — gestural shapes, drawing slowly (3s each).
  // Label positions are anchored to a CORNER of the visible frame
  // (not the chart's right edge) so multi-word labels can't run off.
  // Trailing periods on the subs were removed per user feedback.
  const arcs = [
    {
      label: "Cinderella",
      sub: "rises, dips, rises higher",
      points: CINDERELLA_GESTURE,
      color: archetypeColors.cinderella,
      from: 9.0,
      drawDur: 3.0,
      // Sit just ABOVE the ascending span between the dip and peak 2.
      // Drop the label closer to the curve — top at 265 puts the
      // label bottom at ~320, ~30px above the rising curve at x≈1190
      // (y≈350). Tight and clearly anchored to the rising motion.
      labelStyle: { left: 1000, top: 285, textAlign: "left" as const, alignItems: "flex-start" as const },
    },
    {
      label: "Hamlet",
      sub: "falls, deeper, never recovers",
      points: HAMLET_GESTURE,
      color: archetypeColors.tragedy,
      from: 12.0,
      drawDur: 3.0,
      // Hamlet ends low-right at (~1380, 819). Park the label just
      // below that endpoint, anchored to the curve's lowest point —
      // same "hug the defining feature" treatment as Rocky's label.
      // Top at 860 leaves a clear ~40px gap to the descending tail
      // (Catmull-Rom can overshoot slightly past the data endpoint).
      labelStyle: { left: 1220, top: 860, textAlign: "left" as const, alignItems: "flex-start" as const },
    },
    {
      label: "Rocky",
      sub: "falls, climbs, lands on his feet",
      points: ROCKY_GESTURE,
      color: archetypeColors["man-in-a-hole"],
      from: 15.0,
      drawDur: 3.0,
      // Rocky bottoms out at (~850, 776). Park the label JUST below
      // the trough — close enough to read as Rocky's, far enough not
      // to crash through the curve. Space below the Rocky trough is
      // clear (Rocky is the lowest of the three arcs).
      labelStyle: { left: 760, top: 790, textAlign: "left" as const, alignItems: "flex-start" as const },
    },
  ];

  return (
    <Frame>
      {/* Year eyebrow — visible throughout */}
      <AbsoluteFill style={{ padding: "70px 80px", pointerEvents: "none" }}>
        <Eyebrow inFrame={0}>Kurt Vonnegut · 1986 lecture</Eyebrow>
      </AbsoluteFill>

      {/* Vonnegut video — animates from centered+large to upper-right
          corner. Plays once (7.7s source), then holds on its last frame
          for the rest of the beat. Uses a 4×-concatenated source
          (vonnegut_loop.mp4, ~30s) so it keeps playing through the
          full 22s beat without ever needing to loop — sidesteps the
          hitch the old `<Loop>` wrapper caused at every restart.
          A poster image (first frame of the clip) sits behind the
          OffthreadVideo so during the 1–2 frames before the video
          element paints, we see the first frame already, not an empty
          box or a black rectangle. */}
      <div
        style={{
          position: "absolute",
          left: videoX,
          top: videoY,
          width: videoW,
          height: videoH,
          border: `1px solid ${theme.rule}`,
          overflow: "hidden",
          backgroundImage: `url(${staticFile("vonnegut_poster.jpg")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <OffthreadVideo
          src={staticFile("vonnegut_loop.mp4")}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Y-axis face icons (smile top, frown bottom). Faces DRAW
          themselves in via stroke-dasharray (same hand-drawn reveal as
          the Process beat); labels fade in once the strokes land. */}
      <div
        style={{
          position: "absolute",
          left: STAGE_LEFT - 110,
          top: STAGE_TOP - 32,
        }}
      >
        <FaceIcon
          kind="smile"
          size={76}
          strokeWidth={3.4}
          stroke={theme.ink}
          drawT={smileDrawT}
        />
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.mono,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            textAlign: "center",
            width: 76,
            color: theme.ink,
            opacity: faceOp,
          }}
        >
          good
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: STAGE_LEFT - 110,
          top: STAGE_BOTTOM - 32,
        }}
      >
        <FaceIcon
          kind="frown"
          size={76}
          strokeWidth={3.4}
          stroke={theme.ink}
          drawT={frownDrawT}
        />
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.mono,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            textAlign: "center",
            width: 76,
            color: theme.ink,
            opacity: faceOp,
          }}
        >
          ill
        </div>
      </div>

      {/* SVG plane: axes + arcs */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Y-axis (vertical) — heavier weight + ink color so it reads as
            a deliberate axis rather than a faint guide line. */}
        <line
          x1={STAGE_LEFT}
          x2={STAGE_LEFT}
          y1={STAGE_TOP}
          y2={STAGE_TOP + yAxisLen}
          stroke={theme.ink}
          strokeWidth={2.5}
        />
        {/* X-axis (horizontal, solid — visible like the y-axis). Sits
            on the y=0 baseline. */}
        <line
          x1={STAGE_LEFT}
          x2={STAGE_LEFT + xAxisLen}
          y1={Y_MID}
          y2={Y_MID}
          stroke={theme.ink}
          strokeWidth={2.5}
        />
        {/* BEGINNING / END labels — positioned BELOW the y=0 line so the
            y-axis doesn't cut through "BEGINNING". */}
        <text
          x={STAGE_LEFT + 6}
          y={Y_MID + 30}
          textAnchor="start"
          fontFamily={fonts.mono}
          fontSize={16}
          fontWeight={600}
          letterSpacing="0.22em"
          fill={theme.inkDim}
          style={{ textTransform: "uppercase" }}
          opacity={beLabelOp}
        >
          beginning
        </text>
        <text
          x={STAGE_RIGHT}
          y={Y_MID + 30}
          textAnchor="end"
          fontFamily={fonts.mono}
          fontSize={16}
          fontWeight={600}
          letterSpacing="0.22em"
          fill={theme.inkDim}
          style={{ textTransform: "uppercase" }}
          opacity={beLabelOp}
        >
          end
        </text>

        {/* Three gestural arcs */}
        {arcs.map((a) => {
          const drawFromFrame = Math.round(a.from * fps);
          const drawToFrame = Math.round((a.from + a.drawDur) * fps);
          return (
            <g key={a.label} transform={`translate(${STAGE_LEFT}, ${STAGE_TOP})`}>
              <SiteArc
                points={a.points}
                width={STAGE_W}
                height={STAGE_H}
                drawFromFrame={drawFromFrame}
                drawToFrame={drawToFrame}
                stroke={a.color}
                strokeWidth={3}
                pad={{ top: 24, right: 24, bottom: 24, left: 24 }}
              />
            </g>
          );
        })}
      </svg>

      {/* Arc labels — positioned where each arc lands / pauses so they
          don't overlap each other or get crossed by other arcs. */}
      {arcs.map((a) => {
        const labelStart = Math.round((a.from + 1.0) * fps);
        return (
          <Fade key={`${a.label}-label`} inFrame={labelStart} duration={20}>
            <div
              style={{
                position: "absolute",
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                ...a.labelStyle,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: 32,
                  color: a.color,
                  fontVariationSettings: '"wght" 400, "opsz" 48, "SOFT" 20',
                  lineHeight: 1,
                }}
              >
                {a.label}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: fonts.body,
                  fontSize: 15,
                  color: theme.inkDim,
                  whiteSpace: "nowrap",
                }}
              >
                {a.sub}
              </div>
            </div>
          </Fade>
        );
      })}
    </Frame>
  );
};

// ── 04 · "feed shapes into a computer, someday." ──────────────────
// 5s beat tuned to the VO recording. Scattered ink dots fly in from
// random off-grid positions and snap into a digital grid — morphing
// from circles (analog) into squares (digital) as they land. "Someday"
// resolves in italic amber as the speaker reaches the word at ~4.0s.
//
//   0.0 – 2.4s   dots fade in scattered, migrate into the grid, settle
//   3.0s         "Someday" begins fading in
//   4.4 – 5.0s   everything fades out for the cut into beat 05
export const FeedToComputer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Grid geometry — 40 cols × 12 rows of 22px cells.
  const COLS = 40;
  const ROWS = 12;
  const CELL = 22;
  const GAP = 4;
  const gridW = COLS * (CELL + GAP) - GAP;
  const gridH = ROWS * (CELL + GAP) - GAP;
  const gridLeft = (1920 - gridW) / 2;
  // Center the {grid + 60px gap + "Someday." title} group vertically.
  // Title hero @ 140px ≈ 143 tall; total group ≈ gridH + 60 + 143.
  const TITLE_H_EST = 145;
  const GROUP_GAP = 60;
  const groupH = gridH + GROUP_GAP + TITLE_H_EST;
  const gridTop = Math.round((1080 - groupH) / 2);
  const titleTop = gridTop + gridH + GROUP_GAP;

  // Easing for the migration — soft landing on the grid slot.
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  return (
    <Frame>
      {/* Eyebrow — fades out alongside the rest of the beat. */}
      <AbsoluteFill
        style={{
          padding: "70px 80px",
          pointerEvents: "none",
          opacity: interpolate(
            frame,
            [Math.round(4.4 * fps), Math.round(5.0 * fps)],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
        }}
      >
        <Eyebrow inFrame={0}>vonnegut's wager</Eyebrow>
      </AbsoluteFill>

      {/* Ink dots — start scattered, migrate into the grid, morph
          circle → square. The whole layer fades out in the back half
          of the beat so the transition into beat 05 is seamless. */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity: interpolate(
            frame,
            [Math.round(4.4 * fps), Math.round(5.0 * fps)],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
        }}
      >
        {Array.from({ length: COLS * ROWS }).map((_, idx) => {
          const row = Math.floor(idx / COLS);
          const col = idx % COLS;
          // 2D xorshift hash for per-cell randomness.
          let h = (row * 73856093) ^ (col * 19349663);
          h = ((h ^ (h >> 13)) * 0x5bd1e995) >>> 0;
          h = (h ^ (h >> 15)) >>> 0;

          // Target position (final grid slot)
          const targetX = gridLeft + col * (CELL + GAP);
          const targetY = gridTop + row * (CELL + GAP);

          // Scattered starting position — anywhere across the frame,
          // biased toward off-grid to give the migration something to do.
          const startX = ((h & 0xffff) / 0xffff) * 1920;
          const startY = (((h >> 16) & 0xffff) / 0xffff) * 1080;

          // Per-cell stagger so the swarm doesn't all move in unison.
          const staggerSec = ((h ^ (h >> 8)) % 1000) / 1000 * 1.2;
          const appearStart = staggerSec; // fade-in begins
          const migrateStart = staggerSec + 0.4; // migration begins
          const migrateEnd = migrateStart + 1.0; // 1s migration

          // Fade-in opacity
          const opIn = clamp01(
            (frame - Math.round(appearStart * fps)) / 10
          );

          // Migration progress 0→1
          const tMigrate = clamp01(
            (frame - Math.round(migrateStart * fps)) /
              Math.max(1, Math.round((migrateEnd - migrateStart) * fps))
          );
          const eased = easeOutCubic(tMigrate);
          const x = startX + (targetX - startX) * eased;
          const y = startY + (targetY - startY) * eased;

          // Border radius: 50% (circle) at start, 0 (square) at end.
          const radius = (1 - eased) * (CELL / 2);

          // Color: ~18% amber, rest ink, deterministic per cell.
          const isAmber = ((h >> 7) & 0xff) < 46;

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: CELL,
                height: CELL,
                background: isAmber ? theme.amber : theme.ink,
                borderRadius: radius,
                opacity: opIn * 0.92,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* "Someday." — flex-centered horizontally; sits at a fixed y
          beneath the grid so grid + title read as one centered group.
          Fades OUT in the back half of the beat so the transition into
          beat 05 feels seamless (the global SceneFade only spans the
          last 0.4s, which is too tight for this composition). */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: titleTop,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          opacity: interpolate(frame, [Math.round(5.6 * fps), Math.round(6.8 * fps)], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Title
          inFrame={Math.round(3.0 * fps)}
          size={140}
          align="center"
          scale="hero"
        >
          someday
        </Title>
      </div>
    </Frame>
  );
};

// ── 05 · books → Hollywood? ───────────────────────────────────────
// Editorial split:
//   LEFT  ▸ "1,400 books, six shapes." (Reagan et al.) with six
//         representative shape SKETCHES — each clearly distinct, with
//         a hand-set lowercase label (rise · fall · rise → fall etc.).
//         No color, just ink, but with real amplitude so they read as
//         shapes, not flat lines.
//   RIGHT ▸ "But what about HOLLYWOOD?" — typeset like a sign-on-a-hill:
//         huge cap-and-spaced HOLLYWOOD letters that draw in across
//         strokes (think the sign letters being installed), then a
//         dramatic amber question mark drops below.
export const BooksToSix: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // LEFT half — scattered dots that migrate into 6 distinct clusters.
  // Same DNA as the feed-to-computer particle swarm but the targets here
  // resolve to 6 cluster centroids (2 cols × 3 rows) so the audience
  // literally watches "many things sort themselves into six groups."
  const LEFT_W = 0.52 * 1920; // 998
  const CLUSTER_COLS = 2;
  const CLUSTER_ROWS = 3;
  const areaLeft = 110;
  const areaRight = LEFT_W - 110;
  const areaTop = 360;
  const areaBottom = 980;
  const colW = (areaRight - areaLeft) / CLUSTER_COLS;
  const rowH = (areaBottom - areaTop) / CLUSTER_ROWS;
  const clusters: { cx: number; cy: number }[] = [];
  for (let r = 0; r < CLUSTER_ROWS; r++) {
    for (let c = 0; c < CLUSTER_COLS; c++) {
      clusters.push({
        cx: areaLeft + colW * (c + 0.5),
        cy: areaTop + rowH * (r + 0.5),
      });
    }
  }
  const DOTS_PER_CLUSTER = 70;
  const TOTAL_DOTS = 6 * DOTS_PER_CLUSTER;

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  return (
    <Frame>
      {/* LEFT half — Reagan eyebrow + counter, pushed further down so the
          composition isn't crowded against the top. */}
      <AbsoluteFill style={{ padding: "100px 80px", width: "52%" }}>
        <Eyebrow inFrame={0}>2016 · Reagan et al.</Eyebrow>
        {/* 1,400 books sits between the eyebrow and the cluster area —
            close enough to anchor the swarm visually, far enough to
            breathe. (Eyebrow ~y=100, title ~y=200, clusters start y=360.) */}
        <div style={{ marginTop: 90, display: "flex", alignItems: "baseline", gap: 12 }}>
          <NumberTicker
            from={0}
            to={1327}
            fromFrame={6}
            toFrame={70}
            size={88}
            color={theme.amber}
          />
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 56,
              fontVariationSettings: '"wght" 400, "opsz" 120, "SOFT" 30',
              color: theme.ink,
              lineHeight: 1,
            }}
          >
            books
          </div>
        </div>
      </AbsoluteFill>

      {/* Swarm of dots — scattered start, migrate into 6 clusters. */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {Array.from({ length: TOTAL_DOTS }).map((_, idx) => {
          const clusterId = Math.floor(idx / DOTS_PER_CLUSTER);
          const center = clusters[clusterId];
          // xorshift hash per dot for stable per-dot randomness.
          let h = (idx * 73856093) ^ ((clusterId + 1) * 19349663);
          h = ((h ^ (h >> 13)) * 0x5bd1e995) >>> 0;
          h = (h ^ (h >> 15)) >>> 0;

          // Scatter start anywhere over the left half.
          const startX = ((h & 0xffff) / 0xffff) * LEFT_W;
          const startY = (((h >> 16) & 0xffff) / 0xffff) * 1080;

          // Target offset within cluster — polar spread for organic shape.
          const angle = ((h ^ (h >> 5)) % 1000) / 1000 * Math.PI * 2;
          const radius = 18 + (((h >> 10) & 0xff) / 0xff) * 46;
          const targetX = center.cx + Math.cos(angle) * radius;
          const targetY = center.cy + Math.sin(angle) * radius;

          // Stagger so the swarm doesn't all move in unison. Wider stagger
          // + slower migration so the swarm phase reads as the main event
          // and the Hollywood image enters later as the counter-question.
          const staggerSec = ((h ^ (h >> 8)) % 1000) / 1000 * 2.6;
          const appearStart = 1.4 + staggerSec;
          const migrateStart = appearStart + 0.6;
          const migrateEnd = migrateStart + 2.2;

          const opIn = clamp01(
            (frame - Math.round(appearStart * fps)) / 10
          );
          const tMig = clamp01(
            (frame - Math.round(migrateStart * fps)) /
              Math.max(1, Math.round((migrateEnd - migrateStart) * fps))
          );
          const eased = easeOutCubic(tMig);
          const x = startX + (targetX - startX) * eased;
          const y = startY + (targetY - startY) * eased;

          // ~15% amber accents. Chunkier square dots, echoing the
          // pixel-grid look of the feed-to-computer beat.
          const isAmber = ((h >> 7) & 0xff) < 38;
          const dotSize = 12;

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: x - dotSize / 2,
                top: y - dotSize / 2,
                width: dotSize,
                height: dotSize,
                background: isAmber ? theme.amber : theme.ink,
                opacity: opIn,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* Vertical rule between halves — appears when Hollywood enters. */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <Fade inFrame={Math.round(8.0 * fps)} duration={20}>
          <div
            style={{
              position: "absolute",
              left: "52%",
              top: 220,
              bottom: 180,
              width: 1,
              background: theme.ruleSoft,
            }}
          />
        </Fade>
      </AbsoluteFill>

      {/* RIGHT half — Hollywood image enters late, after the swarm has
          fully resolved into six groups. Books animation gets the bulk of
          the beat; Hollywood is the question that arrives once it lands. */}
      <AbsoluteFill
        style={{
          padding: "200px 80px 100px",
          left: "52%",
          width: "48%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <Fade inFrame={Math.round(8.0 * fps)} duration={14}>
          <div
            style={{
              fontFamily: fonts.body,
              fontStyle: "italic",
              fontSize: 30,
              color: theme.inkDim,
              marginBottom: 44,
            }}
          >
            But what about…
          </div>
        </Fade>
        <Fade inFrame={Math.round(8.8 * fps)} duration={26}>
          <img
            src={staticFile("hollywood-sign.jpg")}
            style={{
              width: 660,
              height: 660,
              objectFit: "cover",
              filter: "grayscale(100%) contrast(1.05)",
              border: `1px solid ${theme.rule}`,
            }}
          />
        </Fade>
      </AbsoluteFill>
    </Frame>
  );
};

// ── 06 · Process: Interstellar arc + intro-pin dot-hover behavior ─
//
// Ports the website's #intro-pin scene: a single film's arc draws across
// the screen, turning-point dots pop in, and a couple of dots "highlight"
// to reveal their scene clip + handwritten note alongside (the same
// hover-a-dot-watch-the-scene interaction shown in the screen recording).
//
// Process beat — rebuilt to match the verbal beat structure:
//
//   0.0 – 2.0   "Interstellar (2014)" title over interstellar_1 playing
//               full-frame ("a screenplay — Interstellar, for example…")
//   2.0 – 3.2   Film clip docks to upper-right thumbnail; axes draw
//   3.2 – 4.8   20 vertical chunk dividers fade in left→right
//               ("split into 20 chunks")
//   4.8 – 6.0   "sentiment model" eyebrow swap; per-chunk sentiment dots
//               appear in sequence at their z-score height
//   6.0 – 12.0  Arc draws across (same Catmull-Rom α=0.6 as the website's
//               timeline-for-one). Corner film tile cycles through
//               interstellar_1 → _15 in sync with the playhead — the user
//               sees the movie unfold AS the line is drawn.
//   12.0 – 13.5 Turning points resolve to amber dots
//   13.5 – 19.0 Zoom into one turning point — the chart scales up + pans
//               so the dot is centered; the corresponding scene plays
//               LARGE alongside with its note.
//
// Same arc math as main.js (Catmull-Rom α=0.6, fixed ±2.5 y-domain).

// Two spotlight beats, in arc order:
//   1. dot 2 (a small early peak)  → clip 3 ("Goodbye to Murph"),
//      starts 2s into the 14.67s clip so we cut straight to the
//      emotional moment. Dot is panned upper-RIGHT, panel goes lower-
//      LEFT (the curve to the right of dot 2 crowds the upper-right).
//   2. dot 13 (deepest trough)     → clip 13 ("Cooper into Gargantua").
//      Dot upper-LEFT, panel lower-RIGHT. Same framing as before.
type SpotlightSpec = {
  dotIdx: number;
  clip: string;
  startFromSec: number;
  startSec: number;
  durSec: number;
  target: { x: number; y: number };
  panel: { left: number; top: number; width: number; height: number };
  tether: { x1: number; y1: number; x2: number; y2: number };
};
const SPOTLIGHTS: SpotlightSpec[] = [
  {
    dotIdx: 2,
    clip: "interstellar_3.mp4",
    startFromSec: 2.0,
    startSec: 13.5,
    durSec: 6.0,
    target: { x: 1500, y: 260 },
    panel: { left: 60, top: 540, width: 820, height: 480 },
    tether: { x1: 1480, y1: 280, x2: 880, y2: 540 },
  },
  {
    dotIdx: 13,
    clip: "interstellar_13.mp4",
    startFromSec: 0.0,
    startSec: 20.5,
    durSec: 6.0,
    target: { x: 320, y: 260 },
    panel: { left: 1000, top: 440, width: 820, height: 480 },
    tether: { x1: 340, y1: 280, x2: 1000, y2: 460 },
  },
];

export const ProcessInterstellar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;

  // ── Stage geometry. Y-axis sits left, leaving room for the face icon
  // (smile on top, frown on bottom — same convention as the Vonnegut
  // beat).
  const STAGE_LEFT = 240;
  const STAGE_RIGHT = 1780;
  const STAGE_TOP = 220;
  const STAGE_BOTTOM = 880;

  const x = scaleLinear().domain([0, 1]).range([STAGE_LEFT, STAGE_RIGHT]);
  const y = scaleLinear().domain([-2.5, 2.5]).range([STAGE_BOTTOM, STAGE_TOP]);
  const yZero = y(0);

  // Arc path — same Catmull-Rom α=0.6 + ±2.5 y-domain math as the
  // website's intro-pin timeline-for-one.
  const lineFn = d3Line<ArcPoint>()
    .x((d) => x(d.position))
    .y((d) => y(d.z_score))
    .curve(curveCatmullRom.alpha(0.6));
  const pathD = lineFn(INTERSTELLAR) ?? "";

  // ── Timeline (28s):
  //  0.0 – 2.5    Full-frame intro clip + title
  //  2.5 – 4.0    Axes + face icons DRAW (smile, frown).
  //  4.0 – 6.0    20 chunk dividers fade in left→right
  //  6.0 – 11.0   Arc line draws across (clipPath reveal) + thumbnails
  //               appear in sequence with the playhead.
  //  11.0 – 12.5  Turning-point dots resolve to amber
  //  12.5 – 13.5  Hold on full layout — VO ends here; presenter pauses.
  //  13.5 – 19.5  Spotlight 1: zoom into dot 2, clip 3 plays in lower-
  //               LEFT panel. Thumbnails DIM.
  //  19.5 – 20.5  Brief hold between spotlights
  //  20.5 – 26.5  Spotlight 2: zoom into dot 13 (deepest trough), clip
  //               13 plays in lower-RIGHT panel.
  //  26.5 – 28.0  Wide view restored, brief hold for the wrap.
  const INTRO_END = 2.5;
  const AXES_DRAW_FROM = 2.6;
  const Y_AXIS_DRAW_TO = 3.4;
  const X_AXIS_DRAW_TO = 4.0;
  const CHUNKS_START = 4.0;
  const CHUNKS_END = 6.0;
  const ARC_DRAW_FROM = 6.0;
  const ARC_DRAW_TO = 11.0;
  const DOTS_AMBER_FROM = 11.0;
  const DOTS_AMBER_TO = 12.5;
  // SPOTLIGHTS array (above) drives the two spotlight windows.
  // First spotlight starts at 13.5s, last ends at 26.5s.

  // Intro video / title fades.
  const introOp = interpolate(s, [0, 0.3, INTRO_END - 0.2, INTRO_END + 0.3], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOp = interpolate(s, [0.3, 0.9, INTRO_END - 0.1, INTRO_END + 0.2], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Axes + face icons fade in. The actual lines DRAW separately below
  // (y-axis grows top→bottom, x-axis grows left→right) — like Vonnegut.
  const axesOp = interpolate(s, [AXES_DRAW_FROM, AXES_DRAW_FROM + 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const yAxisLen = interpolate(
    s,
    [AXES_DRAW_FROM, Y_AXIS_DRAW_TO],
    [0, STAGE_BOTTOM - STAGE_TOP],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const xAxisLen = interpolate(
    s,
    [Y_AXIS_DRAW_TO - 0.2, X_AXIS_DRAW_TO],
    [0, STAGE_RIGHT - STAGE_LEFT],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Chunk dividers — 20 boundaries at i/20 for i=1..20.
  const CHUNK_COUNT = 20;
  const chunkBoundaries = Array.from({ length: CHUNK_COUNT + 1 }, (_, i) => i / CHUNK_COUNT);

  // Arc draw progress.
  const drawTRaw = interpolate(s, [ARC_DRAW_FROM, ARC_DRAW_TO], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drawT = drawTRaw < 0.5
    ? 4 * drawTRaw * drawTRaw * drawTRaw
    : 1 - Math.pow(-2 * drawTRaw + 2, 3) / 2;

  // Turning-points amber transition.
  const turnAmberT = interpolate(s, [DOTS_AMBER_FROM, DOTS_AMBER_TO], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Local-extrema indices (peaks/troughs vs neighbors).
  const isExtremum = new Set<number>();
  for (let i = 1; i < INTERSTELLAR.length - 1; i++) {
    const v = INTERSTELLAR[i].z_score;
    const prev = INTERSTELLAR[i - 1].z_score;
    const next = INTERSTELLAR[i + 1].z_score;
    if ((v > prev && v > next) || (v < prev && v < next)) isExtremum.add(i);
  }
  // Dots fade in alongside the arc draw — appear as the line reaches them.
  const dotFadeStart = ARC_DRAW_FROM + 0.5;
  const dotFadeEnd = ARC_DRAW_TO + 0.2;

  // ── Spotlights: zoom into each focused turning point in arc order.
  // Find the currently active spotlight (if any) and compute its
  // localT (0..1 through its own window). Pan is eased in/out
  // (easeInOutCubic) over ~24% of each window so the camera move feels
  // smooth, not flicked.
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const activeSpotlight = SPOTLIGHTS.find(
    (sp) => s >= sp.startSec && s < sp.startSec + sp.durSec
  ) ?? null;
  const ZOOM_SCALE = 2.5;
  let chartScale = 1;
  let chartTx = 0;
  let chartTy = 0;
  let sceneVisOp = 0;
  let spotlightLocalT = 0;
  if (activeSpotlight) {
    spotlightLocalT = (s - activeSpotlight.startSec) / activeSpotlight.durSec;
    const spx = x(INTERSTELLAR[activeSpotlight.dotIdx].position);
    const spy = y(INTERSTELLAR[activeSpotlight.dotIdx].z_score);
    const zoomInRaw = Math.min(1, Math.max(0, spotlightLocalT / 0.24));
    const zoomOutRaw = Math.min(1, Math.max(0, (spotlightLocalT - 0.76) / 0.24));
    const zoomShape =
      easeInOutCubic(zoomInRaw) * (1 - easeInOutCubic(zoomOutRaw));
    chartScale = 1 + (ZOOM_SCALE - 1) * zoomShape;
    chartTx = (activeSpotlight.target.x - spx * ZOOM_SCALE) * zoomShape;
    chartTy = (activeSpotlight.target.y - spy * ZOOM_SCALE) * zoomShape;
    sceneVisOp = interpolate(
      spotlightLocalT,
      [0.18, 0.30, 0.78, 0.88],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }

  // Thumbnail dim — multiply per-spotlight dims so the strip dims
  // smoothly during each spotlight and snaps back to full opacity in
  // the gaps between them. Loaded once and persisted (no re-fade).
  const thumbnailDimOp = SPOTLIGHTS.reduce((acc, sp) => {
    const dim = interpolate(
      s,
      [
        sp.startSec - 0.3,
        sp.startSec + 0.6,
        sp.startSec + sp.durSec - 0.6,
        sp.startSec + sp.durSec + 0.3,
      ],
      [1, 0.18, 0.18, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    return Math.min(acc, dim);
  }, 1);

  // Face icons draw themselves in (stroke-dashoffset, like the axes).
  // Smile draws alongside the y-axis growing toward it; frown draws as
  // the y-axis reaches the bottom and the x-axis starts.
  const smileDrawT = interpolate(s, [AXES_DRAW_FROM, AXES_DRAW_FROM + 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const frownDrawT = interpolate(s, [Y_AXIS_DRAW_TO - 0.2, Y_AXIS_DRAW_TO + 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Mount opacities so the labels and icons appear together.
  const goodLabelOp = interpolate(s, [AXES_DRAW_FROM + 0.45, AXES_DRAW_FROM + 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const illLabelOp = interpolate(s, [Y_AXIS_DRAW_TO + 0.25, Y_AXIS_DRAW_TO + 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beginLabelOp = interpolate(s, [Y_AXIS_DRAW_TO + 0.2, X_AXIS_DRAW_TO], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const endLabelOp = interpolate(s, [Y_AXIS_DRAW_TO + 0.4, X_AXIS_DRAW_TO + 0.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Frame>
      {/* Full-frame intro clip + title — fully UNMOUNTED once their
          fade-out completes, so neither can leak residual pixels into
          the axes/chunks phase. */}
      {s < INTRO_END + 0.35 && (
        <>
          <AbsoluteFill style={{ opacity: introOp }}>
            <OffthreadVideo
              src={staticFile("timeline-scenes/interstellar_1.mp4")}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              padding: "120px 120px",
              pointerEvents: "none",
              opacity: titleOp,
            }}
          >
            <Eyebrow color={theme.bg}>2014 · Christopher Nolan</Eyebrow>
            <div style={{ marginTop: 14 }}>
              <Title size={92} color={theme.bg}>
                Interstellar
              </Title>
            </div>
          </AbsoluteFill>
        </>
      )}

      {/* Y-axis face icons — same convention + thickness as Vonnegut.
          The face strokes DRAW themselves in (via FaceIcon's drawT prop)
          and the label below resolves once the face is mostly drawn. */}
      <div
        style={{
          position: "absolute",
          left: STAGE_LEFT - 110,
          top: STAGE_TOP - 38,
        }}
      >
        <FaceIcon
          kind="smile"
          size={76}
          strokeWidth={3.4}
          stroke={theme.ink}
          drawT={smileDrawT}
        />
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.mono,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            textAlign: "center",
            width: 76,
            color: theme.ink,
            opacity: goodLabelOp,
          }}
        >
          good
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: STAGE_LEFT - 110,
          top: STAGE_BOTTOM - 38,
        }}
      >
        <FaceIcon
          kind="frown"
          size={76}
          strokeWidth={3.4}
          stroke={theme.ink}
          drawT={frownDrawT}
        />
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.mono,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            textAlign: "center",
            width: 76,
            color: theme.ink,
            opacity: illLabelOp,
          }}
        >
          ill
        </div>
      </div>

      {/* Chart plane — axes + chunks + arc + dots. During the spotlight
          the whole SVG scales+pans so the focused dot lands at frame
          center. Everything inside the chart is wrapped in a clipPath so
          stray sub-pixel artifacts can't escape the plot bounds. */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${chartTx}px, ${chartTy}px) scale(${chartScale})`,
          transformOrigin: "0 0",
          opacity: axesOp,
        }}
      >
        <defs>
          <clipPath id="proc-chart-clip">
            <rect
              x={STAGE_LEFT - 4}
              y={STAGE_TOP - 24}
              width={STAGE_RIGHT - STAGE_LEFT + 8}
              height={STAGE_BOTTOM - STAGE_TOP + 64}
            />
          </clipPath>
          {/* Reveal clip for the arc — width animates from 0 to the full
              chart width so the line literally grows left→right. This
              replaces the old stroke-dashoffset approach, which leaked
              both endpoints of the path on initial render (the dash-array
              pattern wrapped around and exposed the tail of the curve as
              a stray "/" at upper-right). A growing rect can't do that. */}
          <clipPath id="proc-arc-reveal">
            <rect
              x={STAGE_LEFT - 4}
              y={STAGE_TOP - 24}
              width={Math.max(0, drawT * (STAGE_RIGHT - STAGE_LEFT) + 8)}
              height={STAGE_BOTTOM - STAGE_TOP + 64}
            />
          </clipPath>
        </defs>
        {/* Y-axis — grows top→bottom. */}
        <line
          x1={STAGE_LEFT}
          y1={STAGE_TOP}
          x2={STAGE_LEFT}
          y2={STAGE_TOP + yAxisLen}
          stroke={theme.ink}
          strokeWidth={2.5}
        />
        {/* X-axis at y=0 — grows left→right. */}
        <line
          x1={STAGE_LEFT}
          y1={yZero}
          x2={STAGE_LEFT + xAxisLen}
          y2={yZero}
          stroke={theme.ink}
          strokeWidth={2.5}
        />

        {/* 20 chunk dividers — only mount when their fade-in slot has
            started; keeps them out of the DOM during phases when they'd
            otherwise be `opacity: 0` (which on some SVG renderers can
            still bleed sub-pixel ink). */}
        <g clipPath="url(#proc-chart-clip)">
          {chunkBoundaries.map((p, i) => {
            if (i === 0) return null; // covered by y-axis
            const t = i / CHUNK_COUNT;
            const op = interpolate(
              s,
              [
                CHUNKS_START + t * (CHUNKS_END - CHUNKS_START) * 0.85,
                CHUNKS_START + t * (CHUNKS_END - CHUNKS_START) * 0.85 + 0.4,
              ],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            if (op <= 0.001) return null;
            return (
              <line
                key={i}
                x1={x(p)}
                y1={STAGE_TOP}
                x2={x(p)}
                y2={STAGE_BOTTOM}
                stroke={theme.inkDim}
                strokeWidth={1.2}
                strokeDasharray="4 6"
                opacity={op * 0.55}
              />
            );
          })}
        </g>

        {/* BEGINNING / END labels rendered with explicit per-label
            opacity so they reveal sequentially (Vonnegut convention). */}
        <text
          x={STAGE_LEFT + 8}
          y={yZero + 32}
          textAnchor="start"
          fontFamily={fonts.mono}
          fontSize={16}
          fontWeight={600}
          letterSpacing="0.22em"
          fill={theme.inkDim}
          style={{ textTransform: "uppercase" }}
          opacity={beginLabelOp}
        >
          beginning
        </text>
        <text
          x={STAGE_RIGHT}
          y={yZero + 32}
          textAnchor="end"
          fontFamily={fonts.mono}
          fontSize={16}
          fontWeight={600}
          letterSpacing="0.22em"
          fill={theme.inkDim}
          style={{ textTransform: "uppercase" }}
          opacity={endLabelOp}
        >
          end
        </text>

        {/* Arc path — revealed left→right by a growing rect clipPath.
            Mounting is gated on drawT > 0 so nothing draws during the
            chunks phase. */}
        {s >= ARC_DRAW_FROM && drawT > 0 && (
          <g clipPath="url(#proc-arc-reveal)">
            <path
              d={pathD}
              fill="none"
              stroke={theme.ink}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Per-chunk dots — fade in as the arc reaches them. Only mount
            when actually visible (otherwise SVG can render sub-pixel
            ink even at opacity 0 on some compositors). */}
        {INTERSTELLAR.map((p, i) => {
          const t = i / Math.max(1, INTERSTELLAR.length - 1);
          const reachTime = dotFadeStart + t * (dotFadeEnd - dotFadeStart);
          const op = interpolate(s, [reachTime, reachTime + 0.25], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          if (op <= 0.001) return null;
          const isExt = isExtremum.has(i);
          const colorMix = isExt ? turnAmberT : 0;
          const r = isExt ? 5 + colorMix * 2 : 3;
          const fill = colorMix > 0.5 ? theme.amber : theme.ink;
          return (
            <circle
              key={`dot-${i}`}
              cx={x(p.position)}
              cy={y(p.z_score)}
              r={r}
              fill={fill}
              opacity={op * (isExt ? 1 : Math.max(0.35, 1 - colorMix * 0.7))}
            />
          );
        })}
      </svg>

      {/* Filmstrip — 15 scene thumbnails, evenly distributed across the
          full x-axis width so the whole timeline is legible. Each one
          fades in IN SEQUENCE as the arc draw reaches its data point's
          position; once visible, it stays mounted for the rest of the
          beat (no re-load after the spotlight zoom — they dim instead).
          A faint amber connector line ties each thumbnail to its dot. */}
      {(() => {
        const THUMB_W = 96;
        const THUMB_H = 54;
        const THUMB_Y = 96;
        const stripLeft = STAGE_LEFT;
        const stripRight = STAGE_RIGHT;
        const stripSpan = stripRight - stripLeft;
        // For each thumbnail compute its own opacity: 0 until the arc
        // draw reaches its corresponding data point, then ramp to 1 over
        // ~0.45s, then multiply by `thumbnailDimOp` for the spotlight dim.
        const perThumb = INTERSTELLAR.slice(0, 15).map((p, i) => {
          const reach = ARC_DRAW_FROM + p.position * (ARC_DRAW_TO - ARC_DRAW_FROM);
          const opIn = interpolate(s, [reach - 0.05, reach + 0.4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          if (opIn <= 0.001) return null;
          const finalOp = opIn * thumbnailDimOp;
          const xThumbCenter = stripLeft + (i / 14) * stripSpan;
          // Per-thumbnail "selection" intensity. Ramps to 1 in the 0.5s
          // BEFORE the spotlight starts (so the frame appears, then we
          // zoom), holds through the spotlight, then ramps back out.
          const sp = SPOTLIGHTS.find((sp) => sp.dotIdx === i);
          const focusT = sp
            ? interpolate(
                s,
                [
                  sp.startSec - 0.5,
                  sp.startSec - 0.05,
                  sp.startSec + sp.durSec - 0.3,
                  sp.startSec + sp.durSec + 0.5,
                ],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )
            : 0;
          return { i, finalOp, xThumbCenter, focusT };
        }).filter((v): v is NonNullable<typeof v> => v !== null);
        return (
          <>
            {perThumb.map(({ i, finalOp, xThumbCenter, focusT }) => (
              <div
                key={`thumb-${i}`}
                style={{
                  position: "absolute",
                  left: xThumbCenter - THUMB_W / 2,
                  top: THUMB_Y,
                  width: THUMB_W,
                  height: THUMB_H,
                  overflow: "hidden",
                  border: focusT > 0.01
                    ? `1px solid ${theme.amber}`
                    : `1px solid ${theme.rule}`,
                  outline:
                    focusT > 0.01
                      ? `${2 * focusT}px solid ${theme.amber}`
                      : "none",
                  outlineOffset: 1,
                  boxShadow:
                    focusT > 0.01
                      ? `0 0 ${18 * focusT}px ${theme.amber}${Math.round(
                          0x66 * focusT
                        )
                          .toString(16)
                          .padStart(2, "0")}`
                      : "none",
                  background: theme.ink,
                  opacity: finalOp,
                  pointerEvents: "none",
                }}
              >
                <img
                  src={staticFile(`timeline-thumbs/interstellar_${i + 1}.jpg`)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </>
        );
      })()}

      {/* Spotlight scenes — one Sequence per SPOTLIGHT spec. Each scene
          plays in its own panel with a diagonal tether back to the
          focused dot. Only the active spotlight's panel is faded in via
          `sceneVisOp` (precomputed at the top of the component) — the
          others are mounted but at opacity 0. OffthreadVideo `startFrom`
          lets us skip into the clip (used for clip 3, which begins at
          the 2s mark). */}
      {SPOTLIGHTS.map((sp) => {
        const isActive = activeSpotlight === sp;
        return (
          <Sequence
            key={`spot-${sp.dotIdx}`}
            from={Math.round(sp.startSec * fps)}
            durationInFrames={Math.round(sp.durSec * fps)}
          >
            <AbsoluteFill
              style={{
                pointerEvents: "none",
                opacity: isActive ? sceneVisOp : 0,
              }}
            >
              <svg
                width={1920}
                height={1080}
                viewBox="0 0 1920 1080"
                style={{ position: "absolute", inset: 0 }}
              >
                <line
                  x1={sp.tether.x1}
                  y1={sp.tether.y1}
                  x2={sp.tether.x2}
                  y2={sp.tether.y2}
                  stroke={theme.amber}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.85}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  left: sp.panel.left,
                  top: sp.panel.top,
                  width: sp.panel.width,
                  height: sp.panel.height,
                  overflow: "hidden",
                  border: `1px solid ${theme.rule}`,
                  background: theme.ink,
                }}
              >
                <OffthreadVideo
                  src={staticFile(`timeline-scenes/${sp.clip}`)}
                  startFrom={Math.round(sp.startFromSec * fps)}
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </Frame>
  );
};

// ── 07 · "1,627, to be exact." ────────────────────────────────────
// Per the script: just the counter, no film. Number ticks up to 1,627
// and "screenplays." resolves underneath. 7s beat.
export const ShuffleCounter: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <Frame>
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <Eyebrow inFrame={0}>and the rest</Eyebrow>
        <div style={{ marginTop: 12 }}>
          <NumberTicker
            from={1}
            to={1627}
            fromFrame={Math.round(0.4 * fps)}
            toFrame={Math.round(4.5 * fps)}
            size={260}
          />
        </div>
        <Title inFrame={Math.round(3.6 * fps)} size={52} align="center">
          screenplays
        </Title>
      </AbsoluteFill>
    </Frame>
  );
};

// ── 08 · Corpus reveal ─────────────────────────────────────────────
// One continuous beat — the only "moment" is the color reveal. Timed to
// the VO recording so the reveal lands on the word "six".
//
//   0.0 – 15.0s  60 real films draw one-by-one into their own cell on a
//                12×5 grid. Each tile fades in just before its arc draws,
//                so the grid "fills in" as the arcs land. All ink.
//  15.0 – 17.0s  hold the full ink grid — the question hanging in the
//                air. Speaker is saying "...what shapes keep showing up."
//  17.0 – 19.5s  reveal: each arc's ink stroke transitions to its
//                archetype color, staggered by archetype. Lands on the
//                word "six" in "It came back with six."
//  19.5 – 20.0s  brief hold before the cut to beat 10.

// 12×5 grid covering the frame with comfortable margins.
const GRID_COLS = 12;
const GRID_ROWS = 5;
const GRID_PAD_X = 80;
const GRID_PAD_TOP = 140;
const GRID_PAD_BOTTOM = 140;
const GRID_W = 1920 - 2 * GRID_PAD_X;
const GRID_H = 1080 - GRID_PAD_TOP - GRID_PAD_BOTTOM;
const CELL_W = GRID_W / GRID_COLS;
const CELL_H = GRID_H / GRID_ROWS;
const CELL_GAP = 10;
const TILE_W = CELL_W - CELL_GAP;
const TILE_H = CELL_H - CELL_GAP;

export const CorpusReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Draw schedule for the 60 arcs (all ink). 15s draw window so the
  // grid fills in across the bulk of the VO.
  const drawWindow = Math.round(15.0 * fps);
  const perArcDraw = Math.round(0.45 * fps);
  const stagger = (drawWindow - perArcDraw) / (GALLERY_60.length - 1);

  // Color reveal — per-archetype 0→1 progress, staggered so groups land
  // one at a time. Starts at 17.0s (as the speaker hits "six"), all six
  // landed by ~19.5s.
  const colorizeForArch = (arch: number) => {
    const start = 17.0 + arch * 0.4;
    const end = start + 0.7;
    return interpolate(frame, [start * fps, end * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  return (
    <Frame>
      <AbsoluteFill style={{ padding: "70px 80px", pointerEvents: "none" }}>
        <Eyebrow inFrame={0}>SCRIPT SLUG</Eyebrow>
      </AbsoluteFill>
      {GALLERY_60.map((film, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const x = GRID_PAD_X + col * CELL_W;
        const y = GRID_PAD_TOP + row * CELL_H;
        const startFrame = Math.round(i * stagger);
        // Tile fades in just before the arc draws — that's the
        // "revealing grid" feeling.
        const tileOp = interpolate(
          frame,
          [startFrame - 4, startFrame + 4],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const t = colorizeForArch(film.arch);
        const stroke = mixHex(theme.ink, ARCH_COLOR_BY_ID[film.arch], t);
        // Stroke widens slightly as the color lands — gives the reveal
        // a touch more presence without a hard pop.
        const strokeWidth = 1.4 + 0.2 * t;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: TILE_W,
              height: TILE_H,
              opacity: tileOp,
            }}
          >
            <SiteArc
              points={film.points as ArcPoint[]}
              width={TILE_W}
              height={TILE_H}
              drawFromFrame={startFrame}
              drawToFrame={startFrame + perArcDraw}
              stroke={stroke}
              strokeWidth={strokeWidth}
              pad={{ top: 8, right: 8, bottom: 8, left: 8 }}
            />
          </div>
        );
      })}
    </Frame>
  );
};

// Small sRGB lerp between two hex colors. Same math the GalleryGrid
// helper uses — duplicated locally to keep the scenes file self-contained.
function mixHex(a: string, b: string, t: number): string {
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

// ── 10 · A few examples ────────────────────────────────────────────
// Three cards, vertically centered on the page. Each card stacks title,
// caption, arc, then the la-linea icon + archetype label below the arc.
// Arcs are drawn in archetype color with smile / frown face icons on the
// y-axis (via SiteArc.showAxes).
export const ThreeExamples: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Beat 10 is 18s. Final 1s (17–18s) fades out title, caption and arc
  // independently — the icon row stays at full opacity to the very
  // last frame, so beat 11 can pick it up at the same x/y without a
  // visible blink. (Boundary fade is skipped for this beat via
  // `skipFadeOut` in timeline.ts.)
  const FADE_OUT_FROM = Math.round(17.0 * fps);
  const FADE_OUT_TO = Math.round(18.0 * fps);
  const upperOpacity = interpolate(
    frame,
    [FADE_OUT_FROM, FADE_OUT_TO],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  // Card start frames are tuned to the VO recording. In the recording
  // the speaker says "Knives Out" at 0.0s, "Gladiator" at 6.63s, and
  // "Rocky" at 12.91s of the beat. Cards animate in ~0.4s before each
  // movie name so the title lands as the audience hears it.
  const cards = [
    {
      arc: GLASS_ONION,
      title: "Glass Onion: A Knives Out Mystery",
      year: "2022",
      caption: "A family reunion that goes wrong and stays wrong",
      arch: ARCHETYPES[3], // Tragedy
      color: archetypeColors.tragedy,
      start: 12,  // ~0.4s — right after the SceneFade-in completes
    },
    {
      arc: GLADIATOR,
      title: "Gladiator",
      year: "2000",
      caption: "Maximus loses everything, fights his way up, dies a free man",
      arch: ARCHETYPES[4], // Rags to Riches
      color: archetypeColors["rags-to-riches"],
      start: 187, // ~6.23s — matches "Gladiator" word at 6.63s with -0.4s lead
    },
    {
      arc: ROCKY_BALBOA,
      title: "Rocky Balboa",
      year: "2006",
      caption: "The man in a hole who climbs back out",
      arch: ARCHETYPES[2], // Man in a Hole
      color: archetypeColors["man-in-a-hole"],
      start: 375, // ~12.5s — matches "Rocky" word at 12.91s with -0.4s lead
    },
  ];
  // Card geometry — three columns centered on the page.
  const cardW = 560;
  const gap = 40;
  const totalW = cards.length * cardW + (cards.length - 1) * gap;
  const startLeft = (1920 - totalW) / 2;
  // Card content total height (title block + arc + icon row). Centered
  // vertically in the remaining frame. Arc height is tall on purpose —
  // the shapes need vertical room to read as dramatic.
  const titleH = 110;
  const arcH = 400;
  const iconRowH = 180;
  const totalH = titleH + arcH + iconRowH;
  const top = (1080 - totalH) / 2;

  return (
    <Frame>
      <AbsoluteFill style={{ padding: "70px 80px", pointerEvents: "none", opacity: upperOpacity }}>
        <Eyebrow inFrame={0}>A FEW EXAMPLES</Eyebrow>
      </AbsoluteFill>
      <AbsoluteFill>
        {cards.map((c, i) => {
          const left = startLeft + i * (cardW + gap);
          return (
            <Fade key={c.title} inFrame={c.start} duration={20}>
              <div style={{ position: "absolute", left, top, width: cardW, height: totalH }}>
                {/* Title, caption, arc all share `upperOpacity` so they
                    fade out together during the final 1.5s of the beat,
                    leaving just the icon row holding its position for the
                    seamless hand-off into beat 11. */}
                <div style={{ opacity: upperOpacity }}>
                  {/* Title + caption flow naturally from the top. The
                      title may wrap (Glass Onion does), but the arc and
                      icon row below are absolutely positioned so they
                      stay fixed regardless of title height — critical
                      for the beat 10 → 11 icon-row continuity. */}
                  <div
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 28,
                      color: theme.ink,
                      lineHeight: 1.15,
                    }}
                  >
                    <em>{c.title}</em>
                    <span style={{ fontStyle: "normal" }}> ({c.year})</span>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: fonts.body,
                      fontSize: 17,
                      color: theme.inkDim,
                      maxWidth: cardW - 20,
                    }}
                  >
                    {c.caption}
                  </div>
                  <div style={{ position: "absolute", left: 0, top: titleH, width: cardW }}>
                    <SiteArc
                      points={c.arc}
                      width={cardW}
                      height={arcH}
                      drawFromFrame={c.start + 10}
                      drawToFrame={c.start + 100}
                      stroke={theme.ink}
                      colorTransitionTo={c.color}
                      colorTransitionFrames={20}
                      strokeWidth={2.5}
                      showAxes
                    />
                  </div>
                </div>
                {/* Icon + archetype label — held back until the arc has
                    finished drawing AND its color transition has landed
                    (arc draws c.start+10 → c.start+100, then a ~20-frame
                    color transition). So we reveal this row at +120 so
                    it reads as the verdict. la-linea PNG is masked with
                    the archetype color — the icon itself becomes the
                    shape's color, not a black silhouette. Absolute
                    position so all three icons sit at the same Y
                    (otherwise Glass Onion's two-line title would push
                    its icon ~32px lower than Gladiator's). */}
                <Fade inFrame={c.start + 120} duration={22}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: titleH + arcH + 28,
                      display: "flex",
                      alignItems: "center",
                      gap: 24,
                    }}
                  >
                    <div
                      style={{
                        width: 150,
                        height: 150,
                        background: c.color,
                        WebkitMaskImage: `url(${staticFile(`la-linea/${c.arch.icon}`)})`,
                        maskImage: `url(${staticFile(`la-linea/${c.arch.icon}`)})`,
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                      }}
                    />
                    <div
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 22,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: c.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {c.arch.label}
                    </div>
                  </div>
                </Fade>
              </div>
            </Fade>
          );
        })}
      </AbsoluteFill>
    </Frame>
  );
};

// ── 11 · Six shapes — completes the set started in beat 10 ────────
// Picks up exactly where beat 10 left off: the three icons from beat 10
// (Tragedy, Rags to Riches, Man in a Hole) appear at the same x/y they
// ended at, in the same column order. They slide up to a new top row to
// open space underneath, then the three remaining shapes (Oedipus,
// Icarus, Cinderella) fade in one at a time on the bottom row.
//
// Layout uses the same column lefts as beat 10's card columns (80, 680,
// 1280) so the top-row icons land in the same vertical pipes the audience
// just saw.

// Column lefts must match beat 10 ThreeExamples (cardW 560, gap 40,
// startLeft 80) so the icons don't visually jump column on the cut.
const COL_LEFTS_B11 = [80, 680, 1280];
// Beat 10's icon-row absolute Y top:
//   beat10 card.top = (1080 − (titleH 110 + arcH 400 + iconRowH 180))/2 = 195
//   icon row offset inside card = titleH + arcH + marginTop = 110 + 400 + 28 = 538
//   absolute icon top = 195 + 538 = 733
const BEAT10_ICON_TOP = 733;
const TOP_ROW_FINAL_TOP = 280;
const BOTTOM_ROW_TOP = 680;
const ICON_SIZE_B11 = 150;

// Per-cell renderer — la-linea PNG masked to the archetype color (same
// trick as beat 10) + uppercase mono label to its right. Supports
// optional translateY for "slide in from below" reveals.
const ShapeCell: React.FC<{
  archIdx: number;
  x: number;
  y: number;
  opacity?: number;
  translateY?: number;
}> = ({ archIdx, x, y, opacity = 1, translateY = 0 }) => {
  const arch = ARCHETYPES[archIdx];
  const color = ARCH_COLOR_BY_ID[archIdx];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          width: ICON_SIZE_B11,
          height: ICON_SIZE_B11,
          background: color,
          WebkitMaskImage: `url(${staticFile(`la-linea/${arch.icon}`)})`,
          maskImage: `url(${staticFile(`la-linea/${arch.icon}`)})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 22,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color,
          lineHeight: 1.2,
          maxWidth: 340,
        }}
      >
        {arch.label}
      </div>
    </div>
  );
};

export const FortyFiveYears: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Top row order matches beat 10's left-to-right card order so each
  // icon stays in its own column on the cut.
  const TOP_ROW = [3, 4, 2]; // Tragedy, Rags to Riches, Man in a Hole
  // Bottom row — the three shapes the audience hasn't seen yet.
  const BOTTOM_ROW = [0, 1, 5]; // Oedipus, Icarus, Cinderella

  // Beat 11 picks up exactly where beat 10 left off (icons at y=733,
  // fully opaque — boundary fade is skipped via timeline flags). So we
  // get straight to the move: top row slides up first, bottom row
  // slides in from below after a beat.
  //
  // Top row slide-up: 0.2s breath, then ~0.9s slide.
  const slideStart = Math.round(0.2 * fps);
  const slideEnd = Math.round(1.1 * fps);
  const slideT = interpolate(frame, [slideStart, slideEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Ease the slide so it doesn't feel mechanical.
  const eased = slideT < 0.5 ? 2 * slideT * slideT : 1 - Math.pow(-2 * slideT + 2, 2) / 2;
  const topRowY =
    BEAT10_ICON_TOP + (TOP_ROW_FINAL_TOP - BEAT10_ICON_TOP) * eased;

  // Bottom row staggered slide-in. Each cell rises ~50px while fading
  // in, mirroring the language of the top row's slide-up. Starts just
  // before the top row finishes settling so the page never feels static.
  const SLIDE_DIST = 50;
  const bottomReveal = (col: number) => {
    const start = 0.9 + col * 0.25;
    const end = start + 0.6;
    const t = interpolate(frame, [start * fps, end * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return { opacity: easedT, translateY: SLIDE_DIST * (1 - easedT) };
  };

  return (
    <Frame>
      {TOP_ROW.map((archIdx, col) => (
        <ShapeCell
          key={`top-${archIdx}`}
          archIdx={archIdx}
          x={COL_LEFTS_B11[col]}
          y={topRowY}
        />
      ))}
      {BOTTOM_ROW.map((archIdx, col) => {
        const r = bottomReveal(col);
        return (
          <ShapeCell
            key={`bottom-${archIdx}`}
            archIdx={archIdx}
            x={COL_LEFTS_B11[col]}
            y={BOTTOM_ROW_TOP}
            opacity={r.opacity}
            translateY={r.translateY}
          />
        );
      })}
    </Frame>
  );
};


// ── Chart beats: 14 / 16 ───────────────────────────────────────────
// Each shows the website's own chart PNG (from docs/thesis-outputs/)
// revealed left-to-right under a website-style headline.

// ── 12 · "The grip holds." ─────────────────────────────────────────
// Five vertical stacked bars, one per decade (1980s → 2020s). Each bar
// is the dominant-archetype mix of films in that decade. The visual
// punchline is that the bars look nearly identical — the proportions
// have barely moved in 45 years.
//
// Bars grow smoothly from the baseline (no pre-rendered empty container
// outlines), staggered left→right so the audience reads the chart as
// it builds. Decade labels resolve as their bar starts to grow.
import { useClustered } from "../data";
export const GripHolds: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clustered = useClustered();

  const DECADES = ["1980s", "1990s", "2000s", "2010s", "2020s"];
  // Render archetypes bottom→top in the order Rags to Riches, Cinderella,
  // Man in a Hole, Oedipus, Icarus, Tragedy — roughly bright→dark so the
  // bars have a pleasant gradient feel.
  const STACK_ORDER = [4, 5, 2, 0, 1, 3];

  // Build per-decade proportions (0..1 per archetype, summing to 1).
  const decadeShares = React.useMemo(() => {
    const out: Record<string, number[]> = {};
    for (const d of DECADES) out[d] = [0, 0, 0, 0, 0, 0];
    if (clustered) {
      for (const r of clustered) {
        if (!DECADES.includes(r.decade)) continue;
        const a = +r.dominant_archetype;
        if (a >= 0 && a < 6) out[r.decade][a] += 1;
      }
      for (const d of DECADES) {
        const total = out[d].reduce((s, v) => s + v, 0) || 1;
        out[d] = out[d].map((v) => v / total);
      }
    }
    return out;
  }, [clustered]);

  // ── Layout — bars use most of the vertical space since we dropped
  // the title. Slight breath above and below.
  const CHART_TOP = 180;
  const CHART_BOTTOM = 960;
  const CHART_H = CHART_BOTTOM - CHART_TOP;
  const BAR_W = 200;
  const BAR_GAP = 80;
  const N = DECADES.length;
  const TOTAL_W = N * BAR_W + (N - 1) * BAR_GAP;
  const CHART_LEFT = (1920 - TOTAL_W) / 2;

  // Per-bar grow progress (0 → 1), eased. Staggered left→right so the
  // last bar finishes at ~5.2s — the audience is hearing "barely moves"
  // as the chart lands.
  const easeInOut = (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const growFor = (col: number) => {
    const start = 0.6 + col * 0.7;
    const end = start + 1.5;
    const raw = interpolate(frame, [start * fps, end * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return easeInOut(raw);
  };

  return (
    <Frame>
      <AbsoluteFill style={{ padding: "70px 80px", pointerEvents: "none" }}>
        <Eyebrow inFrame={0}>the steady state</Eyebrow>
      </AbsoluteFill>

      {/* Bars — each grows up from the baseline. The inner stacked
          column renders at full size; the outer wrapper clips to the
          current grow height so segments appear to slide in from below,
          revealing the segment colors in proportion as the bar climbs. */}
      {DECADES.map((decade, col) => {
        const x = CHART_LEFT + col * (BAR_W + BAR_GAP);
        const t = growFor(col);
        const visibleH = CHART_H * t;
        const shares = decadeShares[decade];
        let cum = 0;
        return (
          <React.Fragment key={decade}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: CHART_BOTTOM - visibleH,
                width: BAR_W,
                height: visibleH,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: CHART_H,
                }}
              >
                {STACK_ORDER.map((archIdx) => {
                  const share = shares[archIdx];
                  const segH = share * CHART_H;
                  const segBottom = cum;
                  cum += segH;
                  return (
                    <div
                      key={archIdx}
                      style={{
                        position: "absolute",
                        left: 0,
                        bottom: segBottom,
                        width: "100%",
                        height: segH,
                        background: ARCH_COLOR_BY_ID[archIdx],
                      }}
                    />
                  );
                })}
              </div>
            </div>
            {/* Decade label below the bar — fades in as the bar starts
                growing for that column. */}
            <div
              style={{
                position: "absolute",
                left: x,
                top: CHART_BOTTOM + 22,
                width: BAR_W,
                textAlign: "center",
                fontFamily: fonts.mono,
                fontSize: 18,
                letterSpacing: "0.22em",
                color: theme.inkDim,
                opacity: interpolate(
                  frame,
                  [(0.6 + col * 0.7) * fps, (0.6 + col * 0.7 + 0.6) * fps],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                ),
              }}
            >
              {decade}
            </div>
          </React.Fragment>
        );
      })}
    </Frame>
  );
};

// ── 13 · Why do today's films feel different? ─────────────────────
export const WhyDifferent: React.FC = () => (
  <Frame dark>
    <AbsoluteFill
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Title inFrame={8} size={72} align="center" color={theme.bg}>
        So why do today's films feel <Accent>different</Accent>?
      </Title>
    </AbsoluteFill>
  </Frame>
);

// ── 14 · People talk a lot more now. ──────────────────────────────
// Live port of drawDialogueDensity from main.js.
import { DialogueDensityChart } from "../components/DialogueDensityChart";
export const DialogueDensity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  return (
    <Frame>
      <AbsoluteFill style={{ padding: "60px 80px" }}>
        <Eyebrow inFrame={0}>first reason</Eyebrow>
        <div style={{ marginTop: 12 }}>
          <Title inFrame={6} size={56}>
            People talk a lot more&nbsp;now.
          </Title>
        </div>
        <div style={{ marginTop: 8 }}>
          <Body inFrame={20} size={20} maxWidth={1200}>
            Horror and thrillers used to leave room for things to happen without anyone talking. Not
            anymore. By the 2010s, nearly every genre runs on dialogue. The scripts that used to sit
            at the quiet end — <em>Friday the 13th</em>, <em>Body Heat</em> — don't get written
            anymore.
          </Body>
        </div>
        <div style={{ flex: 1, marginTop: 24 }}>
          <DialogueDensityChart width={1760} height={780} seconds={seconds} />
        </div>
      </AbsoluteFill>
    </Frame>
  );
};

// ── 15 · "Sounding more like each other." ─────────────────────────
// A faint bundle of arcs converging.
export const SoundingAlike: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pull = 1 - t * 0.6;
  return (
    <Frame>
      <AbsoluteFill style={{ padding: "80px 100px" }}>
        <Eyebrow inFrame={0}>more alike</Eyebrow>
        <div style={{ marginTop: 14 }}>
          <Title inFrame={6} size={56}>
            They started sounding the same.
          </Title>
        </div>
        <div
          style={{
            marginTop: 40,
            position: "relative",
            width: "100%",
            height: 460,
          }}
        >
          {[INTERSTELLAR, GROUNDHOG_DAY, KNIVES_OUT, GLADIATOR, ROCKY_BALBOA, INGLOURIOUS_LIKE].map(
            (arc, i) => (
              <div key={i} style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
                <SiteArc
                  points={arc.map((p) => ({ ...p, z_score: p.z_score * pull }))}
                  width={1720}
                  height={460}
                  drawFromFrame={0}
                  drawToFrame={1}
                  stroke={theme.ink}
                  strokeWidth={1.5}
                />
              </div>
            )
          )}
        </div>
      </AbsoluteFill>
    </Frame>
  );
};

// Distinct sample for SoundingAlike — using INGLOURIOUS arc imported via
// arc-data once we promote it. Here we just alias it.
import { INGLOURIOUS as INGLOURIOUS_LIKE } from "../arc-data";

// ── 16 · Rising lose, falling gain. ───────────────────────────────
// Per the script: chart loads as genre view → user "clicks into Drama"
// → hover Rags to Riches → zoom back out → "click into Horror" → hover
// Icarus. Beat duration is 19s.
//
//   0.0  - 5.5s   genre view loads (full reveal staging)
//   5.5  - 8.0s   drilldown into Drama (archetype-within-Drama)
//   8.0 - 11.0s   spotlight Rags to Riches inside Drama (the collapse)
//  11.0 - 12.5s   back to genre view (brief)
//  12.5 - 15.0s   drilldown into Horror
//  15.0 - 19.0s   spotlight Icarus inside Horror (the surge)
import { ShapeShiftChart } from "../components/ShapeShiftChart";
export const RisingFalling: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;

  let drilldown: string | undefined;
  let spotlight: number | undefined;
  // Each drilldown segment passes its OWN local seconds so the chart's
  // reveal staging plays once per view (it's a fast reveal — bands grow
  // in ~1.5s once entered).
  let chartSeconds = s;
  if (s >= 5.5 && s < 8.0) {
    drilldown = "Drama";
    chartSeconds = (s - 5.5) + 1.0; // skip past the leading axis-reveal
  } else if (s >= 8.0 && s < 11.0) {
    drilldown = "Drama";
    spotlight = 4; // Rags to Riches
    chartSeconds = (s - 5.5) + 1.0;
  } else if (s >= 12.5 && s < 15.0) {
    drilldown = "Horror";
    chartSeconds = (s - 12.5) + 1.0;
  } else if (s >= 15.0) {
    drilldown = "Horror";
    spotlight = 1; // Icarus
    chartSeconds = (s - 12.5) + 1.0;
  }

  return (
    <Frame>
      <AbsoluteFill style={{ padding: "60px 80px" }}>
        <Eyebrow inFrame={0}>second reason</Eyebrow>
        <div style={{ marginTop: 12 }}>
          <Title inFrame={6} size={56}>
            Things are more dramatic and less&nbsp;forgiving.
          </Title>
        </div>
        <div style={{ marginTop: 8 }}>
          <Body inFrame={20} size={20} maxWidth={1200}>
            The rising shapes are losing ground. The falling shapes are gaining it. In Drama, Rags
            to Riches has collapsed. In Horror, Icarus has surged.
          </Body>
        </div>
        <div style={{ flex: 1, marginTop: 24 }}>
          <ShapeShiftChart
            width={1760}
            height={780}
            seconds={chartSeconds}
            drilldownGenre={drilldown}
            spotlightArchetype={spotlight}
          />
        </div>
      </AbsoluteFill>
    </Frame>
  );
};

// ── 17 · Bleaker. ──────────────────────────────────────────────────
// Two arcs side by side: THEN climbs out, NOW keeps falling. Using
// Shawshank (Man-in-a-Hole) and Inglourious (Icarus-leaning falls) as
// the exemplars — both real website arcs.
export const Bleaker: React.FC = () => (
  <Frame>
    <AbsoluteFill style={{ padding: "70px 80px", flexDirection: "column" }}>
      <Eyebrow inFrame={0}>bleaker</Eyebrow>
      <div style={{ marginTop: 12 }}>
        <Title inFrame={6} size={52}>
          When things go badly, heroes don't recover.
        </Title>
      </div>
      <div style={{ display: "flex", gap: 80, marginTop: 36, alignItems: "flex-start" }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontFamily: fonts.mono,
              color: theme.inkFaint,
              fontSize: 14,
              letterSpacing: "0.2em",
            }}
          >
            THEN
          </div>
          <div style={{ marginTop: 10 }}>
            <SiteArc
              points={ROCKY_BALBOA}
              width={780}
              height={300}
              drawFromFrame={20}
              drawToFrame={110}
              stroke={archetypeColors["man-in-a-hole"]}
              strokeWidth={3}
              showAxes
            />
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: fonts.display,
              fontStyle: "italic",
              fontSize: 22,
              color: theme.inkDim,
            }}
          >
            climbs out.
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontFamily: fonts.mono,
              color: theme.red,
              fontSize: 14,
              letterSpacing: "0.2em",
            }}
          >
            NOW
          </div>
          <div style={{ marginTop: 10 }}>
            <SiteArc
              points={INGLOURIOUS_LIKE}
              width={780}
              height={300}
              drawFromFrame={60}
              drawToFrame={150}
              stroke={theme.red}
              strokeWidth={3}
              showAxes
            />
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: fonts.display,
              fontStyle: "italic",
              fontSize: 22,
              color: theme.red,
            }}
          >
            doesn't.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  </Frame>
);

// ── 18 · "Vonnegut was right. Heroes have changed." ───────────────
export const VonnegutWasRight: React.FC = () => {
  const frame = useCurrentFrame();
  const PHASE2 = 180;
  const op1 = interpolate(frame, [PHASE2 - 18, PHASE2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op2 = interpolate(frame, [PHASE2, PHASE2 + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Frame>
      <AbsoluteFill
        style={{
          opacity: op1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <img
          src={staticFile("vonnegut.jpg")}
          style={{
            width: 200,
            height: 200,
            objectFit: "cover",
            borderRadius: "50%",
            filter: "grayscale(0.3)",
          }}
        />
        <Title inFrame={20} size={80} align="center">
          Vonnegut was <Accent>right.</Accent>
        </Title>
        <Body inFrame={60} size={26} maxWidth={1100}>
          The shapes haven't changed in forty-five years.
        </Body>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          opacity: op2,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <Title inFrame={PHASE2 + 6} size={52} align="center">
          But our heroes have.
        </Title>
        <div style={{ display: "flex", gap: 60, marginTop: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 14,
                letterSpacing: "0.2em",
                color: theme.inkFaint,
              }}
            >
              1980 — 2000
            </div>
            <div style={{ marginTop: 8 }}>
              <SiteArc
                points={ROCKY_BALBOA}
                width={620}
                height={240}
                drawFromFrame={PHASE2 + 30}
                drawToFrame={PHASE2 + 110}
                stroke={archetypeColors["man-in-a-hole"]}
                strokeWidth={3}
              />
            </div>
            <div
              style={{
                fontFamily: fonts.display,
                fontStyle: "italic",
                color: theme.inkDim,
                fontSize: 22,
                marginTop: 8,
              }}
            >
              climbs out
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 14,
                letterSpacing: "0.2em",
                color: theme.red,
              }}
            >
              2010 — 2025
            </div>
            <div style={{ marginTop: 8 }}>
              <SiteArc
                points={INGLOURIOUS_LIKE}
                width={620}
                height={240}
                drawFromFrame={PHASE2 + 80}
                drawToFrame={PHASE2 + 160}
                stroke={theme.red}
                strokeWidth={3}
              />
            </div>
            <div
              style={{
                fontFamily: fonts.display,
                fontStyle: "italic",
                color: theme.red,
                fontSize: 22,
                marginTop: 8,
              }}
            >
              doesn't.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Frame>
  );
};

// ── 19 · "Stories are rehearsals." ────────────────────────────────
export const RehearseTheFall: React.FC = () => (
  <Frame>
    <AbsoluteFill
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <Eyebrow inFrame={0}>equipment for living</Eyebrow>
      <Title inFrame={8} size={72} align="center">
        Stories are rehearsals for the&nbsp;future.
      </Title>
      <div style={{ marginTop: 20 }}>
        <Title inFrame={120} size={52} align="center" color={theme.red}>
          We used to rehearse climbing&nbsp;out.
          <br />
          Now, we rehearse the&nbsp;fall.
        </Title>
      </div>
    </AbsoluteFill>
  </Frame>
);

// ── 20 · "What kind of future are we practicing for?" ─────────────
export const FutureQuestion: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [140, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Frame>
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: fadeOut,
        }}
      >
        <Title inFrame={6} size={78} align="center">
          So, what kind of future are we
          <br />
          <Accent>practicing for?</Accent>
        </Title>
      </AbsoluteFill>
    </Frame>
  );
};
