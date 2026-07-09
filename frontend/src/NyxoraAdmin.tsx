import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { LogOut, RefreshCw, Save, ShieldCheck, Terminal } from "lucide-react";
import "./nyxora.css";

type AdminLogEntry = {
  ts?: string;
  method?: string;
  path?: string;
  remote?: string;
  userAgent?: string;
  referer?: string;
};

const redirectToLogin = () => {
  window.location.replace("/not-allowed");
};

const readCookie = (name: string) => {
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
};

const NyxoraAdmin = () => {
  const [profileJson, setProfileJson] = useState("");
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [status, setStatus] = useState("Nyxora online. Session bound to HttpOnly backend cookie.");
  const [isBusy, setIsBusy] = useState(false);

  const adminFetch = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    const method = (init.method ?? "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      const csrfToken = readCookie("NYXORA_CSRF");
      if (csrfToken) {
        headers.set("X-CSRF-Token", csrfToken);
      }
    }

    const response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers
    });

    if (response.status === 401) {
      redirectToLogin();
      throw new Error("Session expired.");
    }

    return response;
  };

  const loadProfile = async () => {
    setIsBusy(true);
    setStatus("Loading editable profile data...");
    try {
      const response = await adminFetch("/api/admin/profile");
      if (!response.ok) {
        throw new Error(`Profile endpoint returned ${response.status}`);
      }
      const data = await response.json();
      setProfileJson(JSON.stringify(data, null, 2));
      setStatus("Profile loaded. Validate JSON before saving.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profile load failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const saveProfile = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(profileJson);
    } catch {
      setStatus("Profile JSON is invalid. Fix syntax before saving.");
      return;
    }

    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      setStatus("Profile must remain a single JSON object.");
      return;
    }

    setIsBusy(true);
    setStatus("Saving profile...");
    try {
      const response = await adminFetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed, null, 2)
      });
      if (!response.ok) {
        throw new Error(`Save endpoint returned ${response.status}`);
      }
      setStatus("Profile saved. Refresh the public page to see updates.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profile save failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const loadLogs = async () => {
    setIsBusy(true);
    setStatus("Loading access log tail...");
    try {
      const response = await adminFetch("/api/admin/logs");
      if (!response.ok) {
        throw new Error(`Log endpoint returned ${response.status}`);
      }
      const data = (await response.json()) as AdminLogEntry[];
      setLogs(Array.isArray(data) ? data.reverse() : []);
      setStatus("Access log loaded. Newest entries first.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Access log load failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const logout = async () => {
    setIsBusy(true);
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
    } finally {
      redirectToLogin();
    }
  };

  useEffect(() => {
    loadProfile();
    loadLogs();
  }, []);

  return (
    <main className="nyxora-shell">
      <div className="nyxora-grid-bg" aria-hidden="true" />
      <header className="nyxora-topbar">
        <a className="nyxora-brand" href="/nyxora" aria-label="Nyxora admin home">
          <ShieldCheck size={22} />
          <span>Nyxora</span>
        </a>
        <div className="nyxora-actions">
          <a href="/" className="nyxora-ghost-link">
            Portfolio
          </a>
          <button disabled={isBusy} onClick={logout} type="button">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <section className="nyxora-console" aria-labelledby="nyxora-title">
        <div className="nyxora-console-head">
          <div>
            <p className="nyxora-kicker">Authenticated admin portal</p>
            <h1 id="nyxora-title">Nyxora Nexus</h1>
          </div>
          <span>
            <ShieldCheck size={16} />
            HttpOnly session
          </span>
        </div>

        <div className="nyxora-toolbar">
          <button disabled={isBusy} onClick={loadProfile} type="button">
            <RefreshCw size={16} />
            Reload Profile
          </button>
          <button disabled={isBusy || !profileJson.trim()} onClick={saveProfile} type="button">
            <Save size={16} />
            Save Profile
          </button>
          <button disabled={isBusy} onClick={loadLogs} type="button">
            <Terminal size={16} />
            Refresh Logs
          </button>
        </div>

        <p className="nyxora-status">{status}</p>

        <div className="nyxora-workspace">
          <section className="nyxora-panel" aria-label="Editable portfolio profile JSON">
            <div className="nyxora-subhead">
              <h2>Profile Editor</h2>
              <small>data/profile.json</small>
            </div>
            <textarea
              maxLength={128000}
              onChange={(event) => setProfileJson(event.target.value)}
              placeholder="Profile data loading..."
              spellCheck={false}
              value={profileJson}
            />
          </section>

          <section className="nyxora-panel" aria-label="Access log entries">
            <div className="nyxora-subhead">
              <h2>Access Log</h2>
              <small>metadata only</small>
            </div>
            <div className="nyxora-log-list">
              {logs.length === 0 ? (
                <p>No log entries loaded.</p>
              ) : (
                logs.map((entry, index) => (
                  <article className="nyxora-log" key={`${entry.ts}-${entry.path}-${index}`}>
                    <span>{entry.ts ?? "unknown time"}</span>
                    <strong>
                      {entry.method ?? "GET"} {entry.path ?? "/"}
                    </strong>
                    <small>
                      {entry.remote || "local"} / {entry.userAgent || "unknown agent"}
                    </small>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NyxoraAdmin />
  </React.StrictMode>
);
