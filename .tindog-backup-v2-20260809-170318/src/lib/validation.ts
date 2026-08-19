import { z } from "zod";
import {
  ACCOUNT_MODES,
  DOG_EXPERIENCE_LEVELS,
  DOG_SIZES,
  ENERGY_LEVELS,
  HOUSEHOLD_TYPES,
  LISTING_TYPES,
} from "./constants";

export const signupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  accountMode: z.enum(ACCOUNT_MODES).default("adopter"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  city: z.string().trim().max(60, "City is too long").optional().default(""),
  bio: z.string().trim().max(300, "Bio must be at most 300 characters").optional().default(""),
  accountMode: z.enum(ACCOUNT_MODES).default("adopter"),
  householdType: z.enum(HOUSEHOLD_TYPES).optional().or(z.literal("")),
  hasChildren: z.coerce.boolean().default(false),
  hasOtherPets: z.coerce.boolean().default(false),
  activityLevel: z.enum(ENERGY_LEVELS).optional().or(z.literal("")),
  preferredSize: z.enum(DOG_SIZES).optional().or(z.literal("")),
  dogExperience: z.enum(DOG_EXPERIENCE_LEVELS).optional().or(z.literal("")),
});

export const dogSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dog name is required")
    .max(40, "Name must be at most 40 characters"),
  breed: z.string().trim().max(60, "Breed is too long").optional().default(""),
  ageYears: z.coerce
    .number({ message: "Age must be a number" })
    .min(0, "Age cannot be negative")
    .max(25, "Age must be realistic (0-25)"),
  size: z.enum(DOG_SIZES, { message: "Invalid size" }),
  energyLevel: z.enum(ENERGY_LEVELS, { message: "Invalid energy level" }),
  gender: z.enum(["female", "male"]).optional().or(z.literal("")),
  temperament: z
    .string()
    .trim()
    .max(200, "Temperament must be at most 200 characters")
    .optional()
    .default(""),
  specialNeeds: z
    .string()
    .trim()
    .max(300, "Special needs must be at most 300 characters")
    .optional()
    .default(""),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .default(""),
  listingType: z.enum(LISTING_TYPES, { message: "Invalid listing type" }),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(60, "City is too long"),
  goodWithKids: z.coerce.boolean().default(false),
  goodWithDogs: z.coerce.boolean().default(false),
  goodWithCats: z.coerce.boolean().default(false),
  houseTrained: z.coerce.boolean().default(false),
  vaccinated: z.coerce.boolean().default(false),
  neutered: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

export const swipeSchema = z.object({
  dogId: z.string().uuid("Invalid dog id"),
  direction: z.enum(["like", "pass"], { message: "Invalid swipe direction" }),
});

export const favoriteSchema = z.object({
  dogId: z.string().uuid("Invalid dog id"),
  favorited: z.boolean(),
});

export const requestDecisionSchema = z.object({
  requestId: z.string().uuid("Invalid request id"),
  decision: z.enum(["approved", "declined"], { message: "Invalid decision" }),
});

export const messageSchema = z.object({
  requestId: z.string().uuid("Invalid request id"),
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be at most 2000 characters"),
});

export const deckFiltersSchema = z.object({
  listingType: z.enum(LISTING_TYPES).optional(),
  city: z.string().trim().max(60).optional(),
  size: z.enum(DOG_SIZES).optional(),
  energyLevel: z.enum(ENERGY_LEVELS).optional(),
  goodWithKids: z.boolean().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type DogInput = z.infer<typeof dogSchema>;
export type SwipeInput = z.infer<typeof swipeSchema>;
export type DeckFilters = z.infer<typeof deckFiltersSchema>;

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
