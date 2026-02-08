import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Checkout from "./Checkout";

// Mock framer-motion to avoid animation issues in tests if necessary
// But for now, let's try without mocking as it usually works with JSDOM

describe("Checkout Accessibility", () => {
  const mockItems = [{ id: "1", name: "Test Item", price: 99.99 }];
  const onClose = vi.fn();

  it("renders the checkout modal with proper accessibility attributes", () => {
    render(<Checkout items={mockItems} onClose={onClose} />);

    // Check for dialog role
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Check for title association
    // We expect the dialog to be labelled by the title
    // But verify the title has the ID first
    const title = screen.getByRole("heading", { name: /checkout/i });
    expect(title).toHaveAttribute("id", "checkout-title");
    expect(dialog).toHaveAttribute("aria-labelledby", "checkout-title");

    // Check for close button accessibility
    const closeButton = screen.getByRole("button", { name: /close checkout/i });
    expect(closeButton).toBeInTheDocument();
  });

  it("associates labels with inputs correctly when credit card is selected", async () => {
    render(<Checkout items={mockItems} onClose={onClose} />);

    // Select Credit Card
    const stripeButton = screen.getByText("Credit Card");
    fireEvent.click(stripeButton);

    // Wait for form to appear (it's inside AnimatePresence)
    await waitFor(() => {
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    // Verify inputs are accessible via labels
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/cardholder name/i)).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/card number/i)).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/expiry date/i)).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/cvc/i)).toHaveAttribute("type", "text");
  });
});
