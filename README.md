# Wildfire Ventilation

Interactive React platform for exploring wildfire-smoke ventilation experiments, indoor exposure response, CAVE-style test setups, and evidence-led mitigation decisions.

## Live Site

After GitHub Pages deploys, the site is available at:

```text
https://<your-github-username>.github.io/wildfire-ventilation/
```

## Run Locally

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Screens are directly addressable with `?screen=1` through `?screen=4`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm test` | Run deterministic engine acceptance tests. |
| `pnpm check` | Run TypeScript validation without emitting files. |
| `pnpm build` | Produce the production bundle in `dist/public`. |
| `pnpm preview` | Preview the production bundle locally. |

## Deployment

This repository is configured for GitHub Pages through `.github/workflows/pages.yml`.

Every push to `main` installs dependencies, builds the Vite app with the `/wildfire-ventilation/` base path, uploads `dist/public`, and deploys the site with GitHub Pages.
