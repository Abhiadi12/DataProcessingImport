import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AUTH_MESSAGES, FIELD_LABELS, VALIDATION_MESSAGES } from "@/constants";
import { renderWithProviders } from "@/testing/render";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("renders the email and password fields", () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByLabelText(FIELD_LABELS.EMAIL)).toBeInTheDocument();
    expect(screen.getByLabelText(FIELD_LABELS.PASSWORD)).toBeInTheDocument();
  });

  it("shows validation messages when submitted empty", async () => {
    renderWithProviders(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: AUTH_MESSAGES.LOGIN_SUBMIT }));

    expect(await screen.findByText(VALIDATION_MESSAGES.EMAIL_INVALID)).toBeInTheDocument();
    expect(screen.getByText(VALIDATION_MESSAGES.PASSWORD_REQUIRED)).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    renderWithProviders(<LoginForm />);
    const password = screen.getByLabelText(FIELD_LABELS.PASSWORD);

    expect(password).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: FIELD_LABELS.SHOW_PASSWORD }));
    expect(password).toHaveAttribute("type", "text");
  });
});
