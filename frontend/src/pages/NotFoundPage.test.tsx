import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { COMMON_MESSAGES, NOT_FOUND_MESSAGES, ROUTES } from "@/constants";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("shows the not-found message with a link back home", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: NOT_FOUND_MESSAGES.TITLE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: COMMON_MESSAGES.BACK_HOME })).toHaveAttribute(
      "href",
      ROUTES.HOME,
    );
  });
});
