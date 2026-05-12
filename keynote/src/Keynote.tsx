import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { RESOLVED_BEATS } from "./timeline";
import { resolveScene } from "./scenes";
import { theme, fonts } from "./theme";

// Each beat fades IN over its first FADE_FRAMES, holds at full opacity,
// then fades OUT over its last FADE_FRAMES. Because Sequences play
// back-to-back without overlap, the result is:
//
//   scene K        fades out to 0 over its last FADE_FRAMES
//   (boundary)     paper background only for 1 frame
//   scene K+1      fades in from 0 over its first FADE_FRAMES
//
// That gives a clean "old beat clears before new beat arrives" rhythm —
// no two-beats-visible-at-once crossfade. The brief paper-bg pause
// reads as a deliberate beat between thoughts. 18 frames (0.6s) gives
// transitions enough room not to feel abrupt, especially when adjacent
// beats are visually very different (e.g. process chart → number counter).
const FADE_FRAMES = 18;

const SceneFade: React.FC<{
  durationInFrames: number;
  skipFadeIn?: boolean;
  skipFadeOut?: boolean;
  children: React.ReactNode;
}> = ({ durationInFrames, skipFadeIn, skipFadeOut, children }) => {
  const frame = useCurrentFrame();
  const opacityIn = skipFadeIn
    ? 1
    : interpolate(frame, [0, FADE_FRAMES], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const opacityOut = skipFadeOut
    ? 1
    : interpolate(
        frame,
        [durationInFrames - FADE_FRAMES, durationInFrames],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
  return (
    <AbsoluteFill style={{ opacity: opacityIn * opacityOut }}>
      {children}
    </AbsoluteFill>
  );
};

const ProgressStrip: React.FC = () => {
  const frame = useCurrentFrame();
  const last = RESOLVED_BEATS[RESOLVED_BEATS.length - 1];
  const total = last.startFrame + last.durationInFrames;
  const t = interpolate(frame, [0, total], [0, 1]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", justifyContent: "flex-end" }}>
      <div style={{ height: 4, background: "rgba(0,0,0,0.06)", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${t * 100}%`,
            background: theme.amber,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const Keynote: React.FC<{ showProgress?: boolean }> = ({ showProgress = false }) => {
  return (
    <AbsoluteFill style={{ background: theme.bg, fontFamily: fonts.body }}>
      {RESOLVED_BEATS.map((b) => (
        <Sequence
          key={b.id}
          from={b.startFrame}
          durationInFrames={b.durationInFrames}
          name={b.id}
        >
          <SceneFade
            durationInFrames={b.durationInFrames}
            skipFadeIn={b.skipFadeIn}
            skipFadeOut={b.skipFadeOut}
          >
            {resolveScene(b)}
          </SceneFade>
        </Sequence>
      ))}
      {showProgress && <ProgressStrip />}
    </AbsoluteFill>
  );
};
