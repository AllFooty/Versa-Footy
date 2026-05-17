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

export type LibraryFilters = {
  searchTerm: string;
  ageGroup: AgeGroup | "";
  exactAgeMatch: boolean;
  exerciseFilter: "all" | "has" | "none";
};

export const DEFAULT_FILTERS: LibraryFilters = {
  searchTerm: "",
  ageGroup: "",
  exactAgeMatch: false,
  exerciseFilter: "all",
};
