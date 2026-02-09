import { render, screen, fireEvent } from "@testing-library/react";
import Checkout from "./Checkout";
import { describe, it, expect, vi } from "vitest";

// Mock `import.meta.env`
vi.stubGlobal("import.meta", {
  env: {
    VITE_PAYPAL_CLIENT_ID: "test-client-id",
  },
});

describe("Checkout Component", () => {
  const mockItems = [{ id: "1", name: "Test Item", price: 10.0 }];
  const mockOnClose = vi.fn();

  it("renders accessible form fields when credit card is selected", async () => {
    render(<Checkout items={mockItems} onClose={mockOnClose} />);

    // Select Credit Card
    const creditCardBtn = screen.getByText("Credit Card");
    fireEvent.click(creditCardBtn);

    // Check if inputs are accessible via their labels
    // These are expected to fail initially
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cardholder Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Card Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expiry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CVC/i)).toBeInTheDocument();
  });

  it("renders close button with accessible label", () => {
    render(<Checkout items={mockItems} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText(/Close checkout/i);
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders modal with correct role", () => {
    render(<Checkout items={mockItems} onClose={mockOnClose} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
