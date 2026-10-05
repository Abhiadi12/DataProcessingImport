import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { USERS_MESSAGES } from "@/constants";
import { mockAdminUser, mockManagerUser, mockUser } from "@/testing/mockData";
import type { PublicUser } from "@/types";
import { UsersTable } from "./UsersTable";

// Signed in as mockAdminUser; mockUser is an active MEMBER, mockManagerUser a
// deactivated MANAGER.
function renderTable(users: PublicUser[], updatingId: string | null = null) {
  const onView = vi.fn();
  const onUpdate = vi.fn();
  render(
    <UsersTable
      users={users}
      currentUserId={mockAdminUser.id}
      updatingId={updatingId}
      onView={onView}
      onUpdate={onUpdate}
    />,
  );
  return { onView, onUpdate };
}

const roleSelect = (user: PublicUser) =>
  screen.getByRole("combobox", { name: USERS_MESSAGES.roleOf(user.name) });
const activeSwitch = (user: PublicUser) =>
  screen.getByRole("switch", { name: USERS_MESSAGES.activeStatusOf(user.name) });

describe("UsersTable", () => {
  it("shows a row per user", () => {
    renderTable([mockAdminUser, mockUser, mockManagerUser]);

    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockManagerUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockAdminUser.email)).toBeInTheDocument();
  });

  it("shows the empty message when there are no users", () => {
    renderTable([]);

    expect(screen.getByText(USERS_MESSAGES.EMPTY)).toBeInTheDocument();
  });

  it("reflects each user's active status", () => {
    renderTable([mockUser, mockManagerUser]);

    expect(activeSwitch(mockUser)).toBeChecked();
    expect(activeSwitch(mockManagerUser)).not.toBeChecked();
  });

  it("marks the signed-in admin's own row and locks its controls", () => {
    renderTable([mockAdminUser, mockUser]);

    expect(screen.getByText(USERS_MESSAGES.YOU)).toBeInTheDocument();
    expect(roleSelect(mockAdminUser)).toHaveAttribute("aria-disabled", "true");
    expect(activeSwitch(mockAdminUser)).toBeDisabled();
  });

  it("locks the role of another admin but still allows deactivating them", () => {
    const otherAdmin: PublicUser = { ...mockUser, role: "ADMIN" };
    renderTable([otherAdmin]);

    expect(roleSelect(otherAdmin)).toHaveAttribute("aria-disabled", "true");
    expect(activeSwitch(otherAdmin)).toBeEnabled();
  });

  it("locks only the row that is being saved", () => {
    renderTable([mockUser, mockManagerUser], mockUser.id);

    expect(activeSwitch(mockUser)).toBeDisabled();
    expect(activeSwitch(mockManagerUser)).toBeEnabled();
  });

  it("reports a status toggle through onUpdate", async () => {
    const { onUpdate } = renderTable([mockUser]);

    await userEvent.click(activeSwitch(mockUser));

    expect(onUpdate).toHaveBeenCalledWith(mockUser, { isActive: false });
  });

  it("reports a role change through onUpdate", async () => {
    const { onUpdate } = renderTable([mockUser]);

    await userEvent.click(roleSelect(mockUser));
    await userEvent.click(screen.getByRole("option", { name: "Manager" }));

    expect(onUpdate).toHaveBeenCalledWith(mockUser, { role: "MANAGER" });
  });

  it("reports the view button through onView", async () => {
    const { onView } = renderTable([mockUser]);

    await userEvent.click(
      screen.getByRole("button", { name: USERS_MESSAGES.viewDetailsOf(mockUser.name) }),
    );

    expect(onView).toHaveBeenCalledWith(mockUser.id);
  });
});
