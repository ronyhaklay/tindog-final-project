import type {
  AccountMode,
  DogExperience,
  DogSize,
  EnergyLevel,
  HouseholdType,
  ListingType,
  RequestStatus,
} from "./constants";

export interface Profile {
  id: string;
  display_name: string;
  city: string | null;
  avatar_url: string | null;
  bio: string | null;
  account_mode: AccountMode;
  household_type: HouseholdType | null;
  has_children: boolean;
  has_other_pets: boolean;
  activity_level: EnergyLevel | null;
  preferred_size: DogSize | null;
  dog_experience: DogExperience | null;
  created_at: string;
}

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  age_years: number;
  size: DogSize;
  energy_level: EnergyLevel;
  temperament: string | null;
  special_needs: string | null;
  description: string | null;
  listing_type: ListingType;
  city: string;
  is_active: boolean;
  created_at: string;
  gender: "female" | "male" | null;
  good_with_kids: boolean;
  good_with_dogs: boolean;
  good_with_cats: boolean;
  house_trained: boolean;
  vaccinated: boolean;
  neutered: boolean;
}

export interface DogPhoto {
  id: string;
  dog_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  dog_id: string;
  direction: "like" | "pass";
  created_at: string;
}

export interface MatchRequest {
  id: string;
  dog_id: string;
  requester_id: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface DeckDog extends Dog {
  photo_paths: string[];
  owner_name: string;
  is_favorited: boolean;
}

export interface DogWithPhotos extends Dog {
  dog_photos: DogPhoto[];
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
