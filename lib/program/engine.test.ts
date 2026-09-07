import assert from "node:assert/strict";
import { buildProgramPreview } from "./engine";

const preview = buildProgramPreview({
  goal: "MUSCLE_GAIN",
  weightKg: 80,
  trainingExperience: "INTERMEDIATE",
  trainingDaysPerWeek: 3,
  equipmentProfile: "FULL_GYM",
});

assert.equal(preview.family, "Full Body A/B/C");
assert.equal(preview.days, 3);
assert.equal(preview.nutrition.proteinLowG, 128);
assert.equal(preview.nutrition.proteinHighG, 160);
assert.ok(preview.exercises.length >= 15);
assert.equal(preview.nutrition.status, "NEEDS_MORE_INPUT");
console.log("program engine tests passed");
