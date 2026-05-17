import { en } from "./en";
import { ar } from "./ar";

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

const dictionaries = { en, ar } as const;

export const hasLocale = (locale: string): locale is Locale =>
  (LOCALES as readonly string[]).includes(locale);

export const getDictionary = (locale: Locale) => dictionaries[locale];

export type { Dict } from "./en";
