import type {
  DogSize,
  EnergyLevel,
  ListingType,
  RequestStatus,
} from "./constants";

// Row types mirroring the Supabase schema (supabase/migrations/0001_init.sql).

export interface Profile {
  id: string;
  display_name: string;
  city: string | null;
  avatar_url: string | null;
  bio: string | null;
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

// Shape returned by the get_swipe_deck() Postgres function:
// a dog joined with its photos and the owner's display name.
export interface DeckDog extends Dog {
  photo_paths: string[];
  owner_name: string;
}

export interface DogWithPhotos extends Dog {
  dog_photos: DogPhoto[];
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
