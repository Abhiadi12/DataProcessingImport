import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, type InitialEntry } from "react-router";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/constants";
import { createTestStore } from "@/testing/factories";
import { mockAnonymousAuthState, mockAuthenticatedAuthState } from "@/testing/mockData";
import type { AuthState } from "@/types";
import { GuestOnly } from "./GuestOnly";

function renderAt(entry: InitialEntry, auth: AuthState) {
  render(
    <Provider store={createTestStore(auth)}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path={ROUTES.LOGIN} element={<p>login page</p>} />
          </Route>
          <Route path={ROUTES.HOME} element={<p>home page</p>} />
          <Route path="/projects" element={<p>projects page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("GuestOnly", () => {
  it("shows the login page to a signed-out user", () => {
    renderAt(ROUTES.LOGIN, mockAnonymousAuthState);

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("sends a signed-in user home", () => {
    renderAt(ROUTES.LOGIN, mockAuthenticatedAuthState);

    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("sends a signed-in user back to the page they came from", () => {
    renderAt({ pathname: ROUTES.LOGIN, state: { from: "/projects" } }, mockAuthenticatedAuthState);

    expect(screen.getByText("projects page")).toBeInTheDocument();
  });
});
