// Single source of truth for keynote pacing. Beats are tuned to the
// actual VO recording at keynote/public/312 Bowery 5.m4a (transcribed
// with whisper.cpp, word-level timestamps).
//
// Total target: ~249s ≈ 4:09 (recording is 243.7s).

import { FPS } from "./theme";

export type Beat = {
  id: string;
  // Suppress the boundary-fade for this beat. Used when two adjacent
  // beats share visual state (e.g. icons that should appear to slide
  // from one beat into the next without blinking through bg).
  skipFadeIn?: boolean;
  skipFadeOut?: boolean;
  kind:
    | "rocky-placeholder"
    | "feeling-shape"
    | "vonnegut-three-arcs"
    | "feed-to-computer"
    | "books-to-six"
    | "process-interstellar"
    | "shuffle-counter"
    | "corpus-reveal"
    | "three-examples"
    | "forty-five-years"
    | "grip-holds"
    | "why-different"
    | "dialogue-density"
    | "sounding-alike"
    | "rising-falling"
    | "bleaker"
    | "vonnegut-was-right"
    | "rehearse-the-fall"
    | "future-question";
  vo: string;
  seconds: number;
};

export const BEATS: Beat[] = [
  { id: "01-rocky", kind: "rocky-placeholder", seconds: 22,
    vo: "Think about the last Rocky movie you saw. Rocky is down. Rocky trains. There's a montage. He runs up some stairs, punches some meat. The fight comes. The bell rings. Rocky wins, or he loses, but either way he's still standing, and you walk out of the theatre feeling something." },
  { id: "02-feeling-shape", kind: "feeling-shape", seconds: 6,
    vo: "Well, that feeling has a shape, and we can capture it." },
  { id: "03-vonnegut", kind: "vonnegut-three-arcs", seconds: 26,
    vo: "American novelist Kurt Vonnegut once had an idea that every story ever written in the history of mankind has a shape. You follow a character and plot his good fortune and ill fortune over time, and you get a curve. Cinderella rises, dips, rises higher. Hamlet falls, falls deeper, never recovers. Rocky falls, climbs, lands on his feet." },
  { id: "04-feed", kind: "feed-to-computer", seconds: 5,
    vo: "Vonnegut also said you should be able to feed these shapes into a computer… someday." },
  { id: "05-books", kind: "books-to-six", seconds: 16,
    vo: "In 2016, some researchers finally did — but with books. They looked at roughly 1,400 books and found six basic shapes underneath them all. That was literature. I wanted to know what Hollywood's shapes look like." },
  { id: "06-process", kind: "process-interstellar", seconds: 28,
    vo: "Here's how it works. I take a screenplay — Interstellar, for example — and split it into 20 chunks. I run each chunk through a sentiment model that scores how the mood rises and falls across the writing. I then string those scores together, which gives me the emotional arc of the film — aka its shape. [PAUSE ~10s — let both spotlights play, narrate the moments freely if you want]" },
  { id: "07-shuffle", kind: "shuffle-counter", seconds: 6,
    vo: "I then do this to many other films. One thousand, six hundred and twenty-seven, to be exact." },
  { id: "08-corpus-reveal", kind: "corpus-reveal", seconds: 20,
    vo: "I pulled every movie script from 1980 to 2025 from Script Slug. Ran them all through the same process. With the help of machine learning, I asked the computer what shapes keep showing up. It came back with six. Same as books." },
  { id: "10-examples", kind: "three-examples", seconds: 18, skipFadeOut: true,
    vo: "Knives Out is one. A family reunion that goes wrong and stays wrong. Gladiator is another. Maximus loses everything, fights his way up, dies a free man. Rocky is a third. The man in a hole who climbs back out." },
  { id: "11-45y", kind: "forty-five-years", seconds: 6, skipFadeIn: true,
    vo: "Six shapes for forty-five years of Hollywood. [HOLD — give the audience time to register the three new shapes / icons before moving on.]" },
  { id: "12-grip", kind: "grip-holds", seconds: 12,
    vo: "Ask what the most common shape is in any given decade, and the answer barely moves. The proportions hold. Hollywood has been telling the same six stories since 1980." },
  { id: "13-why", kind: "why-different", seconds: 4,
    vo: "So why do the films of now feel… different?" },
  { id: "14-dialogue", kind: "dialogue-density", seconds: 24,
    vo: "For starters, people in movies talk a lot more now, and the age of show, don't tell is over. Scripts have been getting talkier since the 80s, and the range has shrunk. The 80s had real outliers — movies that were almost all action like Jurassic Park, or movies that were almost all talk. By the 2010s those were gone." },
  { id: "15-alike", kind: "sounding-alike", seconds: 8,
    vo: "Not only did scripts start talking more, they also started sounding more like each other." },
  { id: "16-rising", kind: "rising-falling", seconds: 19,
    vo: "Second, the rising shapes are losing ground and the falling shapes are gaining it. Zoom into Drama, and Rags to Riches has collapsed. The underdog story is disappearing from the genre that used to run on it. Zoom into Horror, and we have rises that end in a crash with absolutely no recovery." },
  { id: "17-bleak", kind: "bleaker", seconds: 9,
    vo: "We're watching bleaker movies now. When things go well, they don't last. When they go badly, our heroes don't recover." },
  { id: "18-right", kind: "vonnegut-was-right", seconds: 14,
    vo: "So — turns out Kurt Vonnegut was right. Stories have shapes. And those shapes haven't changed in the last forty-five years. Our heroes have, though. They used to climb back out from the trouble they were in. Now, they don't." },
  { id: "19-rehearse", kind: "rehearse-the-fall", seconds: 12,
    vo: "Stories are rehearsals for what we expect from the future. We rehearse what we expect. For the past forty-five years, we rehearsed climbing out. Now, we rehearse the fall." },
  { id: "20-future", kind: "future-question", seconds: 5,
    vo: "So, what kind of future are we practicing for?" },
];

export type ResolvedBeat = Beat & {
  startFrame: number;
  durationInFrames: number;
};

export const RESOLVED_BEATS: ResolvedBeat[] = (() => {
  let cursor = 0;
  return BEATS.map((b) => {
    const durationInFrames = Math.round(b.seconds * FPS);
    const resolved: ResolvedBeat = { ...b, startFrame: cursor, durationInFrames };
    cursor += durationInFrames;
    return resolved;
  });
})();

export const TOTAL_FRAMES = RESOLVED_BEATS.reduce((s, b) => s + b.durationInFrames, 0);
