export const LOAD_RULES = {
  MACHINE_COMPOUND: { mode: "PERCENT", low: 3, high: 5, label: "+3–5%" },
  BARBELL_COMPOUND: { mode: "PERCENT", low: 2, high: 3, label: "+2–3%" },
  DUMBBELL_COMPOUND: { mode: "SMALLEST_INCREMENT", low: 2, high: 5, label: "smallest available increment (~2–5%)" },
  ISOLATION: { mode: "SMALLEST_INCREMENT", low: 2, high: 5, label: "smallest available increment (~2–5%)" },
  BODYWEIGHT: { mode: "VARIATION_OR_LOAD", low: null, high: null, label: "harder variation or small external load" },
};

function ex(key, name, target, loadRule, visualKey, attributes = {}) {
  return { key, name, target, load_rule: LOAD_RULES[loadRule], visual_key: visualKey, attributes };
}

export const EXERCISE_POOLS = {
  FULL_GYM: {
    CHEST_FLAT: [
      ex("MACHINE_CHEST_PRESS", "Machine Chest Press", "Chest", "MACHINE_COMPOUND", "machine-chest-press", { support: "HIGH", pattern: "HORIZONTAL_PRESS" }),
      ex("SMITH_BENCH_PRESS", "Smith Bench Press", "Chest", "BARBELL_COMPOUND", "smith-bench-press", { support: "MODERATE", pattern: "HORIZONTAL_PRESS" }),
      ex("DB_BENCH_PRESS", "Dumbbell Bench Press", "Chest", "DUMBBELL_COMPOUND", "db-bench-press", { support: "LOW", pattern: "HORIZONTAL_PRESS" }),
    ],
    CHEST_INCLINE: [
      ex("INCLINE_MACHINE_PRESS", "Incline Machine Press", "Upper Chest", "MACHINE_COMPOUND", "incline-machine-press", { support: "HIGH", pattern: "INCLINE_PRESS" }),
      ex("INCLINE_SMITH_PRESS", "Incline Smith Press", "Upper Chest", "BARBELL_COMPOUND", "incline-smith-press", { support: "MODERATE", pattern: "INCLINE_PRESS" }),
      ex("INCLINE_DB_PRESS", "Incline Dumbbell Press", "Upper Chest", "DUMBBELL_COMPOUND", "incline-db-press", { support: "LOW", pattern: "INCLINE_PRESS" }),
    ],
    CHEST_ISOLATION: [
      ex("CABLE_FLY", "Cable Fly", "Chest", "ISOLATION", "cable-fly", { support: "MODERATE", pattern: "CHEST_ADDUCTION" }),
      ex("PEC_DECK", "Pec Deck", "Chest", "ISOLATION", "pec-deck", { support: "HIGH", pattern: "CHEST_ADDUCTION" }),
      ex("MACHINE_FLY", "Machine Fly", "Chest", "ISOLATION", "machine-fly", { support: "HIGH", pattern: "CHEST_ADDUCTION" }),
    ],
    BACK_VERTICAL: [
      ex("LAT_PULLDOWN", "Lat Pulldown", "Lats / Upper Back", "MACHINE_COMPOUND", "lat-pulldown", { support: "HIGH", pattern: "VERTICAL_PULL" }),
      ex("MACHINE_PULLDOWN", "Machine Pulldown", "Lats", "MACHINE_COMPOUND", "machine-pulldown", { support: "HIGH", pattern: "VERTICAL_PULL" }),
      ex("ASSISTED_PULLUP", "Assisted Pull-up", "Lats / Upper Back", "MACHINE_COMPOUND", "assisted-pullup", { support: "MODERATE", pattern: "VERTICAL_PULL" }),
    ],
    BACK_HORIZONTAL: [
      ex("CHEST_SUPPORTED_ROW", "Chest-Supported Row", "Mid / Upper Back", "MACHINE_COMPOUND", "chest-supported-row", { support: "HIGH", pattern: "HORIZONTAL_PULL" }),
      ex("MACHINE_ROW", "Machine Row", "Mid Back", "MACHINE_COMPOUND", "machine-row", { support: "HIGH", pattern: "HORIZONTAL_PULL" }),
      ex("CABLE_ROW", "Cable Row", "Mid Back", "MACHINE_COMPOUND", "cable-row", { support: "MODERATE", pattern: "HORIZONTAL_PULL" }),
    ],
    LAT_ISOLATION: [
      ex("STRAIGHT_ARM_PULLDOWN", "Straight-Arm Pulldown", "Lats", "ISOLATION", "straight-arm-pulldown", { support: "MODERATE", pattern: "SHOULDER_EXTENSION" }),
      ex("MACHINE_PULLOVER", "Machine Pullover", "Lats", "ISOLATION", "machine-pullover", { support: "HIGH", pattern: "SHOULDER_EXTENSION" }),
      ex("CABLE_PULLOVER", "Cable Pullover", "Lats", "ISOLATION", "cable-pullover", { support: "MODERATE", pattern: "SHOULDER_EXTENSION" }),
    ],
    REAR_DELT: [
      ex("REVERSE_PEC_DECK", "Reverse Pec Deck", "Rear Delts / Upper Back", "ISOLATION", "reverse-pec-deck", { support: "HIGH", pattern: "REAR_DELT" }),
      ex("CABLE_REAR_DELT_FLY", "Cable Rear-Delt Fly", "Rear Delts", "ISOLATION", "cable-rear-delt-fly", { support: "MODERATE", pattern: "REAR_DELT" }),
    ],
    POSTURE_ACCESSORY: [
      ex("CABLE_FACE_PULL", "Cable Face Pull", "Rear Delts / External Rotators / Upper Back", "ISOLATION", "cable-face-pull", { support: "MODERATE", pattern: "FACE_PULL", posture_support: true }),
      ex("WIDE_GRIP_CABLE_UPRIGHT_ROW", "Wide-Grip Cable Upright Row", "Delts / Traps", "ISOLATION", "wide-grip-cable-upright-row", { support: "MODERATE", pattern: "UPRIGHT_ROW", posture_support: true, tolerance_sensitive: true, execution_note: "Wide grip; stop around shoulder height; use only if comfortable." }),
      ex("REVERSE_PEC_DECK", "Reverse Pec Deck", "Rear Delts / Upper Back", "ISOLATION", "reverse-pec-deck", { support: "HIGH", pattern: "REAR_DELT", posture_support: true }),
    ],
    EXTERNAL_ROTATION: [
      ex("CABLE_EXTERNAL_ROTATION", "Cable External Rotation", "Rotator Cuff", "ISOLATION", "cable-external-rotation", { support: "MODERATE", pattern: "EXTERNAL_ROTATION", posture_support: true }),
      ex("SIDE_LYING_DB_EXTERNAL_ROTATION", "Side-Lying Dumbbell External Rotation", "Rotator Cuff", "ISOLATION", "side-lying-db-external-rotation", { support: "LOW", pattern: "EXTERNAL_ROTATION", posture_support: true }),
      ex("BAND_EXTERNAL_ROTATION", "Band External Rotation", "Rotator Cuff", "ISOLATION", "band-external-rotation", { support: "LOW", pattern: "EXTERNAL_ROTATION", posture_support: true }),
    ],
    LOWER_TRAP: [
      ex("CABLE_Y_RAISE", "Cable Y Raise", "Lower Traps / Scapular Upward Rotation", "ISOLATION", "cable-y-raise", { support: "MODERATE", pattern: "Y_RAISE", posture_support: true }),
      ex("INCLINE_BENCH_Y_RAISE", "Incline Bench Y Raise", "Lower Traps", "ISOLATION", "incline-bench-y-raise", { support: "LOW", pattern: "Y_RAISE", posture_support: true }),
      ex("PRONE_Y_RAISE", "Prone Y Raise", "Lower Traps", "BODYWEIGHT", "prone-y-raise", { support: "LOW", pattern: "Y_RAISE", posture_support: true }),
    ],
    QUAD_COMPOUND: [
      ex("HACK_SQUAT", "Hack Squat", "Quads", "MACHINE_COMPOUND", "hack-squat", { support: "HIGH", pattern: "KNEE_DOMINANT" }),
      ex("LEG_PRESS", "Leg Press", "Quads", "MACHINE_COMPOUND", "leg-press", { support: "HIGH", pattern: "KNEE_DOMINANT" }),
      ex("SMITH_SQUAT", "Smith Squat", "Quads / Glutes", "BARBELL_COMPOUND", "smith-squat", { support: "MODERATE", pattern: "KNEE_DOMINANT" }),
    ],
    QUAD_ISOLATION: [
      ex("LEG_EXTENSION", "Leg Extension", "Quads", "ISOLATION", "leg-extension", { support: "HIGH", pattern: "KNEE_EXTENSION" }),
      ex("SINGLE_LEG_EXTENSION", "Single-Leg Extension", "Quads", "ISOLATION", "single-leg-extension", { support: "HIGH", pattern: "KNEE_EXTENSION" }),
    ],
    HAMSTRING_CURL: [
      ex("SEATED_LEG_CURL", "Seated Leg Curl", "Hamstrings", "ISOLATION", "seated-leg-curl", { support: "HIGH", pattern: "KNEE_FLEXION" }),
      ex("LYING_LEG_CURL", "Lying Leg Curl", "Hamstrings", "ISOLATION", "lying-leg-curl", { support: "HIGH", pattern: "KNEE_FLEXION" }),
    ],
    HIP_HINGE: [
      ex("ROMANIAN_DEADLIFT", "Romanian Deadlift", "Hamstrings / Glutes", "BARBELL_COMPOUND", "romanian-deadlift", { support: "LOW", pattern: "HIP_HINGE" }),
      ex("SMITH_RDL", "Smith Romanian Deadlift", "Hamstrings / Glutes", "BARBELL_COMPOUND", "smith-rdl", { support: "MODERATE", pattern: "HIP_HINGE" }),
      ex("HIP_EXTENSION_45", "45° Hip Extension", "Hamstrings / Glutes", "DUMBBELL_COMPOUND", "45-hip-extension", { support: "MODERATE", pattern: "HIP_EXTENSION" }),
    ],
    SHOULDER_LATERAL: [
      ex("CABLE_LATERAL_RAISE", "Cable Lateral Raise", "Side Delts", "ISOLATION", "cable-lateral-raise", { support: "MODERATE", pattern: "SHOULDER_ABDUCTION" }),
      ex("MACHINE_LATERAL_RAISE", "Machine Lateral Raise", "Side Delts", "ISOLATION", "machine-lateral-raise", { support: "HIGH", pattern: "SHOULDER_ABDUCTION" }),
      ex("DB_LATERAL_RAISE", "Dumbbell Lateral Raise", "Side Delts", "ISOLATION", "db-lateral-raise", { support: "LOW", pattern: "SHOULDER_ABDUCTION" }),
    ],
    BICEPS: [
      ex("CABLE_CURL", "Cable Curl", "Biceps", "ISOLATION", "cable-curl", { support: "MODERATE", pattern: "ELBOW_FLEXION" }),
      ex("MACHINE_PREACHER_CURL", "Machine Preacher Curl", "Biceps", "ISOLATION", "machine-preacher-curl", { support: "HIGH", pattern: "ELBOW_FLEXION" }),
      ex("INCLINE_DB_CURL", "Incline Dumbbell Curl", "Biceps", "ISOLATION", "incline-db-curl", { support: "LOW", pattern: "ELBOW_FLEXION" }),
    ],
    TRICEPS: [
      ex("CABLE_PRESSDOWN", "Cable Pressdown", "Triceps", "ISOLATION", "cable-pressdown", { support: "MODERATE", pattern: "ELBOW_EXTENSION" }),
      ex("OVERHEAD_CABLE_EXTENSION", "Overhead Cable Extension", "Triceps", "ISOLATION", "overhead-cable-extension", { support: "MODERATE", pattern: "ELBOW_EXTENSION" }),
      ex("MACHINE_DIP", "Machine Dip", "Triceps / Chest", "MACHINE_COMPOUND", "machine-dip", { support: "HIGH", pattern: "PRESS" }),
    ],
    CALVES: [
      ex("SEATED_CALF_RAISE", "Seated Calf Raise", "Calves", "ISOLATION", "seated-calf-raise", { support: "HIGH", pattern: "PLANTAR_FLEXION" }),
      ex("STANDING_CALF_RAISE", "Standing Calf Raise", "Calves", "ISOLATION", "standing-calf-raise", { support: "HIGH", pattern: "PLANTAR_FLEXION" }),
    ],
    CORE: [
      ex("CABLE_CRUNCH", "Cable Crunch", "Core", "ISOLATION", "cable-crunch", { support: "MODERATE", pattern: "TRUNK_FLEXION" }),
      ex("PALLOF_PRESS", "Pallof Press", "Core Stability", "ISOLATION", "pallof-press", { support: "MODERATE", pattern: "ANTI_ROTATION" }),
    ],
  },

  LIMITED_GYM: {
    CHEST_FLAT: [
      ex("DUMBBELL_PRESS", "Dumbbell Press", "Chest", "DUMBBELL_COMPOUND", "dumbbell-press", { support: "LOW", pattern: "HORIZONTAL_PRESS" }),
      ex("PUSHUP", "Push-up", "Chest / Triceps", "BODYWEIGHT", "pushup", { support: "LOW", pattern: "HORIZONTAL_PRESS" }),
    ],
    CHEST_INCLINE: [
      ex("INCLINE_DB_PRESS", "Incline Dumbbell Press", "Upper Chest", "DUMBBELL_COMPOUND", "incline-db-press", { support: "LOW", pattern: "INCLINE_PRESS" }),
      ex("LOW_INCLINE_PUSHUP", "Low-Incline Push-up", "Chest", "BODYWEIGHT", "low-incline-pushup", { support: "LOW", pattern: "HORIZONTAL_PRESS" }),
    ],
    CHEST_ISOLATION: [
      ex("CABLE_FLY", "Cable Fly", "Chest", "ISOLATION", "cable-fly", { support: "MODERATE", pattern: "CHEST_ADDUCTION" }),
      ex("DB_SQUEEZE_PRESS", "Dumbbell Squeeze Press", "Chest", "DUMBBELL_COMPOUND", "db-squeeze-press", { support: "LOW", pattern: "HORIZONTAL_PRESS" }),
    ],
    BACK_VERTICAL: [
      ex("ASSISTED_PULLUP_OR_PULLDOWN", "Assisted Pull-up / Pulldown", "Lats / Upper Back", "MACHINE_COMPOUND", "assisted-pullup-pulldown", { support: "MODERATE", pattern: "VERTICAL_PULL" }),
      ex("LAT_PULLDOWN", "Lat Pulldown", "Lats", "MACHINE_COMPOUND", "lat-pulldown", { support: "HIGH", pattern: "VERTICAL_PULL" }),
    ],
    BACK_HORIZONTAL: [
      ex("CABLE_ROW", "Cable Row", "Mid Back", "MACHINE_COMPOUND", "cable-row", { support: "MODERATE", pattern: "HORIZONTAL_PULL" }),
      ex("ONE_ARM_DB_ROW", "One-Arm Dumbbell Row", "Lats / Mid Back", "DUMBBELL_COMPOUND", "one-arm-db-row", { support: "LOW", pattern: "HORIZONTAL_PULL" }),
    ],
    LAT_ISOLATION: [
      ex("CABLE_PULLOVER", "Cable Pullover", "Lats", "ISOLATION", "cable-pullover", { support: "MODERATE", pattern: "SHOULDER_EXTENSION" }),
      ex("BAND_STRAIGHT_ARM_PULLDOWN", "Band Straight-Arm Pulldown", "Lats", "ISOLATION", "band-straight-arm-pulldown", { support: "LOW", pattern: "SHOULDER_EXTENSION" }),
    ],
    REAR_DELT: [
      ex("CABLE_REAR_DELT_FLY", "Cable Rear-Delt Fly", "Rear Delts", "ISOLATION", "cable-rear-delt-fly", { support: "MODERATE", pattern: "REAR_DELT" }),
      ex("DB_REAR_DELT_RAISE", "Dumbbell Rear-Delt Raise", "Rear Delts", "ISOLATION", "db-rear-delt-raise", { support: "LOW", pattern: "REAR_DELT" }),
    ],
    POSTURE_ACCESSORY: [
      ex("BAND_FACE_PULL", "Band Face Pull", "Rear Delts / External Rotators / Upper Back", "ISOLATION", "band-face-pull", { support: "LOW", pattern: "FACE_PULL", posture_support: true }),
      ex("WIDE_GRIP_CABLE_UPRIGHT_ROW", "Wide-Grip Cable Upright Row", "Delts / Traps", "ISOLATION", "wide-grip-cable-upright-row", { support: "MODERATE", pattern: "UPRIGHT_ROW", posture_support: true, tolerance_sensitive: true, execution_note: "Wide grip; stop around shoulder height; use only if comfortable." }),
      ex("DB_REAR_DELT_ROW", "Dumbbell Rear-Delt Row", "Rear Delts / Upper Back", "DUMBBELL_COMPOUND", "db-rear-delt-row", { support: "LOW", pattern: "REAR_DELT_ROW", posture_support: true }),
    ],
    EXTERNAL_ROTATION: [
      ex("BAND_EXTERNAL_ROTATION", "Band External Rotation", "Rotator Cuff", "ISOLATION", "band-external-rotation", { support: "LOW", pattern: "EXTERNAL_ROTATION", posture_support: true }),
      ex("SIDE_LYING_DB_EXTERNAL_ROTATION", "Side-Lying Dumbbell External Rotation", "Rotator Cuff", "ISOLATION", "side-lying-db-external-rotation", { support: "LOW", pattern: "EXTERNAL_ROTATION", posture_support: true }),
    ],
    LOWER_TRAP: [
      ex("INCLINE_BENCH_Y_RAISE", "Incline Bench Y Raise", "Lower Traps", "ISOLATION", "incline-bench-y-raise", { support: "LOW", pattern: "Y_RAISE", posture_support: true }),
      ex("PRONE_Y_RAISE", "Prone Y Raise", "Lower Traps", "BODYWEIGHT", "prone-y-raise", { support: "LOW", pattern: "Y_RAISE", posture_support: true }),
      ex("BAND_Y_RAISE", "Band Y Raise", "Lower Traps / Scapular Control", "ISOLATION", "band-y-raise", { support: "LOW", pattern: "Y_RAISE", posture_support: true }),
    ],
    QUAD_COMPOUND: [
      ex("LEG_PRESS", "Leg Press", "Quads", "MACHINE_COMPOUND", "leg-press", { support: "HIGH", pattern: "KNEE_DOMINANT" }),
      ex("HEEL_ELEVATED_DB_SQUAT", "Heel-Elevated Dumbbell Squat", "Quads", "DUMBBELL_COMPOUND", "heel-elevated-db-squat", { support: "LOW", pattern: "KNEE_DOMINANT" }),
      ex("DB_SPLIT_SQUAT", "Dumbbell Split Squat", "Quads / Glutes", "DUMBBELL_COMPOUND", "db-split-squat", { support: "LOW", pattern: "KNEE_DOMINANT" }),
    ],
    QUAD_ISOLATION: [
      ex("LEG_EXTENSION", "Leg Extension", "Quads", "ISOLATION", "leg-extension", { support: "HIGH", pattern: "KNEE_EXTENSION" }),
      ex("REVERSE_NORDIC", "Reverse Nordic", "Quads", "BODYWEIGHT", "reverse-nordic", { support: "LOW", pattern: "KNEE_EXTENSION" }),
    ],
    HAMSTRING_CURL: [
      ex("SEATED_LEG_CURL", "Seated Leg Curl", "Hamstrings", "ISOLATION", "seated-leg-curl", { support: "HIGH", pattern: "KNEE_FLEXION" }),
      ex("SLIDER_LEG_CURL", "Slider Leg Curl", "Hamstrings", "BODYWEIGHT", "slider-leg-curl", { support: "LOW", pattern: "KNEE_FLEXION" }),
    ],
    HIP_HINGE: [
      ex("ROMANIAN_DEADLIFT", "Romanian Deadlift", "Hamstrings / Glutes", "BARBELL_COMPOUND", "romanian-deadlift", { support: "LOW", pattern: "HIP_HINGE" }),
      ex("DB_ROMANIAN_DEADLIFT", "Dumbbell Romanian Deadlift", "Hamstrings / Glutes", "DUMBBELL_COMPOUND", "db-rdl", { support: "LOW", pattern: "HIP_HINGE" }),
      ex("DB_HIP_THRUST", "Dumbbell Hip Thrust", "Glutes / Hip Extensors", "DUMBBELL_COMPOUND", "db-hip-thrust", { support: "MODERATE", pattern: "HIP_EXTENSION" }),
    ],
    SHOULDER_LATERAL: [
      ex("DUMBBELL_LATERAL_RAISE", "Dumbbell Lateral Raise", "Side Delts", "ISOLATION", "db-lateral-raise", { support: "LOW", pattern: "SHOULDER_ABDUCTION" }),
      ex("CABLE_LATERAL_RAISE", "Cable Lateral Raise", "Side Delts", "ISOLATION", "cable-lateral-raise", { support: "MODERATE", pattern: "SHOULDER_ABDUCTION" }),
    ],
    BICEPS: [
      ex("DB_CURL", "Dumbbell Curl", "Biceps", "ISOLATION", "db-curl", { support: "LOW", pattern: "ELBOW_FLEXION" }),
      ex("HAMMER_CURL", "Hammer Curl", "Biceps / Brachialis", "ISOLATION", "hammer-curl", { support: "LOW", pattern: "ELBOW_FLEXION" }),
    ],
    TRICEPS: [
      ex("CABLE_PRESSDOWN", "Cable Pressdown", "Triceps", "ISOLATION", "cable-pressdown", { support: "MODERATE", pattern: "ELBOW_EXTENSION" }),
      ex("OVERHEAD_DB_EXTENSION", "Overhead Dumbbell Extension", "Triceps", "ISOLATION", "overhead-db-extension", { support: "LOW", pattern: "ELBOW_EXTENSION" }),
    ],
    CALVES: [
      ex("DB_STANDING_CALF_RAISE", "Dumbbell Standing Calf Raise", "Calves", "ISOLATION", "db-standing-calf-raise", { support: "LOW", pattern: "PLANTAR_FLEXION" }),
    ],
    CORE: [
      ex("DEAD_BUG", "Dead Bug", "Core Stability", "BODYWEIGHT", "dead-bug", { support: "LOW", pattern: "ANTI_EXTENSION" }),
      ex("PLANK", "Plank", "Core Stability", "BODYWEIGHT", "plank", { support: "LOW", pattern: "ANTI_EXTENSION" }),
    ],
  },

  HOME_BASIC: {
    CHEST_FLAT: [
      ex("DB_FLOOR_PRESS", "Dumbbell Floor Press", "Chest / Triceps", "DUMBBELL_COMPOUND", "db-floor-press", { support: "HIGH", pattern: "HORIZONTAL_PRESS" }),
      ex("PUSHUP", "Push-up", "Chest / Triceps", "BODYWEIGHT", "pushup", { support: "LOW", pattern: "HORIZONTAL_PRESS" }),
    ],
    CHEST_INCLINE: [
      ex("FEET_ELEVATED_PUSHUP", "Feet-Elevated Push-up", "Upper Chest / Shoulders", "BODYWEIGHT", "feet-elevated-pushup", { support: "LOW", pattern: "INCLINE_PRESS" }),
      ex("DB_FLOOR_PRESS", "Dumbbell Floor Press", "Chest / Triceps", "DUMBBELL_COMPOUND", "db-floor-press", { support: "HIGH", pattern: "HORIZONTAL_PRESS" }),
    ],
    CHEST_ISOLATION: [
      ex("BAND_FLY", "Band Fly", "Chest", "ISOLATION", "band-fly", { support: "LOW", pattern: "CHEST_ADDUCTION" }),
      ex("DB_SQUEEZE_PRESS", "Dumbbell Squeeze Press", "Chest", "DUMBBELL_COMPOUND", "db-squeeze-press", { support: "LOW", pattern: "HORIZONTAL_PRESS" }),
    ],
    BACK_VERTICAL: [
      ex("BAND_OR_ASSISTED_PULLUP", "Band / Assisted Pull-up", "Lats / Upper Back", "BODYWEIGHT", "band-assisted-pullup", { support: "LOW", pattern: "VERTICAL_PULL" }),
      ex("BAND_LAT_PULLDOWN", "Band Lat Pulldown", "Lats", "ISOLATION", "band-lat-pulldown", { support: "LOW", pattern: "VERTICAL_PULL" }),
    ],
    BACK_HORIZONTAL: [
      ex("ONE_ARM_DB_ROW", "One-Arm Dumbbell Row", "Lats / Mid Back", "DUMBBELL_COMPOUND", "one-arm-db-row", { support: "LOW", pattern: "HORIZONTAL_PULL" }),
      ex("BAND_ROW", "Band Row", "Mid Back", "ISOLATION", "band-row", { support: "LOW", pattern: "HORIZONTAL_PULL" }),
    ],
    LAT_ISOLATION: [
      ex("BAND_STRAIGHT_ARM_PULLDOWN", "Band Straight-Arm Pulldown", "Lats", "ISOLATION", "band-straight-arm-pulldown", { support: "LOW", pattern: "SHOULDER_EXTENSION" }),
      ex("DB_PULLOVER", "Dumbbell Pullover", "Lats / Chest", "DUMBBELL_COMPOUND", "db-pullover", { support: "LOW", pattern: "SHOULDER_EXTENSION" }),
    ],
    REAR_DELT: [
      ex("DB_REAR_DELT_RAISE", "Dumbbell Rear-Delt Raise", "Rear Delts", "ISOLATION", "db-rear-delt-raise", { support: "LOW", pattern: "REAR_DELT" }),
      ex("BAND_REAR_DELT_FLY", "Band Rear-Delt Fly", "Rear Delts", "ISOLATION", "band-rear-delt-fly", { support: "LOW", pattern: "REAR_DELT" }),
    ],
    POSTURE_ACCESSORY: [
      ex("BAND_FACE_PULL", "Band Face Pull", "Rear Delts / External Rotators / Upper Back", "ISOLATION", "band-face-pull", { support: "LOW", pattern: "FACE_PULL", posture_support: true }),
      ex("BAND_HIGH_ROW", "Band High Row", "Rear Delts / Upper Back", "ISOLATION", "band-high-row", { support: "LOW", pattern: "HIGH_ROW", posture_support: true }),
      ex("DB_REAR_DELT_ROW", "Dumbbell Rear-Delt Row", "Rear Delts / Upper Back", "DUMBBELL_COMPOUND", "db-rear-delt-row", { support: "LOW", pattern: "REAR_DELT_ROW", posture_support: true }),
    ],
    EXTERNAL_ROTATION: [
      ex("BAND_EXTERNAL_ROTATION", "Band External Rotation", "Rotator Cuff", "ISOLATION", "band-external-rotation", { support: "LOW", pattern: "EXTERNAL_ROTATION", posture_support: true }),
      ex("SIDE_LYING_DB_EXTERNAL_ROTATION", "Side-Lying Dumbbell External Rotation", "Rotator Cuff", "ISOLATION", "side-lying-db-external-rotation", { support: "LOW", pattern: "EXTERNAL_ROTATION", posture_support: true }),
    ],
    LOWER_TRAP: [
      ex("PRONE_Y_RAISE", "Prone Y Raise", "Lower Traps", "BODYWEIGHT", "prone-y-raise", { support: "LOW", pattern: "Y_RAISE", posture_support: true }),
      ex("BAND_Y_RAISE", "Band Y Raise", "Lower Traps / Scapular Control", "ISOLATION", "band-y-raise", { support: "LOW", pattern: "Y_RAISE", posture_support: true }),
    ],
    QUAD_COMPOUND: [
      ex("HEEL_ELEVATED_GOBLET_SQUAT", "Heel-Elevated Goblet Squat", "Quads", "DUMBBELL_COMPOUND", "heel-elevated-goblet-squat", { support: "LOW", pattern: "KNEE_DOMINANT" }),
      ex("DB_SPLIT_SQUAT", "Dumbbell Split Squat", "Quads / Glutes", "DUMBBELL_COMPOUND", "db-split-squat", { support: "LOW", pattern: "KNEE_DOMINANT" }),
      ex("REVERSE_LUNGE", "Reverse Lunge", "Quads / Glutes", "DUMBBELL_COMPOUND", "reverse-lunge", { support: "LOW", pattern: "KNEE_DOMINANT" }),
    ],
    QUAD_ISOLATION: [
      ex("BAND_LEG_EXTENSION", "Band Leg Extension", "Quads", "ISOLATION", "band-leg-extension", { support: "LOW", pattern: "KNEE_EXTENSION" }),
      ex("REVERSE_NORDIC", "Reverse Nordic", "Quads", "BODYWEIGHT", "reverse-nordic", { support: "LOW", pattern: "KNEE_EXTENSION" }),
    ],
    HAMSTRING_CURL: [
      ex("SLIDER_LEG_CURL", "Slider Leg Curl", "Hamstrings", "BODYWEIGHT", "slider-leg-curl", { support: "LOW", pattern: "KNEE_FLEXION" }),
      ex("BAND_LEG_CURL", "Band Leg Curl", "Hamstrings", "ISOLATION", "band-leg-curl", { support: "LOW", pattern: "KNEE_FLEXION" }),
    ],
    HIP_HINGE: [
      ex("DB_ROMANIAN_DEADLIFT", "Dumbbell Romanian Deadlift", "Hamstrings / Glutes", "DUMBBELL_COMPOUND", "db-rdl", { support: "LOW", pattern: "HIP_HINGE" }),
      ex("DB_HIP_THRUST", "Dumbbell Hip Thrust", "Glutes / Hip Extensors", "DUMBBELL_COMPOUND", "db-hip-thrust", { support: "MODERATE", pattern: "HIP_EXTENSION" }),
    ],
    SHOULDER_LATERAL: [
      ex("DUMBBELL_LATERAL_RAISE", "Dumbbell Lateral Raise", "Side Delts", "ISOLATION", "db-lateral-raise", { support: "LOW", pattern: "SHOULDER_ABDUCTION" }),
      ex("BAND_LATERAL_RAISE", "Band Lateral Raise", "Side Delts", "ISOLATION", "band-lateral-raise", { support: "LOW", pattern: "SHOULDER_ABDUCTION" }),
    ],
    BICEPS: [
      ex("DB_CURL", "Dumbbell Curl", "Biceps", "ISOLATION", "db-curl", { support: "LOW", pattern: "ELBOW_FLEXION" }),
      ex("HAMMER_CURL", "Hammer Curl", "Biceps / Brachialis", "ISOLATION", "hammer-curl", { support: "LOW", pattern: "ELBOW_FLEXION" }),
    ],
    TRICEPS: [
      ex("DB_TRICEPS_EXTENSION", "Dumbbell Triceps Extension", "Triceps", "ISOLATION", "db-triceps-extension", { support: "LOW", pattern: "ELBOW_EXTENSION" }),
      ex("CLOSE_GRIP_PUSHUP", "Close-Grip Push-up", "Triceps", "BODYWEIGHT", "close-grip-pushup", { support: "LOW", pattern: "PRESS" }),
    ],
    CALVES: [
      ex("SINGLE_LEG_CALF_RAISE", "Single-Leg Calf Raise", "Calves", "BODYWEIGHT", "single-leg-calf-raise", { support: "LOW", pattern: "PLANTAR_FLEXION" }),
    ],
    CORE: [
      ex("DEAD_BUG", "Dead Bug", "Core Stability", "BODYWEIGHT", "dead-bug", { support: "LOW", pattern: "ANTI_EXTENSION" }),
      ex("PLANK", "Plank", "Core Stability", "BODYWEIGHT", "plank", { support: "LOW", pattern: "ANTI_EXTENSION" }),
    ],
  },
};
