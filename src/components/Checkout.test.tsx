import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Checkout from "./Checkout";

const mockItems = [{ id: "1", name: "Test Item", price: 100 }];

describe("Checkout Component", () => {
  it("renders with correct accessibility roles", () => {
    render(<Checkout items={mockItems} onClose={() => {}} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "checkout-title");

    // Check if the title element exists with the correct ID
    // We can't use getByRole for the title easily unless we query by ID
    const title = screen.getByText("Checkout");
    expect(title).toHaveAttribute("id", "checkout-title");
  });

  it("has an accessible close button", () => {
    const onClose = vi.fn();
    render(<Checkout items={mockItems} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: /close checkout/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("has accessible form inputs when Credit Card is selected", async () => {
    render(<Checkout items={mockItems} onClose={() => {}} />);

    // Select Credit Card (Text content is "Credit Card" inside the button)
    // The button itself has text "Credit Card" (and an icon).
    // Using getByRole with name option matches the accessible name.
    const creditCardBtn = screen.getByRole("button", { name: /credit card/i });
    fireEvent.click(creditCardBtn);

    // Check if form inputs are accessible by label
    // We use waitFor because of Framer Motion's AnimatePresence which might delay rendering
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvc/i)).toBeInTheDocument();
    });
  });

  it("toggles aria-pressed on payment method buttons", () => {
    render(<Checkout items={mockItems} onClose={() => {}} />);

    const creditCardBtn = screen.getByRole("button", { name: /credit card/i });
    const paypalBtn = screen.getByRole("button", { name: /paypal/i });

    // Initially neither is selected
    expect(creditCardBtn).toHaveAttribute("aria-pressed", "false");
    expect(paypalBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(creditCardBtn);
    expect(creditCardBtn).toHaveAttribute("aria-pressed", "true");
    expect(paypalBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(paypalBtn);
    expect(creditCardBtn).toHaveAttribute("aria-pressed", "false");
    expect(paypalBtn).toHaveAttribute("aria-pressed", "true");
  });
});
