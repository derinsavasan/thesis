// Data loaders for the chart scenes. Mirrors main.js's loadArchData /
// drawDialogueDensity fetch calls.
//
// We use Remotion's delayRender / continueRender so the renderer doesn't
// snapshot frames until the CSV/JSON is parsed and stored. Each loader
// caches its result on the module so subsequent renders don't re-parse.

import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { csvParse, autoType } from "d3-dsv";

// ─── emotional_arcs_clustered.csv ──────────────────────────────────
// One row per film. Columns we care about:
//   title, year, decade, primary_genre, dominant_archetype (0-5)
//   plus archetype mixture weights arch_0_weight…arch_5_weight
//   plus 20 sentiment samples w01…w20
export type ClusteredRow = {
  film_id: string;
  title: string;
  year: number;
  genre: string;
  decade: string;
  primary_genre: string;
  dominant_archetype: number;
  // 20 sentiment samples
  w01: number; w02: number; w03: number; w04: number; w05: number;
  w06: number; w07: number; w08: number; w09: number; w10: number;
  w11: number; w12: number; w13: number; w14: number; w15: number;
  w16: number; w17: number; w18: number; w19: number; w20: number;
  // mixture weights
  arch_0_weight: number; arch_1_weight: number; arch_2_weight: number;
  arch_3_weight: number; arch_4_weight: number; arch_5_weight: number;
};

let clusteredCache: ClusteredRow[] | null = null;

export function useClustered(): ClusteredRow[] | null {
  const [data, setData] = useState<ClusteredRow[] | null>(clusteredCache);
  useEffect(() => {
    if (clusteredCache) return;
    const handle = delayRender("load clustered");
    fetch(staticFile("thesis-outputs/emotional_arcs_clustered.csv"))
      .then((r) => r.text())
      .then((txt) => {
        const rows = csvParse(txt, autoType) as unknown as ClusteredRow[];
        clusteredCache = rows;
        setData(rows);
        continueRender(handle);
      })
      .catch((err) => {
        console.error("[useClustered] failed:", err);
        continueRender(handle);
      });
  }, []);
  return data;
}

// ─── pacing_dialogue.json ──────────────────────────────────────────
// One row per film. Has slug, imdb_id, scene_count, total_word_count,
// dialogue_word_count, pacing, dialogue_density.
export type PacingRow = {
  slug: string;
  imdb_id: string;
  scene_count: number;
  total_word_count: number;
  dialogue_word_count: number;
  pacing: number;
  dialogue_density: number;
};

let pacingCache: PacingRow[] | null = null;

export function usePacing(): PacingRow[] | null {
  const [data, setData] = useState<PacingRow[] | null>(pacingCache);
  useEffect(() => {
    if (pacingCache) return;
    const handle = delayRender("load pacing");
    fetch(staticFile("thesis-outputs/pacing_dialogue.json"))
      .then((r) => r.json())
      .then((rows: PacingRow[]) => {
        pacingCache = rows;
        setData(rows);
        continueRender(handle);
      })
      .catch((err) => {
        console.error("[usePacing] failed:", err);
        continueRender(handle);
      });
  }, []);
  return data;
}
