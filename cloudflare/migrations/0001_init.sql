-- Default closed. The tester number is an identity, not an authentication secret.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS release_settings (
 id INTEGER PRIMARY KEY CHECK(id=1), version TEXT NOT NULL DEFAULT '', download_url TEXT NOT NULL DEFAULT '',
 sha256 TEXT NOT NULL DEFAULT '', extraction_code TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
 applications_open INTEGER NOT NULL DEFAULT 0 CHECK(applications_open IN(0,1)),
 claims_open INTEGER NOT NULL DEFAULT 0 CHECK(claims_open IN(0,1)),
 published INTEGER NOT NULL DEFAULT 0 CHECK(published IN(0,1)),updated_at INTEGER NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO release_settings(id) VALUES(1);
CREATE TABLE IF NOT EXISTS applications (
 id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),
 consent_at INTEGER NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS invitations (
 seq INTEGER PRIMARY KEY AUTOINCREMENT CHECK(seq BETWEEN 1 AND 999),
 suffix TEXT NOT NULL CHECK(length(suffix)=2 AND suffix GLOB '[A-Z][A-Z]'),
 code_hmac TEXT NOT NULL UNIQUE,
 application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
 expires_at INTEGER,revoked_at INTEGER,created_at INTEGER NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS invitations_application_once_idx ON invitations(application_id) WHERE application_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS tester_sessions (
 token_hmac TEXT PRIMARY KEY,tester_seq INTEGER NOT NULL REFERENCES invitations(seq) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS tester_sessions_expiry_idx ON tester_sessions(expires_at);
CREATE TABLE IF NOT EXISTS feedback (
 id INTEGER PRIMARY KEY AUTOINCREMENT,tester_seq INTEGER NOT NULL REFERENCES invitations(seq),
 kind TEXT NOT NULL,severity TEXT NOT NULL,title TEXT NOT NULL,details TEXT NOT NULL,
 error_code TEXT NOT NULL DEFAULT '',version TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (
 key TEXT NOT NULL,bucket INTEGER NOT NULL,hits INTEGER NOT NULL DEFAULT 0,expires_at INTEGER NOT NULL,PRIMARY KEY(key,bucket));
CREATE INDEX IF NOT EXISTS rate_limits_expiry_idx ON rate_limits(expires_at);
