import type { AgeGroup } from "../../../../_lib/academy/constants";

export type Category = {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
};

export type Skill = {
  id: number;
  categoryId: number;
  name: string;
  ageGroup: AgeGroup | null;
  description: string | null;
};

export type Exercise = {
  id: number;
  skillId: number;
  skillIds: number[];
  name: string;
  videoUrl: string | null;
  difficulty: number | null;
  description: string | null;
  equipment: string[];
  minimumDuration: number | null;
};

export type ComboFilter = "either" | "single" | "combo";

export type LibraryFilters = {
  searchTerm: string;
  ageGroup: AgeGroup | "";
  exactAgeMatch: boolean;
  exerciseFilter: "all" | "has" | "none";
  difficultyMin: number | null;
  difficultyMax: number | null;
  equipment: string[];
  noEquipment: boolean;
  durationMin: number | null;
  durationMax: number | null;
  hasVideo: boolean | null;
  comboFilter: ComboFilter;
  categoryIds: number[];
};

export const DEFAULT_FILTERS: LibraryFilters = {
  searchTerm: "",
  ageGroup: "",
  exactAgeMatch: false,
  exerciseFilter: "all",
  difficultyMin: null,
  difficultyMax: null,
  equipment: [],
  noEquipment: false,
  durationMin: null,
  durationMax: null,
  hasVideo: null,
  comboFilter: "either",
  categoryIds: [],
};

export const EQUIPMENT_OPTIONS = [
  "Ball",
  "Cones",
  "Agility Ladder",
  "Goal",
  "Wall",
  "Mannequin",
  "Resistance Band",
  "Hurdles",
  "Poles",
  "Rebounder",
] as const;

export const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: "30s" },
  { value: 45, label: "45s" },
  { value: 60, label: "1m" },
  { value: 90, label: "1m 30s" },
  { value: 120, label: "2m" },
  { value: 150, label: "2m 30s" },
  { value: 180, label: "3m" },
];

export function getDurationLabel(value: number | null | undefined): string {
  if (value == null) return "Auto";
  const opt = DURATION_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : `${value}s`;
}
