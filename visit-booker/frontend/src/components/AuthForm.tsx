"use client";

import "../styles/auth.css";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
  email: string;
  password: string;
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
};

export default function AuthForm({
  mode,
  email,
  password,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
}: AuthFormProps) {
  return (
    <div className="auth">
      <h1 className="auth-title">{mode === "login" ? "Logowanie" : "Rejestracja"}</h1>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="auth-label">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            className="auth-input"
          />
        </label>
        <label className="auth-label">
          Hasło
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            className="auth-input"
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-submit">
          {mode === "login" ? "Zaloguj" : "Zarejestruj"}
        </button>
      </form>

      <button type="button" onClick={onToggleMode} className="auth-toggle">
        {mode === "login"
          ? "Nie masz konta? Zarejestruj"
          : "Masz konto? Zaloguj"}
      </button>
    </div>
  );
}
