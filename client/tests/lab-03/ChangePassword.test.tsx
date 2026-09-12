import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePassword } from "../../src/components/ChangePassword.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

function renderChangePassword(props: { onSuccess?: () => void } = {}) {
  return render(
    <AuthProvider>
      <ChangePassword {...props} />
    </AuthProvider>
  );
}

describe("UI-02: ChangePassword Component (Policy Checklist & Confirmation)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders checklist with all rules uncompleted initially and submit disabled", () => {
    renderChangePassword();

    const ruleLength = screen.getByTestId("rule-length");
    const ruleCase = screen.getByTestId("rule-case");
    const ruleSpecial = screen.getByTestId("rule-special");
    const submitBtn = screen.getByTestId("change-password-submit-btn");

    expect(ruleLength).toHaveTextContent(/Be at least 8 characters/i);
    expect(ruleLength).toHaveTextContent("○");

    expect(ruleCase).toHaveTextContent(/Include upper and lower case letters/i);
    expect(ruleCase).toHaveTextContent("○");

    expect(ruleSpecial).toHaveTextContent(/Include a number and a special character/i);
    expect(ruleSpecial).toHaveTextContent("○");

    expect(submitBtn).toBeDisabled();
  });

  it("dynamically turns checklist items green with checkmarks as password criteria are fulfilled", async () => {
    renderChangePassword();

    const newPasswordInput = screen.getByTestId("new-password-input");
    const ruleLength = screen.getByTestId("rule-length");
    const ruleCase = screen.getByTestId("rule-case");
    const ruleSpecial = screen.getByTestId("rule-special");

    // 1. Type 8 lowercase letters -> length passes, case & special fail
    await userEvent.type(newPasswordInput, "password");
    expect(ruleLength).toHaveTextContent("✓");
    expect(ruleCase).toHaveTextContent("○");
    expect(ruleSpecial).toHaveTextContent("○");

    // 2. Add uppercase letter -> case passes
    await userEvent.type(newPasswordInput, "A");
    expect(ruleLength).toHaveTextContent("✓");
    expect(ruleCase).toHaveTextContent("✓");
    expect(ruleSpecial).toHaveTextContent("○");

    // 3. Add number and special character -> all pass!
    await userEvent.type(newPasswordInput, "1!");
    expect(ruleLength).toHaveTextContent("✓");
    expect(ruleCase).toHaveTextContent("✓");
    expect(ruleSpecial).toHaveTextContent("✓");
  });

  it("enables submit button only when current password, complex new password, and matching confirmation are provided", async () => {
    const changePasswordSpy = vi.spyOn(api, "changePasswordApi").mockResolvedValue({
      token: "new-jwt-token",
      message: "Password changed successfully.",
    });

    const onSuccessMock = vi.fn();
    renderChangePassword({ onSuccess: onSuccessMock });

    const currentPasswordInput = screen.getByTestId("current-password-input");
    const newPasswordInput = screen.getByTestId("new-password-input");
    const confirmPasswordInput = screen.getByTestId("confirm-password-input");
    const submitBtn = screen.getByTestId("change-password-submit-btn");

    await userEvent.type(currentPasswordInput, "OldPassword123!");
    await userEvent.type(newPasswordInput, "ComplexPass2026!");
    expect(submitBtn).toBeDisabled(); // confirm password still empty

    await userEvent.type(confirmPasswordInput, "MismatchPass!");
    expect(submitBtn).toBeDisabled(); // passwords do not match

    await userEvent.clear(confirmPasswordInput);
    await userEvent.type(confirmPasswordInput, "ComplexPass2026!");
    expect(submitBtn).toBeEnabled();

    // Submit
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(changePasswordSpy).toHaveBeenCalledWith({
        currentPassword: "OldPassword123!",
        newPassword: "ComplexPass2026!",
        confirmPassword: "ComplexPass2026!",
      });
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });
});
