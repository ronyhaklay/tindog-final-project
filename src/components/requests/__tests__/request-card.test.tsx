import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/language-provider", () => ({
  useLanguage: () => ({
    locale: "en",
    isHebrew: false,
    setLocale: vi.fn(),
    toggleLocale: vi.fn(),
  }),
}));

import { RequestCard } from "../request-card";

vi.mock("@/actions/requests", () => ({
  decideRequest: vi.fn(async () => ({ ok: true })),
}));

import { decideRequest } from "@/actions/requests";

const props = {
  requestId: "6f0f1f7e-7f4a-4b1a-9e63-0f0b1a2c3d4e",
  dogName: "Rexi",
  listingType: "adoption" as const,
  requester: {
    id: "requester-1",
    display_name: "Daniel Cohen",
    city: "Herzliya",
    avatar_url: null,
    bio: "Dog lover with a big garden.",
    account_mode: "adopter" as const,
    role: "adopter" as const,
    shelter_name: null,
    shelter_about: null,
    shelter_website: null,
    shelter_verified: false,
    household_type: "house" as const,
    has_children: false,
    has_other_pets: true,
    activity_level: "high" as const,
    preferred_size: "medium" as const,
    dog_experience: "experienced" as const,
    created_at: new Date().toISOString(),
  },
  createdAt: new Date("2026-08-01").toISOString(),
};

describe("RequestCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the requester and the dog", () => {
    render(<RequestCard {...props} />);
    expect(screen.getByText("Daniel Cohen")).toBeInTheDocument();
    expect(screen.getByText(/Rexi/)).toBeInTheDocument();
    expect(screen.getByText(/Dog lover with a big garden/)).toBeInTheDocument();
  });

  it("approves the request", async () => {
    const user = userEvent.setup();
    render(<RequestCard {...props} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(decideRequest).toHaveBeenCalledWith({ requestId: props.requestId, decision: "approved" });
  });

  it("declines the request", async () => {
    const user = userEvent.setup();
    render(<RequestCard {...props} />);
    await user.click(screen.getByRole("button", { name: /decline/i }));
    expect(decideRequest).toHaveBeenCalledWith({ requestId: props.requestId, decision: "declined" });
  });

  it("shows an error when the action fails", async () => {
    vi.mocked(decideRequest).mockResolvedValueOnce({ ok: false, error: "Could not update this request." });
    const user = userEvent.setup();
    render(<RequestCard {...props} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(await screen.findByText("Could not update this request.")).toBeInTheDocument();
  });
});
