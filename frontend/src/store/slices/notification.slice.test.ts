import { describe, expect, it } from "vitest";
import { hideNotification, notificationReducer, showNotification } from "./notification.slice";

describe("notification slice", () => {
  it("starts closed", () => {
    const state = notificationReducer(undefined, { type: "@@INIT" });

    expect(state.open).toBe(false);
  });

  it("showNotification opens with the message and severity", () => {
    const state = notificationReducer(
      undefined,
      showNotification({ message: "Saved", severity: "success" }),
    );

    expect(state).toEqual({ open: true, message: "Saved", severity: "success" });
  });

  it("hideNotification closes but keeps the message for the exit animation", () => {
    const shown = notificationReducer(
      undefined,
      showNotification({ message: "Failed", severity: "error" }),
    );
    const state = notificationReducer(shown, hideNotification());

    expect(state).toEqual({ open: false, message: "Failed", severity: "error" });
  });
});
