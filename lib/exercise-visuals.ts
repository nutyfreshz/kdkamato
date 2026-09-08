export type ExerciseVisualPair = {
  source: "REPDB";
  start: string;
  finish: string;
  sourceUrl: string;
};

const REPDB_BASE = "https://exercise-dataset.com";

function repdb(slug: string): ExerciseVisualPair {
  return {
    source: "REPDB",
    start: `${REPDB_BASE}/images/flat/${slug}-start.webp`,
    finish: `${REPDB_BASE}/images/flat/${slug}-peak.webp`,
    sourceUrl: `${REPDB_BASE}/exercise/${slug}/`,
  };
}

// Batch 01: direct, visually reviewed matches only.
// Missing catalog exercises are intentionally deferred until PRO validation passes.
export const EXERCISE_VISUALS: Record<string, ExerciseVisualPair> = {
  MACHINE_CHEST_PRESS: repdb("chest-press-machine"),
  INCLINE_DB_PRESS: repdb("incline-db-press"),
  LAT_PULLDOWN: repdb("lat-pulldown"),
  HACK_SQUAT: repdb("hack-squat"),
  LEG_PRESS: repdb("leg-press"),
  LEG_EXTENSION: repdb("leg-extension"),
  ROMANIAN_DEADLIFT: repdb("romanian-deadlift"),
  CABLE_LATERAL_RAISE: repdb("cable-lateral-raise"),
  CABLE_FACE_PULL: repdb("face-pull"),
  CABLE_EXTERNAL_ROTATION: repdb("cable-external-rotation"),
};

export function getExerciseVisual(exerciseKey: string) {
  return EXERCISE_VISUALS[exerciseKey] ?? null;
}
