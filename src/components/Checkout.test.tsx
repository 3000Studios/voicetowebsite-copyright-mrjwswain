import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Checkout from "./Checkout";

const mockItems = [{ id: "1", name: "Test Item", price: 100 }];

describe("Checkout Component", () => {
  const onClose = vi.fn();

  it("renders with correct accessibility roles", () => {
    render(<Checkout items={mockItems} onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "checkout-title");

    const title = screen.getByText("Checkout");
    expect(title).toHaveAttribute("id", "checkout-title");
  });

  it("has an accessible close button", () => {
    render(<Checkout items={mockItems} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: /close checkout/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("has accessible form inputs when Credit Card is selected", async () => {
    render(<Checkout items={mockItems} onClose={onClose} />);

    const creditCardBtn = screen.getByRole("button", { name: /credit card/i });
    fireEvent.click(creditCardBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvc/i)).toBeInTheDocument();
    });
  });

  it("toggles aria-pressed on payment method buttons", () => {
    render(<Checkout items={mockItems} onClose={onClose} />);

    const creditCardBtn = screen.getByRole("button", { name: /credit card/i });
    const paypalBtn = screen.getByRole("button", { name: /paypal/i });

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
