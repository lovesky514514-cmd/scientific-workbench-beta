# Cloudflare deployment (requires owner's official login)

**Not deployed.** GitHub Pages can stay online even without Cloudflare; the issue/claim interface stays disabled.

1. In this directory: `npm install`, `npm test`, `npm run check`.
2. `npx wrangler login` (official Cloudflare browser login; do not paste tokens into chat).
3. `npx wrangler d1 create scientific-workbench-beta` and put the returned real UUID in `wrangler.jsonc`.
4. Verify the target account and database, then `npx wrangler d1 migrations apply scientific-workbench-beta --remote`.
5. Create Turnstile for hostname `lovesky514514-cmd.github.io`; store Site Key publicly only after backend is verified.
6. `npx wrangler secret put ADMIN_TOKEN`, `npx wrangler secret put HMAC_PEPPER`, `npx wrangler secret put TURNSTILE_SECRET`. All secrets must be distinct, high entropy and kept out of Git.
7. `npm run deploy`. Verify `/api/status` shows closed defaults; verify wrong admin token is denied and correctly configured backend works.
8. Run real D1/Turnstile tests, concurrent issuance/revocation, permissions and leakage audit; require Access+MFA for production admin use.
9. Update Pages `config.js` with the real Worker HTTPS origin and public Turnstile Site Key only after verification; check public status via `/api/status` and perform full browser regression.
10. Only publish real vetted installer, calculate SHA-256 from the actual file, clear RC blockers for the selected candidate, then manually issue first real `001XX`.

**This is a source deployment, NOT a production release sign-off.**
