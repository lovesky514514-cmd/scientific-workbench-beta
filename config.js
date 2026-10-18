/* Public browser settings only. Never store invite codes, admin keys or download links here. */
window.SWB_CONFIG = Object.freeze({
  apiBase: "https://scientific-workbench-beta-api.lovesky514514.workers.dev", // Cloudflare Worker public API
  turnstileSiteKey: "0x4AAAAAAFZ6eofVi1mEQLRR", // Cloudflare Turnstile PUBLIC site key
  githubUrl: "https://github.com/lovesky514514-cmd/scientific-workbench-beta",                // Optional, public repository URL
  supportEmail: ""             // Set before opening email applications
});