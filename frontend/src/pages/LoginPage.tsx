import type { FormEvent } from "react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { COPY } from "../lib/validators";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/complaints";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        setError(COPY.loginError);
      } else {
        setError(COPY.loginServerError);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h1>{COPY.loginTitle}</h1>

      {error ? (
        <p role="alert" className="banner error">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">{COPY.usernameLabel}</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <label htmlFor="password">{COPY.passwordLabel}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button type="submit" disabled={isSubmitting}>
          {COPY.loginButton}
        </button>
      </form>
    </section>
  );
}
