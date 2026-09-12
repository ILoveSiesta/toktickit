import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "../../src/components/Login.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

function renderLogin(props: { onSuccess?: (user: any) => void; onRequirePasswordChange?: (user: any) => void } = {}) {
  return render(
    <AuthProvider>
      <Login {...props} />
    </AuthProvider>
  );
}

describe("UI-01: Login Component (Validation, Busy State, Safe Error)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders login form with email, password, and sign in button", () => {
    renderLogin();

    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-btn")).toBeInTheDocument();
  });

  it("validates required fields and shows inline error messages without submitting", async () => {
    const loginSpy = vi.spyOn(api, "loginApi");
    renderLogin();

    const submitBtn = screen.getByTestId("login-submit-btn");
    await userEvent.click(submitBtn);

    // Errors displayed
    expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it("shows safe error alert when API returns invalid credentials or inactive account", async () => {
    vi.spyOn(api, "loginApi").mockRejectedValue(new Error("Invalid email or password. Please try again."));

    renderLogin();

    await userEvent.type(screen.getByTestId("login-email-input"), "jennifer@toktick.it");
    await userEvent.type(screen.getByTestId("login-password-input"), "WrongPassword123!");

    const submitBtn = screen.getByTestId("login-submit-btn");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByTestId("login-error-alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/Invalid email or password/i);
    });
  });

  it("shows busy/disabled state during submission and calls onSuccess upon valid login", async () => {
    let resolveLogin: (val: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    vi.spyOn(api, "loginApi").mockImplementation(() => loginPromise as any);
    const onSuccessMock = vi.fn();

    renderLogin({ onSuccess: onSuccessMock });

    await userEvent.type(screen.getByTestId("login-email-input"), "jennifer@toktick.it");
    await userEvent.type(screen.getByTestId("login-password-input"), "TokTickIT2026!");

    const submitBtn = screen.getByTestId("login-submit-btn");
    await userEvent.click(submitBtn);

    // Verify busy state
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/Signing in/i);

    // Resolve login
    resolveLogin!({
      token: "mock-jwt-token",
      user: {
        id: 1,
        name: "Jennifer Anderson",
        email: "jennifer@toktick.it",
        role: "REQUESTER",
        mustChangePassword: false,
      },
    });

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
      expect(onSuccessMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: "jennifer@toktick.it", role: "REQUESTER" })
      );
    });
  });

  it("calls onRequirePasswordChange upon login when mustChangePassword is true", async () => {
    vi.spyOn(api, "loginApi").mockResolvedValue({
      token: "mock-jwt-token",
      user: {
        id: 2,
        name: "Kevin Staff",
        email: "kevin.staff@toktickit.com",
        role: "IT_STAFF",
        mustChangePassword: true,
      },
    });
    const onRequirePasswordChangeMock = vi.fn();
    const onSuccessMock = vi.fn();

    renderLogin({
      onSuccess: onSuccessMock,
      onRequirePasswordChange: onRequirePasswordChangeMock,
    });

    await userEvent.type(screen.getByTestId("login-email-input"), "kevin.staff@toktickit.com");
    await userEvent.type(screen.getByTestId("login-password-input"), "TokTickIT2026!");

    const submitBtn = screen.getByTestId("login-submit-btn");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(onRequirePasswordChangeMock).toHaveBeenCalledTimes(1);
      expect(onSuccessMock).not.toHaveBeenCalled();
    });
  });
});
