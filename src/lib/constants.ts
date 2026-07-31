export const LISTING_TYPES = ["adoption", "foster", "playdate"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  adoption: "Adoption",
  foster: "Foster",
  playdate: "Playdate",
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
  low: "Couch potato",
  medium: "Balanced",
  high: "Ball of energy",
};

export const REQUEST_STATUSES = ["pending", "approved", "declined"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const MAX_PHOTOS_PER_DOG = 5;
export const MAX_PHOTO_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
export const DECK_PAGE_SIZE = 10;
export const MESSAGES_PAGE_SIZE = 50;
export const STORAGE_BUCKET = "dog-photos";
