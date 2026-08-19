export const LISTING_TYPES = ["adoption", "foster"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  adoption: "Adoption",
  foster: "Foster",
};

export const DOG_SIZES = ["small", "medium", "large"] as const;
export type DogSize = (typeof DOG_SIZES)[number];

export const DOG_SIZE_LABELS: Record<DogSize, string> = {
  small: "Small (up to 10kg)",
  medium: "Medium (10-25kg)",
  large: "Large (25kg+)",
};

export const ENERGY_LEVELS = ["low", "medium", "high"] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export const ENERGY_LEVEL_LABELS: Record<EnergyLevel, string> = {
  low: "Calm",
  medium: "Balanced",
  high: "Very active",
};

export const USER_ROLES = ["adopter", "shelter_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  adopter: "I want to adopt",
  shelter_admin: "I represent a shelter / rescue",
};

// Kept for backwards compatibility with the first TinDog schema.
export const ACCOUNT_MODES = ["adopter", "lister", "both"] as const;
export type AccountMode = (typeof ACCOUNT_MODES)[number];
export const ACCOUNT_MODE_LABELS: Record<AccountMode, string> = {
  adopter: "I want to adopt",
  lister: "I want to list dogs",
  both: "Both",
};

export const HOUSEHOLD_TYPES = ["apartment", "house"] as const;
export type HouseholdType = (typeof HOUSEHOLD_TYPES)[number];

export const HOUSEHOLD_TYPE_LABELS: Record<HouseholdType, string> = {
  apartment: "Apartment",
  house: "House",
};

export const DOG_EXPERIENCE_LEVELS = ["first_time", "some", "experienced"] as const;
export type DogExperience = (typeof DOG_EXPERIENCE_LEVELS)[number];

export const DOG_EXPERIENCE_LABELS: Record<DogExperience, string> = {
  first_time: "First-time adopter",
  some: "Some experience",
  experienced: "Experienced dog owner",
};

export const REQUEST_STATUSES = ["pending", "approved", "declined"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const MAX_PHOTOS_PER_DOG = 6;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 35 * 1024 * 1024;
export const MAX_AUDIO_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_BARK_SECONDS = 12;
export const DECK_PAGE_SIZE = 10;
export const MESSAGES_PAGE_SIZE = 50;
export const STORAGE_BUCKET = "dog-photos";
export const DOG_MEDIA_BUCKET = "dog-media";
