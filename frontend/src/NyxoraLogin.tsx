import React, { FormEvent, useState } from "react";
import { createRoot } from "react-dom/client";
import { Lock, ShieldCheck } from "lucide-react";
import "./nyxora.css";

const NyxoraLogin = () => {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("Enter the backend admin token to unlock Nyxora.");
  const [isBusy, setIsBusy] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (token.trim().length < 24) {
      setStatus("Token must be at least 24 characters.");
      return;
    }

    setIsBusy(true);
    setStatus("Validating token...");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        credentials: "same-origin",
        body: token.trim()
      });

      if (!response.ok) {
        throw new Error(response.status === 401 ? "Token rejected." : `Login failed with ${response.status}.`);
      }

      setToken("");
      setStatus("Access granted. Opening Nyxora...");
      window.location.replace("/nyxora");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="nyxora-shell nyxora-shell--login">
      <div className="nyxora-grid-bg" aria-hidden="true" />
      <section className="nyxora-login-card" aria-labelledby="nyxora-login-title">
        <div className="nyxora-brand">
          <ShieldCheck size={24} />
          <span>Nyxora</span>
        </div>
        <p className="nyxora-kicker">Admin gateway</p>
        <h1 id="nyxora-login-title">Restricted Control Plane</h1>
        <form className="nyxora-login-form" onSubmit={submitLogin}>
          <label htmlFor="nyxora-token">Admin Token</label>
          <div className="nyxora-token-field">
            <Lock size={18} />
            <input
              autoComplete="off"
              autoFocus
              id="nyxora-token"
              maxLength={160}
              onChange={(event) => setToken(event.target.value)}
              placeholder="PORTFOLIO_ADMIN_TOKEN"
              spellCheck={false}
              type="password"
              value={token}
            />
          </div>
          <button disabled={isBusy} type="submit">
            <ShieldCheck size={18} />
            Unlock Nyxora
          </button>
        </form>
        <p className="nyxora-status">{status}</p>
      </section>
    </main>
  );
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NyxoraLogin />
  </React.StrictMode>
);
