import React from "react";
import type { Beat } from "../timeline";
import {
  RockyPlaceholder,
  FeelingShape,
  VonnegutThreeArcs,
  FeedToComputer,
  BooksToSix,
  ProcessInterstellar,
  ShuffleCounter,
  CorpusReveal,
  ThreeExamples,
  FortyFiveYears,
  GripHolds,
  WhyDifferent,
  DialogueDensity,
  RisingFalling,
  VonnegutWasRight,
  RehearseTheFall,
  FutureQuestion,
} from "./scenes";

export function resolveScene(beat: Beat): React.ReactElement {
  switch (beat.kind) {
    case "rocky-placeholder":
      return React.createElement(RockyPlaceholder);
    case "feeling-shape":
      return React.createElement(FeelingShape);
    case "vonnegut-three-arcs":
      return React.createElement(VonnegutThreeArcs);
    case "feed-to-computer":
      return React.createElement(FeedToComputer);
    case "books-to-six":
      return React.createElement(BooksToSix);
    case "process-interstellar":
      return React.createElement(ProcessInterstellar);
    case "shuffle-counter":
      return React.createElement(ShuffleCounter);
    case "corpus-reveal":
      return React.createElement(CorpusReveal);
    case "three-examples":
      return React.createElement(ThreeExamples);
    case "forty-five-years":
      return React.createElement(FortyFiveYears);
    case "grip-holds":
      return React.createElement(GripHolds);
    case "why-different":
      return React.createElement(WhyDifferent);
    case "dialogue-density":
      return React.createElement(DialogueDensity);
    case "rising-falling":
      return React.createElement(RisingFalling);
    case "vonnegut-was-right":
      return React.createElement(VonnegutWasRight);
    case "rehearse-the-fall":
      return React.createElement(RehearseTheFall);
    case "future-question":
      return React.createElement(FutureQuestion);
  }
}
