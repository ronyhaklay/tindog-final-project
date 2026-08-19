import { z } from "zod";
import {
  DOG_EXPERIENCE_LEVELS,
  DOG_SIZES,
  ENERGY_LEVELS,
  HOUSEHOLD_TYPES,
  LISTING_TYPES,
  USER_ROLES,
} from "./constants";

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  role: z.enum(USER_ROLES).default("adopter"),
  shelterName: z.string().trim().max(100).optional().default(""),
}).superRefine((value, ctx) => {
  if (value.role === "shelter_admin" && value.shelterName.length < 2) {
    ctx.addIssue({ code: "custom", path: ["shelterName"], message: "Shelter / rescue name is required" });
  }
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  city: z.string().trim().max(60, "City is too long").optional().default(""),
  bio: z.string().trim().max(300, "Bio must be at most 300 characters").optional().default(""),
  shelterName: z.string().trim().max(100).optional().default(""),
  shelterAbout: z.string().trim().max(600).optional().default(""),
  shelterWebsite: z.string().trim().max(200).optional().default(""),
  householdType: z.enum(HOUSEHOLD_TYPES).optional().or(z.literal("")),
  hasChildren: z.coerce.boolean().default(false),
  hasOtherPets: z.coerce.boolean().default(false),
  activityLevel: z.enum(ENERGY_LEVELS).optional().or(z.literal("")),
  preferredSize: z.enum(DOG_SIZES).optional().or(z.literal("")),
  dogExperience: z.enum(DOG_EXPERIENCE_LEVELS).optional().or(z.literal("")),
});

export const dogSchema = z.object({
  name: z.string().trim().min(1, "Dog name is required").max(40),
  breed: z.string().trim().max(60, "Breed is too long").optional().default(""),
  ageYears: z.coerce.number({ message: "Age must be a number" }).min(0).max(25),
  size: z.enum(DOG_SIZES, { message: "Invalid size" }),
  energyLevel: z.enum(ENERGY_LEVELS, { message: "Invalid energy level" }),
  gender: z.enum(["female", "male"]).optional().or(z.literal("")),
  temperament: z.string().trim().max(200).optional().default(""),
  specialNeeds: z.string().trim().max(300).optional().default(""),
  description: z.string().trim().max(1000).optional().default(""),
  listingType: z.enum(LISTING_TYPES, { message: "Invalid listing type" }),
  city: z.string().trim().min(2, "City is required").max(60),
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

export const favoriteSchema = z.object({ dogId: z.string().uuid(), favorited: z.boolean() });
export const requestDecisionSchema = z.object({ requestId: z.string().uuid(), decision: z.enum(["approved", "declined"]) });
export const matchSeenSchema = z.object({ requestId: z.string().uuid() });
export const messageSchema = z.object({
  requestId: z.string().uuid(),
  content: z.string().trim().min(1, "Message cannot be empty").max(2000),
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
