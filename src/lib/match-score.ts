import type { Dog, Profile } from "./types";

export function computeMatchScore(profile: Profile | null, dog: Dog): number {
  if (!profile || profile.role !== "adopter") return 82;

  let score = 68;
  if (profile.preferred_size && profile.preferred_size === dog.size) score += 10;
  if (profile.activity_level && profile.activity_level === dog.energy_level) score += 10;
  if (profile.has_children) score += dog.good_with_kids ? 6 : -12;
  if (profile.has_other_pets) score += dog.good_with_dogs || dog.good_with_cats ? 5 : -8;
  if (profile.household_type === "apartment" && dog.size === "small") score += 3;
  if (profile.dog_experience === "first_time" && dog.energy_level === "low") score += 3;
  if (dog.house_trained) score += 2;
  if (dog.vaccinated) score += 1;

  return Math.max(42, Math.min(98, score));
}
