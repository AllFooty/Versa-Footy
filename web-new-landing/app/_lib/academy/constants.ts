export const AGE_GROUPS = [
  "U-7",
  "U-8",
  "U-9",
  "U-10",
  "U-11",
  "U-12",
  "U-13",
  "U-14",
  "U-15+",
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];
