import { describe, expect, it } from "vitest";
import {
  dogSchema,
  loginSchema,
  messageSchema,
  signupSchema,
  swipeSchema,
} from "../validation";

const validDog = {
  name: "Rexi",
  breed: "Mixed",
  ageYears: "3",
  size: "medium",
  energyLevel: "high",
  temperament: "Playful",
  specialNeeds: "",
  description: "A very good boy",
  listingType: "adoption",
  city: "Tel Aviv",
  isActive: true,
};

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    const result = signupSchema.safeParse({
      displayName: "Maya Levi",
      email: "maya@example.com",
      password: "supersecret1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = signupSchema.safeParse({
      displayName: "Maya",
      email: "maya@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({
      displayName: "Maya",
      email: "not-an-email",
      password: "supersecret1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a one-character display name", () => {
    const result = signupSchema.safeParse({
      displayName: "M",
      email: "maya@example.com",
      password: "supersecret1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    const result = loginSchema.safeParse({
      email: "maya@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("dogSchema", () => {
  it("accepts a valid dog", () => {
    const result = dogSchema.safeParse(validDog);
    expect(result.success).toBe(true);
    if (result.success) {
      // coerced from the form string
      expect(result.data.ageYears).toBe(3);
    }
  });

  it("rejects a missing name", () => {
    const result = dogSchema.safeParse({ ...validDog, name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects an unrealistic age", () => {
    const result = dogSchema.safeParse({ ...validDog, ageYears: "42" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative age", () => {
    const result = dogSchema.safeParse({ ...validDog, ageYears: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown listing type", () => {
    const result = dogSchema.safeParse({ ...validDog, listingType: "party" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown size", () => {
    const result = dogSchema.safeParse({ ...validDog, size: "giant" });
    expect(result.success).toBe(false);
  });

  it("requires a city", () => {
    const result = dogSchema.safeParse({ ...validDog, city: "" });
    expect(result.success).toBe(false);
  });
});

describe("swipeSchema", () => {
  it("accepts a valid like", () => {
    const result = swipeSchema.safeParse({
      dogId: "6f0f1f7e-7f4a-4b1a-9e63-0f0b1a2c3d4e",
      direction: "like",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid dog id (potential injection)", () => {
    const result = swipeSchema.safeParse({
      dogId: "1; drop table dogs;",
      direction: "like",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown direction", () => {
    const result = swipeSchema.safeParse({
      dogId: "6f0f1f7e-7f4a-4b1a-9e63-0f0b1a2c3d4e",
      direction: "superlike",
    });
    expect(result.success).toBe(false);
  });
});

describe("messageSchema", () => {
  it("rejects an empty message", () => {
    const result = messageSchema.safeParse({
      requestId: "6f0f1f7e-7f4a-4b1a-9e63-0f0b1a2c3d4e",
      content: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a message over 2000 characters", () => {
    const result = messageSchema.safeParse({
      requestId: "6f0f1f7e-7f4a-4b1a-9e63-0f0b1a2c3d4e",
      content: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
