import { describe, expect, it } from "vitest";
import { formatAge, mergeDeck, removeFromDeck, shouldRefill } from "../deck";
import type { DeckDog } from "../types";

function dog(id: string): DeckDog {
  return {
    id,
    owner_id: "owner-1",
    name: `Dog ${id}`,
    breed: null,
    age_years: 2,
    size: "medium",
    energy_level: "medium",
    temperament: null,
    special_needs: null,
    description: null,
    listing_type: "adoption",
    city: "Tel Aviv",
    is_active: true,
    created_at: new Date().toISOString(),
  gender: "male",
  good_with_kids: true,
  good_with_dogs: true,
  good_with_cats: false,
  house_trained: true,
  vaccinated: true,
  neutered: true,
    video_path: null,
    bark_audio_path: null,
    photo_paths: [],
    owner_name: "Owner",
    shelter_name: "Demo Rescue",
    shelter_verified: false,
    is_favorited: false,
  };
}

describe("removeFromDeck", () => {
  it("removes only the swiped dog", () => {
    const deck = [dog("a"), dog("b"), dog("c")];
    const next = removeFromDeck(deck, "b");
    expect(next.map((d) => d.id)).toEqual(["a", "c"]);
  });

  it("is a no-op for an unknown id", () => {
    const deck = [dog("a")];
    expect(removeFromDeck(deck, "zzz")).toHaveLength(1);
  });
});

describe("mergeDeck", () => {
  it("appends only new dogs", () => {
    const current = [dog("a"), dog("b")];
    const incoming = [dog("b"), dog("c")];
    const next = mergeDeck(current, incoming, new Set());
    expect(next.map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("skips dogs that were swiped locally in this session", () => {
    const current = [dog("a")];
    const incoming = [dog("b"), dog("c")];
    const next = mergeDeck(current, incoming, new Set(["b"]));
    expect(next.map((d) => d.id)).toEqual(["a", "c"]);
  });
});

describe("shouldRefill", () => {
  it("asks for more cards when the deck is low", () => {
    expect(shouldRefill([dog("a")], 3)).toBe(true);
    expect(shouldRefill([], 3)).toBe(true);
  });

  it("does not refill a full deck", () => {
    const deck = [dog("a"), dog("b"), dog("c"), dog("d")];
    expect(shouldRefill(deck, 3)).toBe(false);
  });
});

describe("formatAge", () => {
  it("formats puppies in months", () => {
    expect(formatAge(0.5)).toBe("6 months");
  });

  it("formats a single month", () => {
    expect(formatAge(0.08)).toBe("1 month");
  });

  it("formats whole years", () => {
    expect(formatAge(1)).toBe("1 year");
    expect(formatAge(3)).toBe("3 years");
  });

  it("formats fractional years", () => {
    expect(formatAge(2.5)).toBe("2.5 years");
  });
});
