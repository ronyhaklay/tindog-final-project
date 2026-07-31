import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormError } from "../form-error";

describe("FormError", () => {
  it("renders nothing before submission", () => {
    const { container } = render(<FormError state={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on success", () => {
    const { container } = render(<FormError state={{ ok: true }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the error message as an alert", () => {
    render(<FormError state={{ ok: false, error: "Invalid email address" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid email address"
    );
  });
});
