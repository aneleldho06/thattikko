# LabDrop — temporary phone-to-computer transfer

A no-login tool: your phone creates a short-lived session with a 6-digit code, the lab computer enters that code, and code/text/images/files appear on the computer instantly. Everything disappears when the session expires or you end it.

## What gets built

**Landing page (`/`)**
- LabDrop name, logo (phone arrow computer), tagline "Transfer to shared computers. Without signing in."
- Create Session / Join Session buttons, three benefit cards (No Login, Temporary, Fast).
- Clean light design, indigo accent, no heavy animation — fast on old lab PCs.

**Phone: create session (`/session`)**
- Duration picker: 5 / 15 / 30 / 60 minutes (default 15).
- Shows the 6-digit code in large digits, countdown timer, connection status ("Waiting for computer" then "Connected — Lab Computer").
- Send panel with tabs: Code, Text, Image, File.
  - Code tab: CodeMirror editor with line numbers, syntax highlighting, language selector (C, C++, Java, Python, JavaScript, HTML, CSS, SQL, JSON, Bash, Plain text), auto language guess from content, clear button.
  - File tab: drag/pick, 25 MB cap, live upload progress bar, allowed types only.
- Transfer list with times and names, delete-one, End Session button.

**Computer: join (`/connect`)**
- Six-digit input boxes, paste-friendly, keyboard-friendly, Connect button.
- After pairing: big "Connected" banner, countdown, and a stream of received items newest-first.
- Code items render monospaced with highlighting and a prominent COPY CODE button plus Select All.
- Images preview inline; PDFs preview in-browser; every file gets a Download button.
- Expired state: "Session Expired — your temporary data has been deleted" + Create New Session.

**Errors handled**: invalid code, expired session, session already has a computer, file too large, disallowed type, connection interrupted (auto-reconnect banner).

## Security model

- Session id, session secret, and device tokens generated with crypto-grade randomness.
- The 6-digit code is stored only as a hash and is single-use for pairing; after pairing both devices use their own opaque device token.
- Brute force: failed-attempt counter per code and per client, with temporary lockout after repeated misses.
- Server-side validation of file type and size; no raw content logged.
- Sessions expire automatically (max 1 hour) whether or not the browser closes; expired tokens are rejected.
- A scheduled cleanup job deletes expired sessions, transfers, and stored files.
- No accounts, no Google/email login anywhere.

**Honest note on encryption:** true end-to-end encryption can't be keyed off a 6-digit code without weakening it, so v1 does not claim E2E. Content is encrypted in transit (HTTPS), stored briefly under access rules that only the two paired devices pass, and deleted on expiry. The UI will describe it exactly that way rather than overstating. A future version can add a scanned QR that carries a real key.

## Direction

Phone to computer first, but transfers carry a direction field and the realtime channel is symmetric, so "Send to Phone" can be added later without rework.

## Technical details

- Lovable Cloud (Postgres + Realtime + Storage) as the backend; no separate socket server to deploy.
- Tables: `sessions` (id, pairing_code_hash, phone_token_hash, pc_token_hash, status, created_at, expires_at, failed_attempts, locked_until) and `transfers` (id, session_id, direction, kind, language, filename, size, content, storage_path, created_at). RLS locked down; all access through server functions that verify a device token.
- Server functions: `createSession`, `joinSession`, `sendTransfer`, `listTransfers`, `deleteTransfer`, `endSession`, `uploadUrl`. Tokens travel in request bodies, never in URLs.
- Realtime: Postgres changes subscription on `transfers` and `sessions` filtered by session id, so the PC updates without refreshing; polling fallback if the socket drops.
- Files: private storage bucket with 25 MB limit; downloads via short-lived signed URLs; cleanup job removes objects on expiry.
- Editor: CodeMirror 6 with only the needed language packs for a small bundle.
- Cleanup: `pg_cron` job every minute marking sessions expired and purging their rows and files.
- README with setup, env, and deploy notes.
