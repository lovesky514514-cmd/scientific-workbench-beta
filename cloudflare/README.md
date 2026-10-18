# Cloudflare beta backend · 001 pilot

> STATUS: SOURCE HANDOFF PENDING / NOT DEPLOYED / NOT ISSUED. This file is a deployment tracker, not a live release.

## Frozen boundaries

- The public beta website remains on GitHub Pages; do not replace its approved layout.
- API and admin actions run on Cloudflare Workers + D1, not the user's personal computer.
- The public website's `config.js` remains disabled until verified API deployment.
- Test identities are `001AA`–`999ZZ` (three-digit, monotonic sequence; two randomly generated uppercase letters). Input is case-insensitive.
- A test identity is **not** an authorization secret. Issue a separate cryptographically secure invitation code on the server.
- Only the administrator can manually approve, issue, and revoke; no auto-issuance.
- Never add D1 UUID placeholders as real database IDs, real invitation codes, admin tokens, HMAC pepper, Turnstile secret, applicant email addresses, or private bearer download URLs to Git.
- The RC5.1 build remains subject to `RC51_RELEASE_BLOCKERS_OPEN`; do not publish an installation link without the actual artifact's SHA-256 and required test evidence.

## Delivery status

- [x] Isolated GitHub branch created for preparing the Cloudflare handoff.
- [ ] Complete backend source uploaded and reviewed in this branch.
- [ ] D1 provisioned, migrations applied to the correct Cloudflare account.
- [ ] Turnstile site created and real server-side verification checked.
- [ ] Worker secrets installed using official login (never via chat or GitHub).
- [ ] Worker deployed and public endpoints verified with fail-closed defaults.
- [ ] Public website `config.js` connected and browser regression checked.
- [ ] Real beta installation file hash and clean Windows install verified.
- [ ] FIRST tester invitation actually issued, displayed as `001XX` (suffix assigned at issuance).
- [ ] `001XX` verification, expiry/revocation, download access and logging tested.

## One-time Cloudflare setup

The deployment project uses Wrangler CLI. The person owning the Cloudflare account must authorize `npx wrangler login`, create the D1 database, apply the migration, configure the Turnstile site/secret, and install `ADMIN_TOKEN`, `HMAC_PEPPER`, `TURNSTILE_SECRET` as Worker secrets.

A personal computer is **not** used as a 24/7 server. Only the one-time official authorization and artifact management requires a local session, unless performed through a separately authorized deployment environment.

## Safety gate for the first tester

No real `001XX` number or invite has been created by adding this tracker. First release must stay closed until the service is deployed, audited, and the administrator explicitly issues it. Do not put the invite code in a public GitHub release, issue, Pages source, or commit.

## Handoff package

The previous conversation generated `Scientific_Workbench_Cloudflare_Backend_Handoff.zip` (SHA-256 `6f4771225dba2bcef3c8101b4270256f86b62a322d1cf3b9be3af0f7d3e4abc5`), containing Worker source, D1 migration, admin site and tests. This tracker deliberately does **not** claim the ZIP or unpacked sources are already in the repository. Verify a full source upload separately before deployment.
