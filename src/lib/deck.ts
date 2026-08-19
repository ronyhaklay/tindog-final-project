import type { DeckDog } from "./types";
import type { Locale } from "./i18n";

// Pure deck helpers - kept free of React/Supabase so they are easy
// to unit test (see src/lib/__tests__/deck.test.ts).

// Removes a swiped dog and returns the new deck.
export function removeFromDeck(deck: DeckDog[], dogId: string): DeckDog[] {
  return deck.filter((d) => d.id !== dogId);
}

// Merges a freshly fetched batch into the current deck, skipping
// duplicates and dogs the user swiped locally in this session.
export function mergeDeck(
  current: DeckDog[],
  incoming: DeckDog[],
  locallySwipedIds: Set<string>
): DeckDog[] {
  const known = new Set(current.map((d) => d.id));
  const fresh = incoming.filter(
    (d) => !known.has(d.id) && !locallySwipedIds.has(d.id)
  );
  return [...current, ...fresh];
}

// Should we fetch the next page? (deck running low)
export function shouldRefill(deck: DeckDog[], threshold = 3): boolean {
  return deck.length <= threshold;
}

// "6 months" / "1 year" / "2.5 years"
export function formatAge(ageYears: number, locale: Locale = "en"): string {
  if (ageYears < 1) {
    const months = Math.round(ageYears * 12);
    if (locale === "he") return `${months} ${months === 1 ? "חודש" : "חודשים"}`;
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  const rounded = Number.isInteger(ageYears) ? ageYears : ageYears.toFixed(1);
  if (locale === "he") return `${rounded} ${ageYears === 1 ? "שנה" : "שנים"}`;
  return `${rounded} year${ageYears === 1 ? "" : "s"}`;
}
