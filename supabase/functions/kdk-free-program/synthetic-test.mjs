import { buildFreeProgram, validateFreeProgram } from "./engine.mjs";

const goals = ["MUSCLE_GAIN", "FAT_LOSS", "RECOMPOSITION", "GENERAL_FITNESS"];
const focuses = ["BALANCED", "CHEST", "BACK", "ARMS", "LEGS", "REPOSTURE"];
const experiences = ["BEGINNER", "INTERMEDIATE", "EXPERIENCED"];
const equipment = ["FULL_GYM", "LIMITED_GYM", "HOME_BASIC"];
const durations = [45, 60, 75, 90];
const daysList = [2, 3, 4, 5, 6];

function profile({ goal, focus, experience, equipmentProfile, duration, days, completeEnergy = true }) {
  const baseline = {
    goal,
    weight_kg: 82,
    height_cm: completeEnergy ? 178 : null,
    age_years: completeEnergy ? 35 : null,
    sex: completeEnergy ? "MALE" : null,
    training_experience: experience,
    training_days_per_week: days,
    equipment_profile: equipmentProfile,
    body_fat_pct: null,
    body_fat_method: null,
  };
  const nutrition = {
    average_steps: completeEnergy ? 8000 : null,
    cardio_minutes_per_week: 60,
    cardio_type: "MIXED",
    meal_frequency: 3,
    current_calories: null,
  };
  const training = {
    session_duration_min: duration,
    priority_muscles: { primary: focus, secondary: [] },
    basic_constraints: null,
    exercise_exclusions: null,
  };
  return { baseline, nutrition, training };
}

const failures = [];
let programs = 0;
for (const goal of goals) {
  for (const focus of focuses) {
    for (const experience of experiences) {
      for (const equipmentProfile of equipment) {
        for (const duration of durations) {
          for (const days of daysList) {
            const p = profile({ goal, focus, experience, equipmentProfile, duration, days });
            let program;
            try {
              program = buildFreeProgram(p.baseline, p.nutrition, p.training);
            } catch (error) {
              failures.push(`BUILD:${goal}:${focus}:${experience}:${equipmentProfile}:${duration}:${days}:${error.message}`);
              continue;
            }
            programs += 1;
            const v = validateFreeProgram(program);
            if (!v.ok) failures.push(...v.errors.map((e) => `VALIDATE:${goal}:${focus}:${experience}:${equipmentProfile}:${duration}:${days}:${e}`));
            if (program.days !== days) failures.push(`DAYS_MISMATCH:${days}->${program.days}`);
            if (!program.training_items.length) failures.push(`EMPTY_PROGRAM:${goal}:${focus}:${experience}:${equipmentProfile}:${duration}:${days}`);
            const serializedA = JSON.stringify(program);
            const serializedB = JSON.stringify(buildFreeProgram(p.baseline, p.nutrition, p.training));
            if (serializedA !== serializedB) failures.push(`NON_DETERMINISTIC:${goal}:${focus}:${experience}:${equipmentProfile}:${duration}:${days}`);
            if (program.nutrition_target.calorie_low == null || program.nutrition_target.estimate_confidence !== "MODERATE") {
              failures.push(`ENERGY_SHOULD_BE_READY:${goal}:${focus}:${experience}:${equipmentProfile}:${duration}:${days}`);
            }
          }
        }
      }
    }
  }
}

// Focus differentiation: same profile, only focus changes.
for (const experience of experiences) {
  for (const equipmentProfile of equipment) {
    for (const duration of durations) {
      for (const days of daysList) {
        const common = { goal: "MUSCLE_GAIN", experience, equipmentProfile, duration, days };
        const make = (focus) => {
          const p = profile({ ...common, focus });
          return buildFreeProgram(p.baseline, p.nutrition, p.training).weekly_volume;
        };
        const balanced = make("BALANCED");
        const chest = make("CHEST");
        const back = make("BACK");
        const arms = make("ARMS");
        const legs = make("LEGS");
        const reposture = make("REPOSTURE");
        if ((chest.CHEST ?? 0) <= (balanced.CHEST ?? 0)) failures.push(`FOCUS_NO_GAIN:CHEST:${experience}:${equipmentProfile}:${duration}:${days}:${balanced.CHEST}->${chest.CHEST}`);
        if ((back.BACK ?? 0) <= (balanced.BACK ?? 0)) failures.push(`FOCUS_NO_GAIN:BACK:${experience}:${equipmentProfile}:${duration}:${days}:${balanced.BACK}->${back.BACK}`);
        const balArms = (balanced.BICEPS ?? 0) + (balanced.TRICEPS ?? 0);
        const armArms = (arms.BICEPS ?? 0) + (arms.TRICEPS ?? 0);
        if (armArms <= balArms) failures.push(`FOCUS_NO_GAIN:ARMS:${experience}:${equipmentProfile}:${duration}:${days}:${balArms}->${armArms}`);
        const balLegs = (balanced.QUADS ?? 0) + (balanced.HAMSTRINGS ?? 0) + (balanced.CALVES ?? 0);
        const legLegs = (legs.QUADS ?? 0) + (legs.HAMSTRINGS ?? 0) + (legs.CALVES ?? 0);
        if (legLegs <= balLegs) failures.push(`FOCUS_NO_GAIN:LEGS:${experience}:${equipmentProfile}:${duration}:${days}:${balLegs}->${legLegs}`);
        if ((reposture.ROTATOR_CUFF ?? 0) <= 0) failures.push(`FOCUS_NO_ROTATOR_CUFF:REPOSTURE:${experience}:${equipmentProfile}:${duration}:${days}`);
        if ((reposture.LOWER_TRAP ?? 0) <= 0) failures.push(`FOCUS_NO_LOWER_TRAP:REPOSTURE:${experience}:${equipmentProfile}:${duration}:${days}`);
        const balancedUpperSupport = (balanced.BACK ?? 0) + (balanced.SHOULDERS ?? 0);
        const repostureUpperSupport = (reposture.BACK ?? 0) + (reposture.SHOULDERS ?? 0) + (reposture.ROTATOR_CUFF ?? 0) + (reposture.LOWER_TRAP ?? 0);
        if (repostureUpperSupport <= balancedUpperSupport) failures.push(`FOCUS_NO_GAIN:REPOSTURE:${experience}:${equipmentProfile}:${duration}:${days}:${balancedUpperSupport}->${repostureUpperSupport}`);
      }
    }
  }
}


// Reposture must contain posture-support roles and avoid behind-neck pulling as a generic default.
for (const equipmentProfile of equipment) {
  for (const days of daysList) {
    const p = profile({ goal: "GENERAL_FITNESS", focus: "REPOSTURE", experience: "INTERMEDIATE", equipmentProfile, duration: 60, days });
    const program = buildFreeProgram(p.baseline, p.nutrition, p.training);
    const slots = new Set(program.training_items.map((x) => x.movement_slot));
    if (!slots.has("EXTERNAL_ROTATION")) failures.push(`REPOSTURE_MISSING_EXTERNAL_ROTATION:${equipmentProfile}:${days}`);
    if (!slots.has("LOWER_TRAP")) failures.push(`REPOSTURE_MISSING_LOWER_TRAP:${equipmentProfile}:${days}`);
    if (!slots.has("POSTURE_ACCESSORY")) failures.push(`REPOSTURE_MISSING_POSTURE_ACCESSORY:${equipmentProfile}:${days}`);
    if (program.training_items.some((x) => /BEHIND_NECK/.test(x.exercise_key))) failures.push(`REPOSTURE_BEHIND_NECK_DEFAULT:${equipmentProfile}:${days}`);
  }
}

// Energy gate should stay closed with incomplete measurable inputs.
{
  const p = profile({ goal: "MUSCLE_GAIN", focus: "BALANCED", experience: "INTERMEDIATE", equipmentProfile: "FULL_GYM", duration: 60, days: 4, completeEnergy: false });
  const program = buildFreeProgram(p.baseline, p.nutrition, p.training);
  if (program.nutrition_target.calorie_low !== null || program.nutrition_target.estimate_confidence !== "LIMITED") failures.push("ENERGY_GATE_FAILED");
}

const sampleProfile = profile({ goal: "MUSCLE_GAIN", focus: "REPOSTURE", experience: "EXPERIENCED", equipmentProfile: "FULL_GYM", duration: 60, days: 4 });
const sample = buildFreeProgram(sampleProfile.baseline, sampleProfile.nutrition, sampleProfile.training);

const failure_type_counts = failures.reduce((acc, x) => { const k = x.split(":").slice(0, 2).join(":"); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});

console.log(JSON.stringify({
  programs_tested: programs,
  failures: failures.length,
  failure_type_counts,
  failure_sample: failures.slice(0, 30),
  sample: {
    family: sample.family,
    focus: sample.focus_label,
    weekly_volume: sample.weekly_volume,
    day_1: sample.training_items.filter((x) => x.training_day === 1).map((x) => ({ exercise: x.metadata.display_name, sets: x.sets, reps: `${x.rep_min}-${x.rep_max}`, rir: x.target_rir, next: x.metadata.progression.action })),
  },
}, null, 2));

if (failures.length) process.exit(1);
