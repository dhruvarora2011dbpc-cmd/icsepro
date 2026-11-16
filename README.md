# ICSE Study Hub: publish pack

Two folders:
- `site/`    -> upload THIS to GitHub / Netlify / Cloudflare Pages (it is public).
- `worker/`  -> deploy from your own computer. Do NOT upload it to a public repo.

## 0. Protect your identity first (5 minutes)
1. Make a NEW GitHub account with a username that is not your real name, and a separate email address for it.
2. GitHub > Settings > Emails: tick "Keep my email addresses private" and "Block command line pushes that expose my email".
3. In `site/index.html` search for `const CONTACT_EMAIL=""` and put a dedicated alias address (not your personal one) or leave it empty.
4. Never put an API key in any file. Keys go in with `wrangler secret put`, nowhere else.

## 1. Put the site online (GitHub Pages)
1. github.com > New repository (Public), name it e.g. `icse-hub`.
2. Add file > Upload files > drag in everything inside `site/` > Commit.
3. Settings > Pages > Deploy from a branch > main / (root) > Save.
4. Your address appears in about a minute.

## 2. Optional: AI for everyone (worker/)
1. Install Node, then in the `worker/` folder: `npm i -g wrangler` and `wrangler login`
2. `wrangler kv namespace create RATE`  (paste the id into wrangler.toml)
3. In wrangler.toml set ALLOWED_ORIGIN to your site origin, e.g. `https://yourname.github.io` (no path, no trailing slash)
4. `wrangler secret put GEMINI_API_KEY`  (paste your key when asked)
5. `wrangler deploy`  -> copy the https://....workers.dev address it prints
6. Open `site/index.html`, set `let AI_PROXY="https://....workers.dev";`, re-upload.

Without step 2 everything still works except the AI features, which ask users for their own key.
