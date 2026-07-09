# Sanskar Jaiswal Portfolio

A secure-by-default developer and cybersecurity portfolio with:

- Java 11 backend using the built-in HTTP server
- React + TypeScript frontend
- Editable information bulletin in `data/profile.json`
- OWASP-minded defaults: strict headers, origin checks, path traversal protection, no secrets in code, safe external links, and small API surface

## Project Structure

```text
backend/
  src/com/sanskar/portfolio/
    AccessLogger.java
    AdminApiHandler.java
    Environment.java
    LoggedHandler.java
    Main.java
    ProfileApiHandler.java
    SecurityHeaders.java
    StaticFileHandler.java
frontend/
  src/
    App.tsx
    data/profileFallback.ts
    data/musicTracks.ts
    main.tsx
    styles.css
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  public/
    _headers
    _redirects
data/
  profile.json
.env.example
```

## Secrets And Environment

No credentials should be committed to Git. Use `.env.example` as the template, then create a local `.env` file:

```powershell
Copy-Item .env.example .env
```

Fill secret values only inside `.env`. The backend reads configuration in this order:

1. JVM system property
2. Operating system environment variable
3. Local `.env` file
4. Safe default

The frontend does not need secrets. Vite only exposes variables prefixed with `VITE_`, so do not place tokens or private credentials in `frontend/.env`.

## Run Backend

```powershell
$classes = "$env:TEMP\portfolio-backend"
New-Item -ItemType Directory -Force -Path $classes
javac -d $classes backend/src/com/sanskar/portfolio/*.java
java -cp $classes com.sanskar.portfolio.Main
```

Backend defaults to `http://localhost:8080`.

Useful environment variables:

- `PORT`: backend port, default `8080`
- `PORTFOLIO_ALLOWED_ORIGINS`: comma-separated allowed origins, default `http://localhost:5173,http://127.0.0.1:5173`
- `PORTFOLIO_DATA_PATH`: profile JSON path, default `data/profile.json`
- `PORTFOLIO_ACCESS_LOG_PATH`: access log path, default `data/access-log.jsonl`
- `PORTFOLIO_THM_CACHE_PATH`: TryHackMe cache path, default `data/thm-rooms.json`
- `PORTFOLIO_ADMIN_TOKEN`: required 24+ character bearer token for Nyxora admin actions

## Nyxora Admin Portal

Nyxora is not rendered inside the public portfolio page. It is served as a separate protected admin page.

Start at the token gateway:

```text
http://localhost:8080/not-allowed
```

Enable it by creating a private `.env` file from `.env.example`, then setting `PORTFOLIO_ADMIN_TOKEN` to a long random value in that local file. Start the backend normally:

```powershell
javac -d backend/out backend/src/com/sanskar/portfolio/*.java
java -cp backend/out com.sanskar.portfolio.Main
```

Do not use `vite preview` or static-only hosting for Nyxora access control. The protected `/nyxora` route is enforced by the Java backend, so production should serve the built frontend through that backend or a reverse proxy that preserves the same authentication boundary.

Nyxora can:

- Load and edit the live portfolio profile JSON from `data/profile.json`
- Save updates without touching source code
- Show recent access records from `data/access-log.jsonl`

Security notes:

- The public portfolio bundle does not render or link the admin portal.
- `/nyxora` redirects to the token gateway unless the Java backend has issued a valid admin session.
- The admin token is never bundled into frontend code and is never sent in a URL.
- The real admin token belongs in `.env`, an OS environment variable, or a production secret store.
- After successful login, the backend creates a 30-minute `HttpOnly`, `SameSite=Strict` session cookie.
- State-changing Nyxora requests require a matching `X-CSRF-Token` header.
- Login attempts are rate-limited per remote address.
- Profile saves are size-limited, object-validated, and written atomically with a `.bak` backup.
- Access logs store request metadata only: timestamp, method, path, remote address, user agent, and referer. Query strings, request bodies, and tokens are not logged.
- `data/access-log.jsonl`, `.bak`, and `.tmp` files are ignored by Git.

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173`.

## Build Frontend

```powershell
cd frontend
npm run build
```

After building, the Java backend can serve the static app from `frontend/dist`.

## Edit Music Tracks

The music deck uses small procedural synth loops, so there are no audio files to manage. Add, remove, or edit tracks in:

```text
frontend/src/data/musicTracks.ts
```

## TryHackMe Tracker

The backend exposes `GET /api/thm`. The frontend automatically reads it, adds recent solved rooms to the Bulletin Feed, and maps room skills/tags into the Arsenal tree.

Default cache file:

```text
data/thm-rooms.json
```

Expected shape:

```json
{
  "source": "cache",
  "updatedAt": "2026-07-07",
  "profileUrl": "https://tryhackme.com/p/your-username",
  "rooms": [
    {
      "title": "SOC Level 1",
      "completedAt": "2026-07-07",
      "difficulty": "Easy",
      "url": "https://tryhackme.com/room/example",
      "skills": ["SOC", "SIEM", "Log Analysis"]
    }
  ],
  "skills": [
    {
      "name": "Log Analysis",
      "domain": "soc",
      "level": "THM Practice",
      "rooms": ["SOC Level 1"]
    }
  ]
}
```

Optional live feed environment variables:

- `PORTFOLIO_THM_FEED_URL`: HTTPS JSON feed URL.
- `PORTFOLIO_THM_ALLOWED_HOSTS`: comma-separated allowlist, default `tryhackme.com,www.tryhackme.com,api.tryhackme.com`.
- `PORTFOLIO_THM_TOKEN`: optional bearer token, kept on the Java backend and never sent to the browser.
- `PORTFOLIO_THM_CACHE_PATH`: local cache JSON path, default `data/thm-rooms.json`.

## Verification Performed

- Java backend compiled successfully to `%TEMP%`.
- Smoke tested `GET /api/profile` with status `200`.
- Smoke tested `GET /api/health` with response `{"status":"ok"}`.
- React build was not completed because `npm install` timed out while downloading packages.

## Source Notes

