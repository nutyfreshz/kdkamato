export type Goal = "FAT_LOSS" | "MUSCLE_GAIN" | "RECOMPOSITION" | "GENERAL_FITNESS";
export type Experience = "BEGINNER" | "INTERMEDIATE" | "EXPERIENCED";
export type Equipment = "FULL_GYM" | "LIMITED_GYM" | "HOME_BASIC";

export type ProgramInput = {
  goal: Goal;
  weightKg: number;
  heightCm?: number | null;
  ageYears?: number | null;
  sex?: "MALE" | "FEMALE" | null;
  trainingExperience: Experience;
  trainingDaysPerWeek: number;
  equipmentProfile: Equipment;
  averageSteps?: number | null;
  bodyFatPct?: number | null;
  mealFrequency?: number | null;
};

export type ProgramExercise = {
  day: number;
  slot: string;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  targetRir: number;
};

export type ProgramPreview = {
  family: string;
  days: number;
  exercises: ProgramExercise[];
  nutrition: {
    status: "ESTIMATE_READY" | "NEEDS_MORE_INPUT";
    message: string;
    proteinLowG: number;
    proteinHighG: number;
  };
  guardrails: string[];
};
