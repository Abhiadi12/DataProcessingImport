import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FIELD_LABELS, PROFILE_MESSAGES, VALIDATION_MESSAGES } from "@/constants";
import { mockAuthenticatedAuthState } from "@/testing/mockData";
import { renderWithProviders } from "@/testing/render";
import { ChangePasswordForm } from "./ChangePasswordForm";

async function fillAndSubmit(current: string, next: string, confirm: string) {
  renderWithProviders(<ChangePasswordForm />, mockAuthenticatedAuthState);

  if (current) {
    await userEvent.type(screen.getByLabelText(FIELD_LABELS.CURRENT_PASSWORD), current);
  }
  await userEvent.type(screen.getByLabelText(FIELD_LABELS.NEW_PASSWORD), next);
  await userEvent.type(screen.getByLabelText(FIELD_LABELS.CONFIRM_NEW_PASSWORD), confirm);
  await userEvent.click(screen.getByRole("button", { name: PROFILE_MESSAGES.PASSWORD_SUBMIT }));
}

// Every case here fails validation, so no request is ever sent.
describe("ChangePasswordForm", () => {
  it("requires the current password", async () => {
    await fillAndSubmit("", "new-password-1", "new-password-1");

    expect(
      await screen.findByText(VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED),
    ).toBeInTheDocument();
  });

  it("rejects a new password equal to the current one", async () => {
    await fillAndSubmit("same-password", "same-password", "same-password");

    expect(
      await screen.findByText(VALIDATION_MESSAGES.NEW_PASSWORD_MUST_DIFFER),
    ).toBeInTheDocument();
  });

  it("rejects a confirmation that does not match", async () => {
    await fillAndSubmit("old-password", "new-password-1", "new-password-2");

    expect(await screen.findByText(VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH)).toBeInTheDocument();
  });
});
