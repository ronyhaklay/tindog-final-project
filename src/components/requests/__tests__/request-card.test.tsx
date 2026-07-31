import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestCard } from "../request-card";

// Mock the server action so the component can be tested in isolation.
vi.mock("@/actions/requests", () => ({
  decideRequest: vi.fn(async () => ({ ok: true })),
}));

import { decideRequest } from "@/actions/requests";

const props = {
  requestId: "6f0f1f7e-7f4a-4b1a-9e63-0f0b1a2c3d4e",
  dogName: "Rexi",
  listingType: "adoption" as const,
  requesterName: "Daniel Cohen",
  requesterCity: "Herzliya",
  requesterBio: "Dog lover with a big garden.",
  createdAt: new Date("2026-08-01").toISOString(),
};

describe("RequestCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the requester and the dog", () => {
    render(<RequestCard {...props} />);
    expect(screen.getByText("Daniel Cohen")).toBeInTheDocument();
    expect(screen.getByText(/Rexi/)).toBeInTheDocument();
    expect(screen.getByText("Dog lover with a big garden.")).toBeInTheDocument();
  });

  it("approves the request", async () => {
    const user = userEvent.setup();
    render(<RequestCard {...props} />);

    await user.click(screen.getByRole("button", { name: /approve/i }));

    expect(decideRequest).toHaveBeenCalledWith({
      requestId: props.requestId,
      decision: "approved",
    });
  });

  it("declines the request", async () => {
    const user = userEvent.setup();
    render(<RequestCard {...props} />);

    await user.click(screen.getByRole("button", { name: /decline/i }));

    expect(decideRequest).toHaveBeenCalledWith({
      requestId: props.requestId,
      decision: "declined",
    });
  });

  it("shows an error when the action fails", async () => {
    vi.mocked(decideRequest).mockResolvedValueOnce({
      ok: false,
      error: "Could not update this request.",
    });
    const user = userEvent.setup();
    render(<RequestCard {...props} />);

    await user.click(screen.getByRole("button", { name: /approve/i }));

    expect(
      await screen.findByText("Could not update this request.")
    ).toBeInTheDocument();
  });
});
