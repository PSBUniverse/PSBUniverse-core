"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Form } from "react-bootstrap";
import { getSupabase } from "@/core/supabase/client";
import psbLogo from "@/styles/psb_logo.png";
import { toastError, toastSuccess } from "@/shared/utils/toast";

function setAccessTokenCookie(session) {
  if (!session?.access_token) {
    return;
  }

  const maxAge = Number.isFinite(session.expires_in) ? session.expires_in : 3600;
  document.cookie = `sb-access-token=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

async function hasServerSession() {
  try {
    const response = await fetch("/api/me/bootstrap", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);
    return Boolean(payload?.authUser?.id);
  } catch {
    return false;
  }
}

async function waitForServerSession(maxAttempts = 4) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await hasServerSession()) {
      return true;
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 120);
    });
  }

  return false;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });
  const [inlineError, setInlineError] = useState("");
  const [shakeForm, setShakeForm] = useState(false);

  function validateFields(nextEmail, nextPassword) {
    const errors = {
      email: "",
      password: "",
    };

    const normalizedEmail = String(nextEmail || "").trim();
    const normalizedPassword = String(nextPassword || "").trim();

    if (!normalizedEmail) {
      errors.email = "Email is required.";
    } else if (!normalizedEmail.includes("@")) {
      errors.email = "Please enter a valid email address.";
    }

    if (!normalizedPassword) {
      errors.password = "Password is required.";
    }

    return errors;
  }

  function mapLoginError(errorMessage) {
    const text = String(errorMessage || "").toLowerCase();

    if (text.includes("invalid") || text.includes("credentials")) {
      return "Email or password is incorrect.";
    }

    if (text.includes("email not confirmed")) {
      return "Email is not confirmed. Check your inbox for the confirmation link.";
    }

    if (String(errorMessage || "").trim()) {
      return String(errorMessage);
    }

    return "Unable to sign in right now. Please try again.";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateFields(email, password);
    const hasValidationError = Boolean(validationErrors.email || validationErrors.password);

    setTouched({
      email: true,
      password: true,
    });
    setFieldErrors(validationErrors);

    if (hasValidationError) {
      setShakeForm(true);
      window.setTimeout(() => setShakeForm(false), 320);
      return;
    }

    setInlineError("");
    setSubmitting(true);

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setAccessTokenCookie(data?.session);
      await waitForServerSession();
      toastSuccess("Welcome to PSBUniverse. You have signed in successfully.", "Sign In Success");
      window.location.assign("/dashboard");
    } catch (error) {
      const message = mapLoginError(error?.message);
      setInlineError(message);
      toastError(message, "Sign In Failed", { durationMs: 4500 });
      setShakeForm(true);
      window.setTimeout(() => setShakeForm(false), 320);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEmailChange(event) {
    const nextValue = event.target.value;
    setEmail(nextValue);
    setInlineError("");

    if (touched.email || fieldErrors.email) {
      const validationErrors = validateFields(nextValue, password);
      setFieldErrors((previous) => ({
        ...previous,
        email: validationErrors.email,
      }));
    }
  }

  function handlePasswordChange(event) {
    const nextValue = event.target.value;
    setPassword(nextValue);
    setInlineError("");

    if (touched.password || fieldErrors.password) {
      const validationErrors = validateFields(email, nextValue);
      setFieldErrors((previous) => ({
        ...previous,
        password: validationErrors.password,
      }));
    }
  }

  function handleFieldBlur(fieldName) {
    setTouched((previous) => ({
      ...previous,
      [fieldName]: true,
    }));

    const validationErrors = validateFields(email, password);
    setFieldErrors((previous) => ({
      ...previous,
      [fieldName]: validationErrors[fieldName],
    }));
  }

  function handlePasswordToggle() {
    setShowPassword((previous) => !previous);
  }

  return (
    <div className="portal-login-shell">
      <div className="portal-login-split">
        <aside className="portal-login-brand" aria-hidden="true">
          <div className="portal-login-brand-inner">
            <Image src={psbLogo} alt="PSBUniverse logo" className="portal-login-logo" priority />
            <h1 className="psb-title mb-3">PSBUniverse</h1>
            <p className="psb-label mb-2">Operations Workspace</p>
            <p className="portal-brand-copy mb-0">Manage apps, users, and operations in one place.</p>
          </div>
        </aside>

        <main className="portal-login-main">
          <section className={`portal-login-form-shell ${shakeForm ? "portal-login-form-shake" : ""}`}>
            <header className="portal-login-header">
              <h2 className="portal-login-title mb-2">Sign in to PSBUniverse</h2>
              <p className="portal-login-subtitle mb-0">Enter your credentials to continue</p>
            </header>

            <Form noValidate onSubmit={handleSubmit} className="portal-login-form">
              <Form.Group controlId="login-email">
                <Form.Label className="portal-login-label">Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleFieldBlur("email")}
                  placeholder="Enter your email"
                  autoComplete="email"
                  autoFocus
                  required
                  className="portal-login-input"
                  isInvalid={Boolean(touched.email && fieldErrors.email)}
                  aria-describedby={touched.email && fieldErrors.email ? "login-email-error" : undefined}
                />
                {touched.email && fieldErrors.email ? (
                  <div id="login-email-error" className="portal-field-error" role="alert">
                    {fieldErrors.email}
                  </div>
                ) : null}
              </Form.Group>

              <Form.Group controlId="login-password">
                <Form.Label className="portal-login-label">Password</Form.Label>
                <div className="portal-password-field">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleFieldBlur("password")}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="portal-login-input portal-password-input"
                    isInvalid={Boolean(touched.password && fieldErrors.password)}
                    aria-describedby={
                      touched.password && fieldErrors.password ? "login-password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    className="portal-password-toggle"
                    onClick={handlePasswordToggle}
                    onMouseDown={(event) => event.preventDefault()}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                {touched.password && fieldErrors.password ? (
                  <div id="login-password-error" className="portal-field-error" role="alert">
                    {fieldErrors.password}
                  </div>
                ) : null}
              </Form.Group>

              {inlineError ? (
                <div className="portal-inline-error" role="alert" aria-live="assertive">
                  {inlineError}
                </div>
              ) : null}

              <Button type="submit" variant="primary" className="portal-signin-btn w-100" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Signing in...
                  </>
                ) : "Sign In"}
              </Button>
            </Form>

            <p className="portal-support-note mb-0">Need access? Contact admin</p>
          </section>
        </main>
      </div>
    </div>
  );
}
