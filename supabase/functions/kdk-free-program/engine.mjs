import { EXERCISE_POOLS } from "./exercise-catalog.mjs";

export const ENGINE_VERSION = "FREE_ENGINE_V1.2";

const FOCUS_LABELS = {
  BALANCED: "Balanced",
  CHEST: "Chest Focus",
  BACK: "Back Focus",
  ARMS: "Arms Focus",
  LEGS: "Legs Focus",
  REPOSTURE: "Reposture Focus",
};

const MUSCLE_LABELS = {
  CHEST: "Chest",
  BACK: "Back",
  QUADS: "Quads",
  HAMSTRINGS: "Hamstrings",
  SHOULDERS: "Shoulders",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  CALVES: "Calves",
  CORE: "Core",
  ROTATOR_CUFF: "Rotator Cuff",
  LOWER_TRAP: "Lower Trap / Scapular",
};

const SESSION_LIMITS = {
  45: { exercises: 6, sets: 16 },
  60: { exercises: 7, sets: 20 },
  75: { exercises: 8, sets: 24 },
  90: { exercises: 9, sets: 28 },
};

function S(slot, muscle, importance = 2, focusBoost = false) {
  return { slot, muscle, importance, focusBoost };
}

const TEMPLATES = {
  FB2: [
    { label: "Full Body A", slots: [
      S("QUAD_COMPOUND", "QUADS", 1), S("CHEST_FLAT", "CHEST", 1), S("BACK_VERTICAL", "BACK", 1),
      S("HAMSTRING_CURL", "HAMSTRINGS", 2), S("BACK_HORIZONTAL", "BACK", 2), S("SHOULDER_LATERAL", "SHOULDERS", 3), S("TRICEPS", "TRICEPS", 3), S("CALVES", "CALVES", 4),
    ] },
    { label: "Full Body B", slots: [
      S("HIP_HINGE", "HAMSTRINGS", 1), S("CHEST_INCLINE", "CHEST", 1), S("BACK_HORIZONTAL", "BACK", 1),
      S("QUAD_COMPOUND", "QUADS", 2), S("BACK_VERTICAL", "BACK", 2), S("SHOULDER_LATERAL", "SHOULDERS", 3), S("BICEPS", "BICEPS", 3), S("CORE", "CORE", 4),
    ] },
  ],
  FB3: [
    { label: "Full Body A", slots: [
      S("QUAD_COMPOUND", "QUADS", 1), S("CHEST_FLAT", "CHEST", 1), S("BACK_VERTICAL", "BACK", 1),
      S("HAMSTRING_CURL", "HAMSTRINGS", 2), S("SHOULDER_LATERAL", "SHOULDERS", 3), S("TRICEPS", "TRICEPS", 4),
    ] },
    { label: "Full Body B", slots: [
      S("HIP_HINGE", "HAMSTRINGS", 1), S("BACK_HORIZONTAL", "BACK", 1), S("CHEST_INCLINE", "CHEST", 1),
      S("QUAD_COMPOUND", "QUADS", 2), S("BICEPS", "BICEPS", 4), S("CORE", "CORE", 4),
    ] },
    { label: "Full Body C", slots: [
      S("QUAD_COMPOUND", "QUADS", 1), S("BACK_VERTICAL", "BACK", 1), S("CHEST_FLAT", "CHEST", 1),
      S("HAMSTRING_CURL", "HAMSTRINGS", 2), S("BACK_HORIZONTAL", "BACK", 2), S("SHOULDER_LATERAL", "SHOULDERS", 3), S("TRICEPS", "TRICEPS", 3), S("CALVES", "CALVES", 4),
    ] },
  ],
  UL4: [
    { label: "Upper A", slots: [
      S("CHEST_FLAT", "CHEST", 1), S("BACK_VERTICAL", "BACK", 1), S("BACK_HORIZONTAL", "BACK", 1),
      S("CHEST_INCLINE", "CHEST", 2), S("SHOULDER_LATERAL", "SHOULDERS", 2), S("TRICEPS", "TRICEPS", 3), S("BICEPS", "BICEPS", 3),
    ] },
    { label: "Lower A", slots: [
      S("QUAD_COMPOUND", "QUADS", 1), S("HAMSTRING_CURL", "HAMSTRINGS", 1), S("HIP_HINGE", "HAMSTRINGS", 2),
      S("QUAD_ISOLATION", "QUADS", 2), S("CALVES", "CALVES", 3), S("CORE", "CORE", 4),
    ] },
    { label: "Upper B", slots: [
      S("CHEST_INCLINE", "CHEST", 1), S("BACK_HORIZONTAL", "BACK", 1), S("BACK_VERTICAL", "BACK", 1),
      S("CHEST_FLAT", "CHEST", 2), S("SHOULDER_LATERAL", "SHOULDERS", 2), S("BICEPS", "BICEPS", 3), S("TRICEPS", "TRICEPS", 3),
    ] },
    { label: "Lower B", slots: [
      S("HIP_HINGE", "HAMSTRINGS", 1), S("QUAD_COMPOUND", "QUADS", 1), S("HAMSTRING_CURL", "HAMSTRINGS", 2),
      S("QUAD_ISOLATION", "QUADS", 2), S("CALVES", "CALVES", 3), S("CORE", "CORE", 4),
    ] },
  ],
  ULF5: null,
  PPL6: [
    { label: "Push A", slots: [
      S("CHEST_FLAT", "CHEST", 1), S("CHEST_INCLINE", "CHEST", 1), S("SHOULDER_LATERAL", "SHOULDERS", 2),
      S("TRICEPS", "TRICEPS", 2),
    ] },
    { label: "Pull A", slots: [
      S("BACK_VERTICAL", "BACK", 1), S("BACK_HORIZONTAL", "BACK", 1), S("LAT_ISOLATION", "BACK", 2),
      S("REAR_DELT", "SHOULDERS", 3), S("BICEPS", "BICEPS", 2),
    ] },
    { label: "Legs A", slots: [
      S("QUAD_COMPOUND", "QUADS", 1), S("HAMSTRING_CURL", "HAMSTRINGS", 1), S("HIP_HINGE", "HAMSTRINGS", 2),
      S("QUAD_ISOLATION", "QUADS", 2), S("CALVES", "CALVES", 3), S("CORE", "CORE", 4),
    ] },
    { label: "Push B", slots: [
      S("CHEST_INCLINE", "CHEST", 1), S("CHEST_FLAT", "CHEST", 1), S("SHOULDER_LATERAL", "SHOULDERS", 2),
      S("TRICEPS", "TRICEPS", 2),
    ] },
    { label: "Pull B", slots: [
      S("BACK_HORIZONTAL", "BACK", 1), S("BACK_VERTICAL", "BACK", 1), S("LAT_ISOLATION", "BACK", 2),
      S("REAR_DELT", "SHOULDERS", 3), S("BICEPS", "BICEPS", 2),
    ] },
    { label: "Legs B", slots: [
      S("HIP_HINGE", "HAMSTRINGS", 1), S("QUAD_COMPOUND", "QUADS", 1), S("HAMSTRING_CURL", "HAMSTRINGS", 2),
      S("QUAD_ISOLATION", "QUADS", 2), S("CALVES", "CALVES", 3), S("CORE", "CORE", 4),
    ] },
  ],
};

function cloneTemplate(template) {
  return template.map((day) => ({ label: day.label, slots: day.slots.map((x) => ({ ...x })) }));
}

function normalizeFocus(trainingProfile) {
  const p = trainingProfile?.priority_muscles;
  let raw = null;
  if (typeof p === "string") raw = p;
  else if (Array.isArray(p)) raw = p[0];
  else if (p && typeof p === "object") raw = p.primary ?? p.focus ?? p.primary_focus ?? null;
  const value = String(raw ?? "BALANCED").toUpperCase();
  return Object.prototype.hasOwnProperty.call(FOCUS_LABELS, value) ? value : "BALANCED";
}

function numeric(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clampDays(value) {
  if (!Number.isFinite(value)) return 3;
  return Math.min(6, Math.max(2, Math.round(value)));
}

function normalizeDuration(value) {
  const n = numeric(value);
  if (n == null) return 60;
  if (n <= 45) return 45;
  if (n <= 60) return 60;
  if (n <= 75) return 75;
  return 90;
}

function familyKey(days) {
  if (days === 2) return "FB2";
  if (days === 3) return "FB3";
  if (days === 4) return "UL4";
  if (days === 5) return "ULF5";
  return "PPL6";
}

function familyName(days) {
  if (days === 2) return "Full Body A/B";
  if (days === 3) return "Full Body A/B/C";
  if (days === 4) return "Upper / Lower 4-Day";
  if (days === 5) return "Upper / Lower + Focus Day";
  return "Push / Pull / Legs ×2";
}

function buildFiveDayTemplate(focus) {
  const base = cloneTemplate(TEMPLATES.UL4);
  const focusDay = {
    BALANCED: { label: "Focus Day · Balanced", slots: [
      S("CHEST_ISOLATION", "CHEST", 1), S("BACK_HORIZONTAL", "BACK", 1), S("SHOULDER_LATERAL", "SHOULDERS", 1),
      S("BICEPS", "BICEPS", 2), S("TRICEPS", "TRICEPS", 2), S("QUAD_ISOLATION", "QUADS", 3),
    ] },
    CHEST: { label: "Focus Day · Chest", slots: [
      S("CHEST_FLAT", "CHEST", 1, true), S("CHEST_INCLINE", "CHEST", 1, true), S("CHEST_ISOLATION", "CHEST", 1, true),
      S("SHOULDER_LATERAL", "SHOULDERS", 2), S("TRICEPS", "TRICEPS", 2),
    ] },
    BACK: { label: "Focus Day · Back", slots: [
      S("BACK_VERTICAL", "BACK", 1, true), S("BACK_HORIZONTAL", "BACK", 1, true), S("LAT_ISOLATION", "BACK", 1, true),
      S("REAR_DELT", "SHOULDERS", 2), S("BICEPS", "BICEPS", 2),
    ] },
    ARMS: { label: "Focus Day · Arms", slots: [
      S("BICEPS", "BICEPS", 1, true), S("TRICEPS", "TRICEPS", 1, true), S("BICEPS", "BICEPS", 1, true),
      S("TRICEPS", "TRICEPS", 1, true), S("SHOULDER_LATERAL", "SHOULDERS", 2),
    ] },
    LEGS: { label: "Focus Day · Legs", slots: [
      S("QUAD_COMPOUND", "QUADS", 1, true), S("QUAD_ISOLATION", "QUADS", 1, true), S("HAMSTRING_CURL", "HAMSTRINGS", 1, true),
      S("HIP_HINGE", "HAMSTRINGS", 1, true), S("CALVES", "CALVES", 2, true),
    ] },
    REPOSTURE: { label: "Focus Day · Reposture", slots: [
      S("BACK_HORIZONTAL", "BACK", 1, true), S("POSTURE_ACCESSORY", "SHOULDERS", 1, true), S("LOWER_TRAP", "LOWER_TRAP", 1, true),
      S("EXTERNAL_ROTATION", "ROTATOR_CUFF", 1, true), S("REAR_DELT", "SHOULDERS", 2, true), S("CORE", "CORE", 3),
    ] },
  }[focus];
  return [...base, focusDay];
}

function focusMuscles(focus) {
  if (focus === "CHEST") return new Set(["CHEST"]);
  if (focus === "BACK") return new Set(["BACK"]);
  if (focus === "ARMS") return new Set(["BICEPS", "TRICEPS"]);
  if (focus === "LEGS") return new Set(["QUADS", "HAMSTRINGS", "CALVES"]);
  if (focus === "REPOSTURE") return new Set(["BACK", "SHOULDERS", "ROTATOR_CUFF", "LOWER_TRAP"]);
  return new Set();
}

function markFocusSlots(template, focus) {
  const muscles = focusMuscles(focus);
  return cloneTemplate(template).map((day) => ({
    ...day,
    slots: day.slots.map((slot) => muscles.has(slot.muscle) ? { ...slot, focusBoost: true, importance: 1 } : slot),
  }));
}

function countMuscleOccurrences(days, muscle) {
  return days.reduce((sum, day) => sum + day.slots.filter((slot) => slot.muscle === muscle).length, 0);
}

function countSlotOccurrences(days, slotName) {
  return days.reduce((sum, day) => sum + day.slots.filter((slot) => slot.slot === slotName).length, 0);
}

function addToLeastLoaded(days, dayIndexes, spec, count = 1) {
  for (let n = 0; n < count; n += 1) {
    const choices = dayIndexes
      .filter((index) => days[index])
      .map((index) => ({ index, length: days[index].slots.length, sameSlot: days[index].slots.some((slot) => slot.slot === spec.slot) ? 1 : 0 }))
      .sort((a, b) => a.sameSlot - b.sameSlot || a.length - b.length || a.index - b.index);
    if (!choices.length) return;
    days[choices[0].index].slots.push({ ...spec, focusBoost: true, importance: 1 });
  }
}

function injectFocus(template, focus, family, targetVolume) {
  const days = markFocusSlots(template, focus);
  if (focus === "BALANCED" || family === "ULF5") return days;

  const upperOrFull = days.map((d, i) => ({ d, i })).filter(({ d }) => /Upper|Full Body|Push|Pull/.test(d.label));
  const lowerOrFull = days.map((d, i) => ({ d, i })).filter(({ d }) => /Lower|Full Body|Legs/.test(d.label));
  const pushLike = upperOrFull.filter(({ d }) => !/Pull/.test(d.label)).map(({ i }) => i);
  const pullLike = upperOrFull.filter(({ d }) => !/Push/.test(d.label)).map(({ i }) => i);
  const lowerLike = lowerOrFull.map(({ i }) => i);

  const addForTarget = (muscle, slot, indexes) => {
    const current = countMuscleOccurrences(days, muscle);
    const desired = Math.ceil((targetVolume[muscle] ?? 0) / 4);
    const deficit = Math.max(0, desired - current);
    addToLeastLoaded(days, indexes, S(slot, muscle, 1, true), deficit);
  };

  if (focus === "CHEST") {
    addForTarget("CHEST", "CHEST_ISOLATION", pushLike);
  } else if (focus === "BACK") {
    addForTarget("BACK", "LAT_ISOLATION", pullLike);
  } else if (focus === "ARMS") {
    addForTarget("BICEPS", "BICEPS", pullLike.length ? pullLike : upperOrFull.map(({ i }) => i));
    addForTarget("TRICEPS", "TRICEPS", pushLike.length ? pushLike : upperOrFull.map(({ i }) => i));
  } else if (focus === "LEGS") {
    addForTarget("QUADS", "QUAD_ISOLATION", lowerLike);
    addForTarget("HAMSTRINGS", "HAMSTRING_CURL", lowerLike);
    addForTarget("CALVES", "CALVES", lowerLike);
  } else if (focus === "REPOSTURE") {
    let postureIdx = days.map((d, i) => ({ d, i })).filter(({ d }) => /Upper|Full Body|Pull/.test(d.label)).map(({ i }) => i);
    if (!postureIdx.length) postureIdx = upperOrFull.map(({ i }) => i);
    if (!postureIdx.length) postureIdx = days.map((_, i) => i);
    const supportIdx = days.map((_, i) => i);

    if (!countSlotOccurrences(days, "POSTURE_ACCESSORY")) addToLeastLoaded(days, postureIdx, S("POSTURE_ACCESSORY", "SHOULDERS", 1, true), 1);
    addForTarget("ROTATOR_CUFF", "EXTERNAL_ROTATION", supportIdx);
    addForTarget("LOWER_TRAP", "LOWER_TRAP", supportIdx);
    addForTarget("BACK", "LAT_ISOLATION", pullLike.length ? pullLike : postureIdx);
  }

  return days;
}

function baseVolumeTargets(experience) {
  if (experience === "BEGINNER") {
    return { CHEST: 6, BACK: 8, QUADS: 6, HAMSTRINGS: 4, SHOULDERS: 4, BICEPS: 4, TRICEPS: 4, CALVES: 3, CORE: 3, ROTATOR_CUFF: 0, LOWER_TRAP: 0 };
  }
  if (experience === "EXPERIENCED") {
    return { CHEST: 10, BACK: 12, QUADS: 10, HAMSTRINGS: 8, SHOULDERS: 8, BICEPS: 8, TRICEPS: 8, CALVES: 6, CORE: 4, ROTATOR_CUFF: 0, LOWER_TRAP: 0 };
  }
  return { CHEST: 8, BACK: 10, QUADS: 8, HAMSTRINGS: 6, SHOULDERS: 6, BICEPS: 6, TRICEPS: 6, CALVES: 4, CORE: 4, ROTATOR_CUFF: 0, LOWER_TRAP: 0 };
}

function volumeTargets(experience, focus) {
  const t = { ...baseVolumeTargets(experience) };
  const bonus = experience === "BEGINNER" ? 2 : experience === "EXPERIENCED" ? 4 : 4;
  if (focus === "CHEST") t.CHEST = Math.min(14, t.CHEST + bonus);
  if (focus === "BACK") t.BACK = Math.min(16, t.BACK + bonus);
  if (focus === "ARMS") {
    t.BICEPS = Math.min(12, t.BICEPS + bonus);
    t.TRICEPS = Math.min(12, t.TRICEPS + bonus);
  }
  if (focus === "LEGS") {
    t.QUADS = Math.min(14, t.QUADS + bonus);
    t.HAMSTRINGS = Math.min(12, t.HAMSTRINGS + Math.max(2, bonus - 1));
    t.CALVES = Math.min(8, t.CALVES + 2);
  }
  if (focus === "REPOSTURE") {
    t.BACK = Math.min(16, t.BACK + 2);
    t.SHOULDERS = Math.min(12, t.SHOULDERS + 2);
    t.ROTATOR_CUFF = experience === "BEGINNER" ? 4 : 6;
    t.LOWER_TRAP = experience === "BEGINNER" ? 4 : 6;
  }
  return t;
}


function capacityAdjustedTargets(rawTargets, focus, duration, days) {
  const raw = { ...rawTargets };
  const positiveMuscles = Object.keys(raw).filter((muscle) => (raw[muscle] ?? 0) > 0);
  const rawTotal = positiveMuscles.reduce((sum, muscle) => sum + raw[muscle], 0);
  const budget = Math.min(rawTotal, SESSION_LIMITS[duration].sets * days);
  if (budget >= rawTotal) return raw;

  const major = new Set(["CHEST", "BACK", "QUADS", "HAMSTRINGS"]);
  const support = new Set(["SHOULDERS", "BICEPS", "TRICEPS"]);
  const planned = {};
  for (const muscle of Object.keys(raw)) {
    const target = raw[muscle] ?? 0;
    if (!(target > 0)) { planned[muscle] = 0; continue; }
    let floor = 0;
    if (major.has(muscle)) floor = 4;
    else if (support.has(muscle)) floor = 2;
    else if (muscle === "CALVES" || muscle === "CORE") floor = 2;
    else if (muscle === "ROTATOR_CUFF" || muscle === "LOWER_TRAP") floor = 2;
    if (focus === "REPOSTURE" && (muscle === "CALVES" || muscle === "CORE")) floor = 0;
    planned[muscle] = Math.min(target, floor);
  }

  let used = Object.values(planned).reduce((sum, value) => sum + value, 0);
  let remaining = Math.max(0, budget - used);

  const focusOrder = focus === "CHEST" ? ["CHEST"]
    : focus === "BACK" ? ["BACK"]
    : focus === "ARMS" ? ["BICEPS", "TRICEPS"]
    : focus === "LEGS" ? ["QUADS", "HAMSTRINGS", "CALVES"]
    : focus === "REPOSTURE" ? ["ROTATOR_CUFF", "LOWER_TRAP", "BACK", "SHOULDERS"]
    : [];

  const fillRoundRobin = (order) => {
    let progressed = true;
    while (remaining > 0 && progressed) {
      progressed = false;
      for (const muscle of order) {
        if (remaining <= 0) break;
        if ((planned[muscle] ?? 0) < (raw[muscle] ?? 0)) {
          planned[muscle] = (planned[muscle] ?? 0) + 1;
          remaining -= 1;
          progressed = true;
        }
      }
    }
  };

  fillRoundRobin(focusOrder);
  const generalOrder = ["BACK", "CHEST", "QUADS", "HAMSTRINGS", "SHOULDERS", "BICEPS", "TRICEPS", "CALVES", "CORE", "ROTATOR_CUFF", "LOWER_TRAP"]
    .filter((muscle) => positiveMuscles.includes(muscle) && !focusOrder.includes(muscle));
  fillRoundRobin(generalOrder);
  if (remaining > 0) fillRoundRobin(positiveMuscles);

  return planned;
}

function trimExcessFrequency(template, targets, focus) {
  const days = cloneTemplate(template);
  const protectedSlots = focus === "REPOSTURE" ? new Set(["POSTURE_ACCESSORY", "EXTERNAL_ROTATION", "LOWER_TRAP"]) : new Set();

  const countMuscle = (muscle) => days.reduce((sum, day) => sum + day.slots.filter((slot) => slot.muscle === muscle).length, 0);
  const countSlot = (slotName) => days.reduce((sum, day) => sum + day.slots.filter((slot) => slot.slot === slotName).length, 0);

  for (const [muscle, target] of Object.entries(targets)) {
    const maxOccurrences = target > 0 ? Math.max(1, Math.floor(target / 2)) : 0;
    while (countMuscle(muscle) > maxOccurrences) {
      const candidates = [];
      days.forEach((day, dayIndex) => {
        day.slots.forEach((slot, slotIndex) => {
          if (slot.muscle !== muscle) return;
          if (protectedSlots.has(slot.slot) && countSlot(slot.slot) <= 1) return;
          candidates.push({ dayIndex, slotIndex, slot, dayLength: day.slots.length });
        });
      });
      if (!candidates.length) break;
      candidates.sort((a, b) => {
        if (a.slot.focusBoost !== b.slot.focusBoost) return Number(a.slot.focusBoost) - Number(b.slot.focusBoost);
        if (a.slot.importance !== b.slot.importance) return b.slot.importance - a.slot.importance;
        if (a.dayLength !== b.dayLength) return b.dayLength - a.dayLength;
        return b.slotIndex - a.slotIndex;
      });
      days[candidates[0].dayIndex].slots.splice(candidates[0].slotIndex, 1);
    }
  }
  return days;
}

function trimToSession(template, duration, focus) {
  const { exercises } = SESSION_LIMITS[duration];
  const days = cloneTemplate(template);
  const dayCount = days.length;
  const focusSet = focusMuscles(focus);
  const major = new Set(["CHEST", "BACK", "QUADS", "HAMSTRINGS"]);
  const support = new Set(["SHOULDERS", "BICEPS", "TRICEPS"]);
  const optional = new Set(["CALVES", "CORE"]);
  const requiredSlots = focus === "REPOSTURE" ? new Set(["POSTURE_ACCESSORY", "EXTERNAL_ROTATION", "LOWER_TRAP"]) : new Set();

  const muscleCounts = () => {
    const counts = new Map();
    days.flatMap((day) => day.slots).forEach((slot) => counts.set(slot.muscle, (counts.get(slot.muscle) ?? 0) + 1));
    return counts;
  };
  const slotCounts = () => {
    const counts = new Map();
    days.flatMap((day) => day.slots).forEach((slot) => counts.set(slot.slot, (counts.get(slot.slot) ?? 0) + 1));
    return counts;
  };

  const baseMin = (muscle, current) => {
    let minimum = 0;
    if (major.has(muscle)) minimum = dayCount === 2 ? 1 : 2;
    else if (support.has(muscle)) minimum = 1;
    else if (optional.has(muscle)) minimum = dayCount >= 3 ? 1 : 0;
    else if (muscle === "ROTATOR_CUFF" || muscle === "LOWER_TRAP") minimum = focus === "REPOSTURE" ? 1 : 0;

    if (focusSet.has(muscle)) {
      if (focus === "CHEST" && muscle === "CHEST") minimum += 1;
      else if (focus === "BACK" && muscle === "BACK") minimum += 1;
      else if (focus === "ARMS" && (muscle === "BICEPS" || muscle === "TRICEPS")) minimum += 1;
      else if (focus === "LEGS" && (muscle === "QUADS" || muscle === "HAMSTRINGS")) minimum += 1;
      else if (focus === "LEGS" && muscle === "CALVES") minimum = Math.max(minimum, 1);
      else if (focus === "REPOSTURE" && muscle === "BACK") minimum += 1;
    }
    return Math.min(current, minimum);
  };

  for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
    while (days[dayIndex].slots.length > exercises) {
      const mCounts = muscleCounts();
      const sCounts = slotCounts();
      const candidates = days[dayIndex].slots.map((slot, index) => {
        const current = mCounts.get(slot.muscle) ?? 0;
        const minimum = baseMin(slot.muscle, current);
        const breaksMuscleFloor = current - 1 < minimum;
        const breaksRoleFloor = requiredSlots.has(slot.slot) && (sCounts.get(slot.slot) ?? 0) <= 1;
        const protectedFloor = breaksMuscleFloor || breaksRoleFloor;
        const focusPenalty = slot.focusBoost || focusSet.has(slot.muscle) ? 1 : 0;
        const redundancy = Math.max(0, current - minimum);
        return { slot, index, protectedFloor, focusPenalty, redundancy };
      }).sort((a, b) => {
        if (a.protectedFloor !== b.protectedFloor) return Number(a.protectedFloor) - Number(b.protectedFloor);
        if (a.focusPenalty !== b.focusPenalty) return a.focusPenalty - b.focusPenalty;
        if (a.redundancy !== b.redundancy) return b.redundancy - a.redundancy;
        if (a.slot.importance !== b.slot.importance) return b.slot.importance - a.slot.importance;
        return b.index - a.index;
      });
      if (!candidates.length) break;
      days[dayIndex].slots.splice(candidates[0].index, 1);
    }
  }
  return days;
}

function prescription(experience, slot, sets) {
  const isolation = ["CHEST_ISOLATION", "LAT_ISOLATION", "REAR_DELT", "POSTURE_ACCESSORY", "EXTERNAL_ROTATION", "LOWER_TRAP", "QUAD_ISOLATION", "HAMSTRING_CURL", "SHOULDER_LATERAL", "BICEPS", "TRICEPS", "CALVES", "CORE"].includes(slot);
  const compound = !isolation;
  let targetRir = 2;
  if (experience === "BEGINNER") targetRir = 3;
  else if (experience === "EXPERIENCED" && isolation) targetRir = 1;

  let repMin = compound ? (experience === "BEGINNER" ? 8 : 6) : 10;
  let repMax = compound ? 12 : 20;
  if (slot === "CORE") { repMin = 8; repMax = 15; }
  if (slot === "EXTERNAL_ROTATION") { repMin = 12; repMax = 20; }
  if (slot === "LOWER_TRAP" || slot === "POSTURE_ACCESSORY") { repMin = 10; repMax = 20; }
  return { sets, rep_min: repMin, rep_max: repMax, target_rir: targetRir };
}

function selectExercise(pool, slot, occurrence, avoidKeys = new Set()) {
  const options = pool[slot];
  if (!options?.length) throw new Error(`NO_EXERCISE_POOL:${slot}`);
  const start = occurrence % options.length;
  const ordered = options.map((_, offset) => options[(start + offset) % options.length]);
  const exercise = ordered.find((option) => !avoidKeys.has(option.key)) ?? ordered[0];
  const alternatives = ordered.filter((option) => option.key !== exercise.key).slice(0, 2);
  return { exercise, alternatives };
}

function allocateSets(template, targets) {
  const counts = new Map();
  template.flatMap((d) => d.slots).forEach((s) => counts.set(s.muscle, (counts.get(s.muscle) ?? 0) + 1));
  const seen = new Map();
  return template.map((day) => ({
    ...day,
    slots: day.slots.map((spec) => {
      const total = counts.get(spec.muscle) ?? 1;
      const target = targets[spec.muscle] ?? total * 2;
      const already = seen.get(spec.muscle) ?? 0;
      const base = Math.floor(target / total);
      const remainder = target % total;
      const sets = Math.min(4, Math.max(2, base + (already < remainder ? 1 : 0)));
      seen.set(spec.muscle, already + 1);
      return { ...spec, sets };
    }),
  }));
}

function enforceDailySetCap(template, duration) {
  const cap = SESSION_LIMITS[duration].sets;
  return template.map((day) => {
    const slots = day.slots.map((s) => ({ ...s }));
    let total = slots.reduce((sum, s) => sum + s.sets, 0);
    while (total > cap) {
      const candidates = slots
        .map((slot, index) => ({ slot, index }))
        .filter(({ slot }) => slot.sets > 2)
        .sort((a, b) => {
          const boost = Number(a.slot.focusBoost) - Number(b.slot.focusBoost); // non-focus first
          if (boost) return boost;
          const importance = b.slot.importance - a.slot.importance; // lower-priority first
          if (importance) return importance;
          return b.slot.sets - a.slot.sets;
        });
      if (!candidates.length) break;
      slots[candidates[0].index].sets -= 1;
      total -= 1;
    }
    return { ...day, slots };
  });
}

function round50(value) {
  return Math.round(value / 50) * 50;
}

function calculateEnergy(b, n, t, days) {
  const weightKg = numeric(b.weight_kg);
  const heightCm = numeric(b.height_cm);
  const ageYears = numeric(b.age_years);
  const bfPct = numeric(b.body_fat_pct);
  const steps = numeric(n?.average_steps);
  const sessionDuration = numeric(t?.session_duration_min);
  const sex = b.sex;

  const missing = [];
  if (weightKg == null || weightKg <= 0) missing.push("weight");
  const canUseFfm = weightKg != null && bfPct != null && bfPct >= 5 && bfPct <= 60;
  const canUseMifflin = weightKg != null && heightCm != null && ageYears != null && (sex === "MALE" || sex === "FEMALE");
  if (!canUseFfm && !canUseMifflin) missing.push("height + age + sex (or usable body-fat %)");
  if (steps == null || steps < 0) missing.push("average steps");
  if (sessionDuration == null || sessionDuration <= 0) missing.push("session duration");

  if (missing.length || weightKg == null || steps == null || sessionDuration == null) {
    return { maintenance_low: null, maintenance_high: null, calorie_low: null, calorie_high: null, estimate_confidence: "LIMITED", basis: null, missing_inputs: missing };
  }

  let ree;
  let basis;
  if (canUseFfm) {
    const ffm = weightKg * (1 - bfPct / 100);
    ree = 500 + 22 * ffm;
    basis = "FFM-based REE + measurable activity range";
  } else {
    ree = 10 * weightKg + 6.25 * Number(heightCm) - 5 * Number(ageYears) + (sex === "MALE" ? 5 : -161);
    basis = "REE equation + measurable activity range";
  }

  const stepLow = steps * weightKg * 0.0003;
  const stepHigh = steps * weightKg * 0.0005;
  const trainingLow = ((3.5 - 1) * 3.5 * weightKg / 200) * sessionDuration * days / 7;
  const trainingHigh = ((6.0 - 1) * 3.5 * weightKg / 200) * sessionDuration * days / 7;
  const cardioMinutes = Math.max(0, numeric(n?.cardio_minutes_per_week) ?? 0);
  const cardioLow = ((4.0 - 1) * 3.5 * weightKg / 200) * cardioMinutes / 7;
  const cardioHigh = ((8.0 - 1) * 3.5 * weightKg / 200) * cardioMinutes / 7;

  const maintenanceLow = round50((ree + stepLow + trainingLow + cardioLow) * 1.08);
  const maintenanceHigh = round50((ree + stepHigh + trainingHigh + cardioHigh) * 1.18);
  let calorieLow = maintenanceLow;
  let calorieHigh = maintenanceHigh;
  if (b.goal === "FAT_LOSS") { calorieLow = round50(maintenanceLow * 0.85); calorieHigh = round50(maintenanceHigh * 0.90); }
  else if (b.goal === "MUSCLE_GAIN") { calorieLow = round50(maintenanceLow * 1.02); calorieHigh = round50(maintenanceHigh * 1.08); }
  else if (b.goal === "RECOMPOSITION") { calorieLow = round50(maintenanceLow * 0.95); calorieHigh = round50(maintenanceHigh * 1.02); }

  return {
    maintenance_low: Math.min(maintenanceLow, maintenanceHigh), maintenance_high: Math.max(maintenanceLow, maintenanceHigh),
    calorie_low: Math.min(calorieLow, calorieHigh), calorie_high: Math.max(calorieLow, calorieHigh),
    estimate_confidence: "MODERATE", basis, missing_inputs: [],
  };
}

function nextRule(exercise, repMax, targetRir) {
  const rule = exercise.load_rule;
  if (rule.mode === "VARIATION_OR_LOAD") {
    return { trigger: `ทุก working set ถึง ${repMax} reps ที่ประมาณ RIR ${targetRir}`, action: rule.label, increment_pct_low: null, increment_pct_high: null };
  }
  return {
    trigger: `ทุก working set ถึง ${repMax} reps ที่ประมาณ RIR ${targetRir}`,
    action: `เพิ่มน้ำหนัก ${rule.label}`,
    increment_pct_low: rule.low,
    increment_pct_high: rule.high,
  };
}

function buildDecisionTrace({ days, focus, duration, family, guideTargetVolume, targetVolume, actualVolume }) {
  return {
    engine_version: ENGINE_VERSION,
    family,
    training_days: days,
    primary_focus: focus,
    session_duration_min: duration,
    guide_target_direct_sets: guideTargetVolume,
    planned_direct_sets: targetVolume,
    actual_direct_sets: actualVolume,
    policy: "DETERMINISTIC_FREE_FOUNDATION",
    pro_extension_ready: true,
  };
}

export function buildFreeProgram(b, n = null, t = null) {
  const days = clampDays(Number(b.training_days_per_week));
  const duration = normalizeDuration(t?.session_duration_min);
  const focus = normalizeFocus(t);
  const fKey = familyKey(days);
  const guideTargetVolume = volumeTargets(b.training_experience, focus);
  const targetVolume = capacityAdjustedTargets(guideTargetVolume, focus, duration, days);
  let template = fKey === "ULF5" ? buildFiveDayTemplate(focus) : cloneTemplate(TEMPLATES[fKey]);
  template = injectFocus(template, focus, fKey, targetVolume);
  template = trimExcessFrequency(template, targetVolume, focus);
  template = trimToSession(template, duration, focus);
  template = allocateSets(template, targetVolume);
  template = enforceDailySetCap(template, duration);

  const pool = EXERCISE_POOLS[b.equipment_profile] ?? EXERCISE_POOLS.FULL_GYM;
  const slotSeen = new Map();
  const trainingItems = [];
  template.forEach((day, dayIndex) => {
    const usedExerciseKeys = new Set();
    day.slots.forEach((spec, order) => {
      const occurrence = slotSeen.get(spec.slot) ?? 0;
      const { exercise, alternatives } = selectExercise(pool, spec.slot, occurrence, usedExerciseKeys);
      slotSeen.set(spec.slot, occurrence + 1);
      usedExerciseKeys.add(exercise.key);
      const rx = prescription(b.training_experience, spec.slot, spec.sets);
      const progression = nextRule(exercise, rx.rep_max, rx.target_rir);
      trainingItems.push({
        training_day: dayIndex + 1,
        movement_slot: spec.slot,
        exercise_key: exercise.key,
        sets: rx.sets,
        rep_min: rx.rep_min,
        rep_max: rx.rep_max,
        target_rir: rx.target_rir,
        display_order: order + 1,
        metadata: {
          display_name: exercise.name,
          day_label: day.label,
          target_label: exercise.target,
          primary_muscle: spec.muscle,
          focus_boost: Boolean(spec.focusBoost),
          alternatives: alternatives.map((a) => ({ key: a.key, name: a.name })),
          alternative_name: alternatives[0]?.name ?? null,
          progression,
          visual_key: exercise.visual_key,
          visual_status: "PLANNED_PROFESSIONAL_MOTION_CARD",
          exercise_attributes: exercise.attributes,
          engine_version: ENGINE_VERSION,
        },
      });
    });
  });

  const weeklyVolume = trainingItems.reduce((acc, item) => {
    const muscle = item.metadata.primary_muscle;
    acc[muscle] = (acc[muscle] ?? 0) + item.sets;
    return acc;
  }, {});

  const weightKg = Number(b.weight_kg);
  const proteinLowG = Number.isFinite(weightKg) ? Math.round(weightKg * 1.6) : null;
  const proteinHighG = Number.isFinite(weightKg) ? Math.round(weightKg * 2.0) : null;
  const energy = calculateEnergy(b, n, t, days);
  const family = familyName(days);
  const focusLabel = FOCUS_LABELS[focus];

  const nutritionTarget = {
    maintenance_low: energy.maintenance_low,
    maintenance_high: energy.maintenance_high,
    calorie_low: energy.calorie_low,
    calorie_high: energy.calorie_high,
    protein_low_g: proteinLowG,
    protein_high_g: proteinHighG,
    fat_min_g: null,
    carb_target_g: null,
    estimate_confidence: energy.estimate_confidence,
  };

  const decisionTrace = buildDecisionTrace({ days, focus, duration, family, guideTargetVolume, targetVolume, actualVolume: weeklyVolume });
  const goalSnapshot = {
    goal: b.goal,
    weight_kg: Number.isFinite(weightKg) ? weightKg : null,
    height_cm: b.height_cm == null ? null : Number(b.height_cm),
    age_years: b.age_years,
    sex: b.sex,
    training_experience: b.training_experience,
    training_days_per_week: days,
    equipment_profile: b.equipment_profile,
    body_fat_pct: b.body_fat_pct == null ? null : Number(b.body_fat_pct),
    body_fat_method: b.body_fat_method,
    average_steps: n?.average_steps ?? null,
    cardio_minutes_per_week: n?.cardio_minutes_per_week ?? null,
    cardio_type: n?.cardio_type ?? null,
    meal_frequency: n?.meal_frequency ?? null,
    current_calories: n?.current_calories == null ? null : Number(n.current_calories),
    session_duration_min: duration,
    primary_focus: focus,
    focus_label: focusLabel,
    engine_version: ENGINE_VERSION,
    program_family: family,
    weekly_volume: weeklyVolume,
    decision_trace: decisionTrace,
    energy_estimate: { confidence: energy.estimate_confidence, basis: energy.basis, missing_inputs: energy.missing_inputs },
  };

  return {
    engine_version: ENGINE_VERSION,
    family,
    focus,
    focus_label: focusLabel,
    days,
    session_duration_min: duration,
    training_items: trainingItems,
    weekly_volume: weeklyVolume,
    energy_estimate: goalSnapshot.energy_estimate,
    nutrition_target: nutritionTarget,
    goal_snapshot: goalSnapshot,
    guardrails: [
      "Starting bodybuilding prescription; observed response has authority over the starting dose.",
      "Focus changes direct weekly sets and exercise allocation; it is not random variation.",
      "Lab data is reserved for PRO candidate ranking and never overrides actual exercise response.",
      ...(focus === "REPOSTURE" ? ["Reposture is an upper-back / scapular / rotator-cuff training emphasis, not a diagnosis or rehabilitation plan."] : []),
    ],
  };
}

export function validateFreeProgram(program) {
  const errors = [];
  const duration = normalizeDuration(program.session_duration_min);
  const limits = SESSION_LIMITS[duration];
  const byDay = new Map();
  for (const item of program.training_items ?? []) {
    if (!(item.sets >= 2 && item.sets <= 4)) errors.push(`SETS_OUT_OF_RANGE:${item.exercise_key}:${item.sets}`);
    if (!(item.rep_min > 0 && item.rep_max >= item.rep_min)) errors.push(`REP_RANGE_INVALID:${item.exercise_key}`);
    if (!(item.target_rir >= 1 && item.target_rir <= 3)) errors.push(`RIR_INVALID:${item.exercise_key}`);
    if (!item.metadata?.visual_key) errors.push(`VISUAL_KEY_MISSING:${item.exercise_key}`);
    if (!item.metadata?.progression?.trigger) errors.push(`PROGRESSION_MISSING:${item.exercise_key}`);
    const list = byDay.get(item.training_day) ?? [];
    list.push(item);
    byDay.set(item.training_day, list);
  }
  for (const [day, items] of byDay.entries()) {
    if (items.length > limits.exercises) errors.push(`TOO_MANY_EXERCISES:DAY${day}:${items.length}`);
    const sets = items.reduce((sum, item) => sum + item.sets, 0);
    if (sets > limits.sets) errors.push(`TOO_MANY_SETS:DAY${day}:${sets}`);
    const keys = items.map((x) => x.exercise_key);
    if (new Set(keys).size !== keys.length) errors.push(`DUPLICATE_EXERCISE:DAY${day}`);
  }
  return { ok: errors.length === 0, errors };
}

export const INTERNALS = { FOCUS_LABELS, MUSCLE_LABELS, SESSION_LIMITS, volumeTargets, normalizeFocus, normalizeDuration, familyName };
