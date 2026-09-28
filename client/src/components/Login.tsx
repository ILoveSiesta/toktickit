import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { AuthUser } from "../types/index.js";

interface LoginProps {
  onSuccess?: (user: AuthUser) => void;
  onRequirePasswordChange?: (user: AuthUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onRequirePasswordChange }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success && res.user) {
        if (res.mustChangePassword) {
          if (onRequirePasswordChange) {
            onRequirePasswordChange(res.user);
          }
        } else {
          if (onSuccess) {
            onSuccess(res.user);
          }
        }
      } else {
        setErrorMessage(res.error || "Invalid email or password. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
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
          maxWidth: "420px",
          padding: "var(--space-xl)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-xl)" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              marginBottom: "var(--space-xs)",
            }}
          >
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--color-primary-green)",
                letterSpacing: "-0.5px",
              }}
            >
              TokTickIT
            </span>
          </div>
          <h1
            style={{
              fontSize: "var(--font-size-title)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginTop: "var(--space-xs)",
              marginBottom: 0,
            }}
          >
            Sign in to your account
          </h1>
        </div>

        {/* Global Error Alert */}
        {errorMessage && (
          <div
            data-testid="login-error-alert"
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
              marginBottom: "var(--space-lg)",
              fontSize: "var(--font-size-body)",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label
              htmlFor="login-email"
              style={{
                display: "block",
                fontSize: "var(--font-size-body)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: "4px",
              }}
            >
              Email address
            </label>
            <input
              id="login-email"
              data-testid="login-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@toktickit.com"
              disabled={isSubmitting}
              className="zen-input"
              style={{
                width: "100%",
                borderColor: fieldErrors.email ? "var(--color-error)" : undefined,
              }}
            />
            {fieldErrors.email && (
              <div
                style={{
                  color: "var(--color-error)",
                  fontSize: "var(--font-size-xs)",
                  marginTop: "4px",
                }}
              >
                {fieldErrors.email}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <label
              htmlFor="login-password"
              style={{
                display: "block",
                fontSize: "var(--font-size-body)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: "4px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                data-testid="login-password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isSubmitting}
                className="zen-input"
                style={{
                  width: "100%",
                  paddingRight: "40px",
                  borderColor: fieldErrors.password ? "var(--color-error)" : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  fontSize: "1rem",
                  padding: "4px",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {fieldErrors.password && (
              <div
                style={{
                  color: "var(--color-error)",
                  fontSize: "var(--font-size-xs)",
                  marginTop: "4px",
                }}
              >
                {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            data-testid="login-submit-btn"
            disabled={isSubmitting}
            className="zen-btn zen-btn-primary"
            style={{
              width: "100%",
              minHeight: "44px",
              fontSize: "var(--font-size-body)",
              fontWeight: 600,
              justifyContent: "center",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <span className="zen-spinner" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
