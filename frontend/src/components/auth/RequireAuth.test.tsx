import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { ROLE, ROUTES } from "@/constants";
import { createTestStore } from "@/testing/factories";
import {
  mockAnonymousAuthState,
  mockAuthenticatedAuthState,
  mockCheckingAuthState,
} from "@/testing/mockData";
import type { AuthState } from "@/types";
import { RequireAuth } from "./RequireAuth";

function renderAt(path: string, auth: AuthState) {
  render(
    <Provider store={createTestStore(auth)}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<p>login page</p>} />
          <Route element={<RequireAuth />}>
            <Route path={ROUTES.HOME} element={<p>home page</p>} />
            <Route element={<RequireAuth minimumRole={ROLE.ADMIN} />}>
              <Route path="/admin" element={<p>admin page</p>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("RequireAuth", () => {
  it("shows the loader while the session is being checked", () => {
    renderAt(ROUTES.HOME, mockCheckingAuthState);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("home page")).not.toBeInTheDocument();
  });

  it("redirects a signed-out user to login", () => {
    renderAt(ROUTES.HOME, mockAnonymousAuthState);

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders the page for a signed-in user", () => {
    renderAt(ROUTES.HOME, mockAuthenticatedAuthState);

    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("sends a user below the minimum role home", () => {
    // mockUser is a MEMBER
    renderAt("/admin", mockAuthenticatedAuthState);

    expect(screen.getByText("home page")).toBeInTheDocument();
    expect(screen.queryByText("admin page")).not.toBeInTheDocument();
  });

  it("renders the page for a user at the minimum role", () => {
    const admin: AuthState = {
      ...mockAuthenticatedAuthState,
      user: { ...mockAuthenticatedAuthState.user!, role: ROLE.ADMIN },
    };
    renderAt("/admin", admin);

    expect(screen.getByText("admin page")).toBeInTheDocument();
  });
});
