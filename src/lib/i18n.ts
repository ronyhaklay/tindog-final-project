export type Locale = "he" | "en";

export const DEFAULT_LOCALE: Locale = "he";
export const LOCALE_COOKIE = "tindog_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "he" || value === "en";
}

export function pick(locale: Locale, english: string, hebrew: string): string {
  return locale === "he" ? hebrew : english;
}

export function localeTag(locale: Locale): string {
  return locale === "he" ? "he-IL" : "en-US";
}

export function listingTypeLabel(locale: Locale, value: "adoption" | "foster") {
  return pick(locale, value === "adoption" ? "Adoption" : "Foster", value === "adoption" ? "אימוץ" : "אומנה");
}

export function dogSizeLabel(locale: Locale, value: "small" | "medium" | "large") {
  const en = { small: "Small (up to 10kg)", medium: "Medium (10-25kg)", large: "Large (25kg+)" } as const;
  const he = { small: "קטן (עד 10 ק״ג)", medium: "בינוני (10–25 ק״ג)", large: "גדול (25 ק״ג ומעלה)" } as const;
  return locale === "he" ? he[value] : en[value];
}

export function energyLevelLabel(locale: Locale, value: "low" | "medium" | "high") {
  const en = { low: "Calm", medium: "Balanced", high: "Very active" } as const;
  const he = { low: "רגוע", medium: "מאוזן", high: "אנרגטי מאוד" } as const;
  return locale === "he" ? he[value] : en[value];
}

export function householdTypeLabel(locale: Locale, value: "apartment" | "house") {
  const en = { apartment: "Apartment", house: "House" } as const;
  const he = { apartment: "דירה", house: "בית" } as const;
  return locale === "he" ? he[value] : en[value];
}

export function dogExperienceLabel(locale: Locale, value: "first_time" | "some" | "experienced") {
  const en = { first_time: "First-time adopter", some: "Some experience", experienced: "Experienced dog owner" } as const;
  const he = { first_time: "מאמץ/ת בפעם הראשונה", some: "יש לי קצת ניסיון", experienced: "בעל/ת ניסיון רב עם כלבים" } as const;
  return locale === "he" ? he[value] : en[value];
}
