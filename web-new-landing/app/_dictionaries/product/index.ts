import { productEn, type ProductDict } from "./en";
import { productAr } from "./ar";
import type { Locale } from "..";

const productDictionaries = { en: productEn, ar: productAr } as const;

export const getProductDictionary = (locale: Locale): ProductDict =>
  productDictionaries[locale];

export type { ProductDict };
