# Deploy on Netlify

## Local dev

```bash
corepack enable
pnpm install
pnpm dev
```

Visit http://localhost:8080/v1/healthz.

## Netlify (connected to GitHub)

1. New site from GitHub → select the repo.
2. Build command: `pnpm build`
3. Publish dir: `apps/widget/dist` (or `docs` if no widget)
4. Environment variables (Site settings → Build & deploy → Environment):
   - All from `.env.example` (server-only ones go to “Environment variables”; browser ones start with `NEXT_PUBLIC_`).
5. Deploy.

Test: `https://<yoursite>.netlify.app/v1/healthz` should return JSON.

## Netlify CLI (optional)

```bash
pnpm netlify:dev    # runs functions + static locally
```
