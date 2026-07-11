# Cloudflare Pages Deployment

This project is ready for Cloudflare Pages on the free tier.

## Recommended Dashboard Deploy

Use this when the code is pushed to GitHub.

1. Open the Cloudflare dashboard.
2. Go to `Workers & Pages`.
3. Select `Create application`.
4. Choose `Pages`.
5. Choose `Connect to Git`.
6. Select the GitHub repository that contains this portfolio.
7. Use these build settings:

```text
Framework preset: React (Vite)
Root directory: frontend
Build command: npm run build
Build output directory: dist
Production branch: main
```

Cloudflare's current React/Vite Pages preset uses `npm run build` and `dist`.

## What Works On Pages

- Public portfolio UI
- Viewer mode and recruiter mode
- Hash navigation
- Static TryHackMe cache from `frontend/public/thm-rooms.json`
- Resume, images, music synth, and contact mail draft
- Secure headers from `frontend/public/_headers`
- Nyxora admin APIs through Cloudflare Pages Functions
- Editable profile data stored in Cloudflare KV
- Access-log metadata stored in Cloudflare KV

## Connect Nyxora Admin On Cloudflare

Cloudflare Pages does not run the local Java backend directly, so Nyxora uses Pages Functions and KV when deployed to Cloudflare.

Create the storage binding:

1. In Cloudflare, go to `Workers & Pages`.
2. Open your Pages project.
3. Go to `Settings > Bindings`.
4. Add a `KV namespace`.
5. Create or select a namespace such as `portfolio-admin`.
6. Set the binding variable name to exactly:

```text
PORTFOLIO_KV
```

Create the encrypted admin token:

1. Go to `Settings > Variables and Secrets`.
2. Add a production secret.
3. Use this variable name:

```text
PORTFOLIO_ADMIN_TOKEN
```

4. Set the value to a long random token with at least 24 characters.
5. Select `Encrypt` / secret mode before saving.

Optional Nyxora email alerts:

Nyxora can send security alerts for successful admin logins and failed-login thresholds. This uses the Resend Email API from Cloudflare Pages Functions.

Add these Cloudflare variables/secrets:

```text
NYXORA_ALERT_RESEND_API_KEY
NYXORA_ALERT_TO
NYXORA_ALERT_FROM
NYXORA_ALERT_COOLDOWN_SECONDS
```

Recommended setup:

- `NYXORA_ALERT_RESEND_API_KEY`: encrypted secret. Resend API key.
- `NYXORA_ALERT_TO`: encrypted secret or variable. One destination email address, or comma-separated addresses.
- `NYXORA_ALERT_FROM`: variable. Verified sender, for example `Nyxora <alerts@your-domain.com>`.
- `NYXORA_ALERT_COOLDOWN_SECONDS`: optional variable, default `900`.

Alerts do not include tokens, cookies, request bodies, or profile JSON. They include only event type, timestamp, source IP, method, path, user agent, referer, and failed-attempt count when relevant.

Redeploy after adding the KV binding and secret. Functions receive bindings and secrets on `context.env`, and Cloudflare requires a redeploy before new bindings are active.

The project does not define a `_redirects` file for Nyxora. Cloudflare Pages already serves HTML files at extensionless routes, so `not-allowed.html` is available at `/not-allowed` and `nyxora.html` is available at `/nyxora`. Keeping manual `.html` rewrites can cause redirect loops with Pages' default route matching.

Nyxora endpoints on Cloudflare:

```text
/not-allowed
/nyxora
/api/admin/login
/api/admin/profile
/api/admin/logs
/api/admin/logout
/api/profile
```

Security behavior:

- The admin token is stored only as a Cloudflare encrypted secret.
- `/nyxora` and `/nyxora.html` redirect to `/not-allowed` unless a valid session exists.
- Login creates a random `HttpOnly`, `Secure`, `SameSite=Strict` session cookie.
- State-changing admin requests require the `X-CSRF-Token` header.
- Failed token logins are rate-limited per source IP.
- Email alerts are sent on successful admin login and failed-login threshold when alert variables are configured.
- Profile edits are size-limited, JSON-object validated, and backed up in KV for 30 days.
- Access logs store metadata only: timestamp, method, path, remote IP, user agent, and referer. Query strings, request bodies, and tokens are not logged.

If `PORTFOLIO_KV` or `PORTFOLIO_ADMIN_TOKEN` is missing, Nyxora returns a `503` configuration error instead of failing open.

## Direct Upload Alternative

If you do not want GitHub auto-deploys:

```powershell
cd frontend
npm ci
npm run build
npx wrangler pages deploy dist --project-name master-demon-portfolio
```

Use a Cloudflare API token with Pages deploy permissions. Do not commit tokens into the repository.
