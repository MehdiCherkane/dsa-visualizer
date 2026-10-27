# Deploying DS Visualizer to Cloudflare Pages (free)

DS Visualizer is a static single-page app: no backend, no Functions, no database, and no runtime configuration. Cloudflare Pages free plan is enough.

- **Repository:** `MehdiCherkane/dsa-visualizer`
- **Production branch:** `main`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Artifact:** `dist/index.html` (~1.0 MB, ~300 kB gzip), two small SVGs, and one optional PDF per chapter under `dist/cours/`; the largest file is far below the 25 MiB limit.

`dist/` is gitignored on purpose: it is rebuilt from source on every deploy. The current branch builds with **320 tests passing**.

**Before you start:** push the commit you want to deploy to `origin/main`. Cloudflare builds from GitHub, never from your working tree.

---

## Option A — Git integration (recommended)

Every push to `main` builds and deploys automatically; other branches get free preview URLs.

### 1. Create the Pages project

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Authorize Cloudflare for GitHub if asked, then select **`MehdiCherkane/dsa-visualizer`**.
4. Project name: `dsa-visualizer` (the site becomes `https://dsa-visualizer.pages.dev`; Cloudflare appends a suffix if the name is taken).
5. Production branch: **`main`**.

### 2. Build settings

| Field | Value |
|---|---|
| Framework preset | **None** (or **React (Vite)**, which fills the same values) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *leave blank* |
| Node.js version | default **22.23.4** is fine; optionally add `NODE_VERSION=22` |

`npm run build` runs `tsc -b && vite build` and writes the single-file bundle into `dist`. Cloudflare installs dependencies automatically; do not add an install command.

**Course PDFs:** place them in `public/cours/` and commit them. Pages builds only what is pushed to GitHub, so a PDF left on your desktop or in `dist/` alone will not be deployed.

Optional hardening: in **Settings → Environment variables**, add `NODE_VERSION=22` to **both** Production and Preview, so a future build-image update cannot silently change the major Node version.

### 3. Deploy

Select **Save and deploy**. The first build takes about a minute; follow the log in **Deployments**. When it turns green, open the `*.pages.dev` URL.

No `_redirects`, `_headers`, `200.html` or SPA fallback is needed. All navigation uses hash routes (`#/chapitre-1` … `#/chapitre-6`), so Pages only ever serves the root document and its assets.

---

## Option B — Direct Upload (fallback for tonight)

Use this only if GitHub authorization is a blocker. It uploads the already-built `dist/` and does not build on Cloudflare.

```bash
npm ci
npm run build

npx wrangler login
npx wrangler pages project create dsa-visualizer   # choose production branch: main
npx wrangler pages deploy dist --project-name=dsa-visualizer
```

The Wrangler commands are free. The project is served at `https://dsa-visualizer.pages.dev`.

You can also drag and drop `dist/` in the dashboard: **Workers & Pages → Create application → Pages → Drag and drop your files**.

**Choose deliberately:** a project cannot be converted between Direct Upload and Git integration later. If you want automatic deploys, use Option A now or create a second Git-connected project later.

---

## Custom domain (optional)

1. **Workers & Pages** → `dsa-visualizer` → **Custom domains** → **Set up a domain**.
2. Enter the domain and confirm.

- **Subdomain** (for example `visualiseur.example.com`): create a `CNAME` to `dsa-visualizer.pages.dev` at your DNS provider if the zone is not on Cloudflare.
- **Apex domain** (for example `example.com`): the domain must be a Cloudflare zone with Cloudflare nameservers; Cloudflare then creates the record for you.

HTTPS is provisioned automatically. Domains activate in minutes, sometimes up to 24 hours for DNS propagation.

---

## Post-deploy smoke test

Run through this once on the production URL:

1. **Menu:** six active chapter cards, no “Bientôt disponible” card.
2. **Routes:** open `#/chapitre-1` … `#/chapitre-6` directly, refresh each one, then use browser back/forward.
3. **Navigation:** `← Menu` and `Échap` return to the menu.
4. **Chapter 1:** each of the four profiles loads (pile, file ordinaire, file décalage, file circulaire).
5. **Course PDF:** the document button opens the matching chapter PDF in a right-side drawer; player shortcuts are suspended while it is open, the left edge resizes it, and `Échap` closes it.
6. **File 3 · circulaire:** run the trace, the reuse scenario, and a full state; check the `(av + 1) % 5` / `(ar + 1) % 5` card, the memory cell colours, and hover/keyboard focus linking.
7. **Playback:** play, step forward/back, speed, reset, scenario picker.
8. **Theme and presentation:** toggle dark theme and `P` presentation mode; code stays readable.
9. **Layouts:** 1920×1080, 1366×768, and a narrow window (~900 px).
10. **Console:** DevTools → Console shows no errors; Network shows no third-party requests (opening the drawer only fetches the same-origin PDF).

Note: the hosted site has no service worker, so a first visit needs network access. The app itself makes no further requests; for true offline use, open the locally built `dist/index.html` directly.

---

## Updating and rolling back

- **Update:** push to `main` → Pages rebuilds and promotes the deployment.
- **Preview:** push any other branch → preview URL `https://<branch>.dsa-visualizer.pages.dev`. Builds count toward the monthly quota; restrict branches in **Settings → Builds & deployments** if needed.
- **Rollback:** **Deployments** → find the last good production deployment → three-dot menu → **Rollback to this deployment**. Takes effect immediately. Preview deployments are not rollback targets.

---

## Free plan limits

| Limit | Free plan |
|---|---|
| Builds | 500 per month, 1 concurrent, 20-minute timeout |
| Static files per site | 20,000 |
| Max file size | 25 MiB |
| Custom domains per project | 100 |
| Projects per account | 100 |
| Preview deployments | unlimited |

This project uses 3 app files plus one PDF per chapter, one build per push, and a 1.0 MB entry file, so the free plan is comfortable.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails on an unsupported Node version | Set `NODE_VERSION=22` for both environments and redeploy |
| `tsc -b` error in the build log | Run `npm run build` locally and fix the type error; the deploy uses the same command |
| Blank page | Check that **Build output directory** is exactly `dist` and that the build log contains `dist/index.html` |
| `/chapitre-1` returns 404 | Use `/#/chapitre-1`; chapter URLs are hash routes, not server paths |
| Old content after a deploy | Hard refresh (`Ctrl+F5`); production HTML is replaced on each successful deploy |
| Custom domain stuck pending | Verify the CNAME or nameservers; apex domains must be on the same Cloudflare account |
