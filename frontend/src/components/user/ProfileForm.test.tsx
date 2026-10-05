import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { COMMON_MESSAGES, FIELD_LABELS, VALIDATION_MESSAGES } from "@/constants";
import { mockAuthenticatedAuthState, mockUser } from "@/testing/mockData";
import { renderWithProviders } from "@/testing/render";
import { ProfileForm } from "./ProfileForm";

const saveButton = () => screen.getByRole("button", { name: COMMON_MESSAGES.SAVE_CHANGES });

describe("ProfileForm", () => {
  it("starts with the user's current name and email", () => {
    renderWithProviders(<ProfileForm user={mockUser} />, mockAuthenticatedAuthState);

    expect(screen.getByLabelText(FIELD_LABELS.NAME)).toHaveValue(mockUser.name);
    expect(screen.getByLabelText(FIELD_LABELS.EMAIL)).toHaveValue(mockUser.email);
  });

  it("keeps Save disabled until something changes", async () => {
    renderWithProviders(<ProfileForm user={mockUser} />, mockAuthenticatedAuthState);

    expect(saveButton()).toBeDisabled();
    await userEvent.type(screen.getByLabelText(FIELD_LABELS.NAME), " Jr");
    expect(saveButton()).toBeEnabled();
  });

  it("shows a validation message for a blank name", async () => {
    renderWithProviders(<ProfileForm user={mockUser} />, mockAuthenticatedAuthState);

    await userEvent.clear(screen.getByLabelText(FIELD_LABELS.NAME));
    await userEvent.click(saveButton());

    expect(await screen.findByText(VALIDATION_MESSAGES.NAME_REQUIRED)).toBeInTheDocument();
  });
});
