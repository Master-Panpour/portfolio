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
- Clean rewrites from `frontend/public/_redirects`

## Important Backend Note

Cloudflare Pages does not run the local Java backend directly. The public site will fall back to the bundled frontend profile data when `/api/profile` is unavailable.

Nyxora admin login and edit APIs currently require a backend runtime. To host Nyxora securely on Cloudflare's free stack, migrate those admin APIs to Cloudflare Pages Functions or Workers with a storage binding such as KV or D1.

## Direct Upload Alternative

If you do not want GitHub auto-deploys:

```powershell
cd frontend
npm ci
npm run build
npx wrangler pages deploy dist --project-name master-demon-portfolio
```

Use a Cloudflare API token with Pages deploy permissions. Do not commit tokens into the repository.
