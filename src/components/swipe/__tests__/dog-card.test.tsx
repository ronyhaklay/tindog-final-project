import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DeckDog } from "@/lib/types";
import { DogCard } from "../dog-card";

const dog: DeckDog = {
  id: "dog-1",
  owner_id: "owner-1",
  name: "Rexi",
  breed: "Mixed",
  age_years: 3,
  size: "medium",
  energy_level: "high",
  temperament: "Playful, loves people",
  special_needs: "Daily medication",
  description: "A very good boy looking for a home.",
  listing_type: "adoption",
  city: "Tel Aviv",
  is_active: true,
  created_at: new Date().toISOString(),
  photo_paths: [],
  owner_name: "Maya Levi",
};

describe("DogCard", () => {
  it("shows the dog's key details", () => {
    render(<DogCard dog={dog} />);

    expect(screen.getByText("Rexi")).toBeInTheDocument();
    expect(screen.getByText("3 years")).toBeInTheDocument();
    expect(screen.getByText(/Tel Aviv/)).toBeInTheDocument();
    expect(screen.getByText("Adoption")).toBeInTheDocument();
    expect(screen.getByText(/Playful, loves people/)).toBeInTheDocument();
    expect(screen.getByText(/Daily medication/)).toBeInTheDocument();
    expect(
      screen.getByText("A very good boy looking for a home.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Published by Maya Levi/)).toBeInTheDocument();
  });

  it("hides the carousel controls when there are no photos", () => {
    render(<DogCard dog={dog} />);
    expect(screen.queryByLabelText("Next photo")).not.toBeInTheDocument();
  });

  it("shows carousel controls with multiple photos", () => {
    render(
      <DogCard dog={{ ...dog, photo_paths: ["u1/a.jpg", "u1/b.jpg"] }} />
    );
    expect(screen.getByLabelText("Next photo")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous photo")).toBeInTheDocument();
  });
});
