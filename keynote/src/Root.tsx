import React from "react";
import { Composition } from "remotion";
import { Keynote } from "./Keynote";
import { TOTAL_FRAMES, RESOLVED_BEATS } from "./timeline";
import { FPS, WIDTH, HEIGHT } from "./theme";
import { resolveScene } from "./scenes";

// Each beat plays back-to-back with NO overlap. Internal fade-out at
// the end of each scene + fade-in at the start of the next gives a
// clean "old clears before new arrives" rhythm (Keynote.tsx handles
// this via SceneFade). Total runtime = sum of beat durations.
const KEYNOTE_DURATION = TOTAL_FRAMES;

const BeatPreview: React.FC<{ beatIndex: number }> = ({ beatIndex }) =>
  resolveScene(RESOLVED_BEATS[beatIndex]);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Keynote"
      component={Keynote}
      durationInFrames={KEYNOTE_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ showProgress: false }}
    />
    <Composition
      id="KeynotePreview"
      component={Keynote}
      durationInFrames={KEYNOTE_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ showProgress: true }}
    />
    {RESOLVED_BEATS.map((b, i) => (
      <Composition
        key={b.id}
        id={`Beat-${b.id}`}
        component={BeatPreview}
        durationInFrames={b.durationInFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ beatIndex: i }}
      />
    ))}
  </>
);
