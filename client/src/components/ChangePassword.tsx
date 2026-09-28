import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

interface ChangePasswordProps {
  onSuccess?: () => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onSuccess }) => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Dynamic Rule Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpperAndLower = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const hasNumberAndSpecial = /[0-9]/.test(newPassword) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const allRulesPassed = hasMinLength && hasUpperAndLower && hasNumberAndSpecial;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = allRulesPassed && passwordsMatch && currentPassword.length > 0 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage(res.error || "Failed to update password. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-page-bg)",
        padding: "var(--space-base)",
      }}
    >
      <div
        className="zen-card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "var(--space-xl)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-lg)" }}>
          <h1
            style={{
              fontSize: "var(--font-size-title)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: "var(--space-xs)",
            }}
          >
            Change Your Password
          </h1>
          <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text-muted)", margin: 0 }}>
            You must change your password to continue.
          </p>
        </div>

        {errorMessage && (
          <div
            data-testid="change-password-error"
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              backgroundColor: "#FEE2E2",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              padding: "var(--space-sm) var(--space-md)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "var(--space-md)",
              fontSize: "var(--font-size-body)",
            }}
          >
            <span>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Current Password */}
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label
              htmlFor="current-password"
              style={{
                display: "block",
                fontSize: "var(--font-size-body)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: "4px",
              }}
            >
              Current (temporary) password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="current-password"
                data-testid="current-password-input"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isSubmitting}
                className="zen-input"
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  padding: "4px",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label
              htmlFor="new-password"
              style={{
                display: "block",
                fontSize: "var(--font-size-body)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: "4px",
              }}
            >
              New password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="new-password"
                data-testid="new-password-input"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isSubmitting}
                className="zen-input"
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  padding: "4px",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showNewPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label
              htmlFor="confirm-password"
              style={{
                display: "block",
                fontSize: "var(--font-size-body)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: "4px",
              }}
            >
              Confirm new password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="confirm-password"
                data-testid="confirm-password-input"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isSubmitting}
                className="zen-input"
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  padding: "4px",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <div style={{ color: "var(--color-error)", fontSize: "var(--font-size-xs)", marginTop: "4px" }}>
                Passwords do not match
              </div>
            )}
          </div>

          {/* Dynamic Policy Checklist */}
          <div
            style={{
              backgroundColor: "var(--color-page-bg)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-sm) var(--space-md)",
              marginBottom: "var(--space-lg)",
              border: "1px solid var(--color-border-neutral)",
            }}
          >
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: "var(--space-xs)",
              }}
            >
              Password must:
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "var(--font-size-xs)" }}>
              <li
                data-testid="rule-length"
                style={{
                  color: hasMinLength ? "var(--color-success)" : "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <span>{hasMinLength ? "✓" : "○"}</span> Be at least 8 characters
              </li>
              <li
                data-testid="rule-case"
                style={{
                  color: hasUpperAndLower ? "var(--color-success)" : "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <span>{hasUpperAndLower ? "✓" : "○"}</span> Include upper and lower case letters
              </li>
              <li
                data-testid="rule-special"
                style={{
                  color: hasNumberAndSpecial ? "var(--color-success)" : "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{hasNumberAndSpecial ? "✓" : "○"}</span> Include a number and a special character
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            data-testid="change-password-submit-btn"
            disabled={!canSubmit}
            className="zen-btn zen-btn-primary"
            style={{
              width: "100%",
              minHeight: "44px",
              fontWeight: 600,
              fontSize: "var(--font-size-body)",
              justifyContent: "center",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.6,
            }}
          >
            {isSubmitting ? "Updating Password..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};
