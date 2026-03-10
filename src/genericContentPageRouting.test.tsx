import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import GenericContentPage from "./pages/GenericContentPage";

function SlugNavigationHarness() {
  const navigate = useNavigate();

  return (
    <>
      <button type="button" onClick={() => navigate("/features")}>
        Go to features
      </button>
      <button type="button" onClick={() => navigate("/pricing")}>
        Go to pricing
      </button>
      <Routes>
        <Route path="/:slug" element={<GenericContentPage />} />
      </Routes>
    </>
  );
}

describe("GenericContentPage", () => {
  it("updates content when navigating between slug routes", async () => {
    render(
      <MemoryRouter initialEntries={["/contact"]}>
        <SlugNavigationHarness />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /^contact$/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /go to features/i }));
    expect(
      await screen.findByRole("heading", { name: /^features$/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /go to pricing/i }));
    expect(
      await screen.findByRole("heading", { name: /^pricing$/i })
    ).toBeInTheDocument();
  });
});
