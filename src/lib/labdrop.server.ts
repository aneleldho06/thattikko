// Server-only LabDrop logic. All database access happens here with the admin
// client; the tables are RLS-locked so browsers can never read them directly.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const BUCKET = "labdrop-temp";
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_TEXT_CHARS = 200_000;
export const ALLOWED_DURATIONS = [5, 15, 30, 60] as const;

export const ALLOWED_EXTENSIONS = [
  "png","jpg","jpeg","gif","webp","pdf","txt","doc","docx","zip",
  "c","h","cpp","cc","hpp","cs","java","py","js","jsx","ts","tsx","html","htm","css",
  "sql","json","sh","bash","md","xml","yml","yaml","go","rb","rs","php","kt","swift","m","r","csv",
];

export type LabDropError =
  | "INVALID_CODE"
  | "EXPIRED"
  | "SESSION_FULL"
  | "LOCKED"
  | "UNAUTHORIZED"
  | "TOO_LARGE"
  | "BAD_TYPE"
  | "BAD_REQUEST"
  | "NOT_FOUND";

export type SessionRow = {
  id: string;
  pairing_code_hash: string;
  phone_token_hash: string;
  pc_token_hash: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  paired_at: string | null;
};

export type PublicSession = {
  sessionId: string;
  status: string;
  expiresAt: string;
  pcConnected: boolean;
};

function toPublic(s: SessionRow): PublicSession {
  return {
    sessionId: s.id,
    status: s.status,
    expiresAt: s.expires_at,
    pcConnected: Boolean(s.pc_token_hash),
  };
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomDigits(): string {
  // Rejection sampling keeps every 6-digit code equally likely.
  const max = 1_000_000;
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let value = limit;
  while (value >= limit) {
    crypto.getRandomValues(buf);
    value = buf[0]!;
  }
  return String(value % max).padStart(6, "0");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function purgeFiles(sessionIds: string[]) {
  if (sessionIds.length === 0) return;
  const { data } = await supabaseAdmin
    .from("transfers")
    .select("storage_path")
    .in("session_id", sessionIds)
    .not("storage_path", "is", null);
  const paths = (data ?? []).map((r) => r.storage_path).filter(Boolean) as string[];
  if (paths.length > 0) {
    await supabaseAdmin.storage.from(BUCKET).remove(paths);
  }
}

/** Deletes every trace of the given sessions: files, transfer rows, session rows. */
export async function destroySessions(sessionIds: string[]) {
  if (sessionIds.length === 0) return;
  await purgeFiles(sessionIds);
  await supabaseAdmin.from("sessions").delete().in("id", sessionIds);
}

export async function cleanupExpired(): Promise<number> {
  const { data } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .lt("expires_at", new Date().toISOString())
    .limit(500);
  const ids = (data ?? []).map((r) => r.id);
  await destroySessions(ids);
  return ids.length;
}

export async function createSession(minutes: number) {
  const duration = (ALLOWED_DURATIONS as readonly number[]).includes(minutes) ? minutes : 15;
  const phoneToken = randomToken();
  const expiresAt = new Date(Date.now() + duration * 60_000).toISOString();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomDigits();
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .insert({
        pairing_code_hash: await sha256Hex(code),
        phone_token_hash: await sha256Hex(phoneToken),
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (!error && data) {
      return {
        code,
        phoneToken,
        session: toPublic(data as SessionRow),
      };
    }
    // Unique violation on an active code: try another code.
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Could not allocate a session code");
}

async function loadSession(sessionId: string): Promise<SessionRow | null> {
  const { data } = await supabaseAdmin.from("sessions").select("*").eq("id", sessionId).maybeSingle();
  return (data as SessionRow | null) ?? null;
}

/** Verifies a device token and returns the live session, or an error code. */
export async function authorize(
  sessionId: string,
  token: string,
  role: "phone" | "pc",
): Promise<{ error: LabDropError } | { session: SessionRow }> {
  if (!sessionId || !token) return { error: "UNAUTHORIZED" };
  const session = await loadSession(sessionId);
  if (!session) return { error: "EXPIRED" };
  if (new Date(session.expires_at).getTime() <= Date.now() || session.status === "ended") {
    await destroySessions([session.id]);
    return { error: "EXPIRED" };
  }
  const expected = role === "phone" ? session.phone_token_hash : session.pc_token_hash;
  if (!expected) return { error: "UNAUTHORIZED" };
  const provided = await sha256Hex(token);
  if (!timingSafeEqualHex(provided, expected)) return { error: "UNAUTHORIZED" };
  return { session };
}

export async function joinSession(rawCode: string, clientKey: string) {
  const code = rawCode.replace(/\D/g, "");
  const keyHash = await sha256Hex(clientKey || "unknown");

  const { data: attemptRow } = await supabaseAdmin
    .from("pairing_attempts")
    .select("*")
    .eq("client_key", keyHash)
    .maybeSingle();

  if (attemptRow?.locked_until && new Date(attemptRow.locked_until).getTime() > Date.now()) {
    return { error: "LOCKED" as const, retryAt: attemptRow.locked_until };
  }

  const registerFailure = async () => {
    const previous =
      attemptRow && new Date(attemptRow.updated_at).getTime() > Date.now() - 10 * 60_000
        ? attemptRow.attempts
        : 0;
    const attempts = previous + 1;
    const lockedUntil = attempts >= 5 ? new Date(Date.now() + 5 * 60_000).toISOString() : null;
    await supabaseAdmin.from("pairing_attempts").upsert({
      client_key: keyHash,
      attempts,
      locked_until: lockedUntil,
      updated_at: new Date().toISOString(),
    });
    return lockedUntil;
  };

  if (code.length !== 6) {
    await registerFailure();
    return { error: "INVALID_CODE" as const };
  }

  const { data } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("pairing_code_hash", await sha256Hex(code))
    .in("status", ["waiting", "paired"])
    .maybeSingle();

  const session = data as SessionRow | null;

  if (!session) {
    const locked = await registerFailure();
    return locked ? { error: "LOCKED" as const, retryAt: locked } : { error: "INVALID_CODE" as const };
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await destroySessions([session.id]);
    return { error: "EXPIRED" as const };
  }
  if (session.pc_token_hash) {
    return { error: "SESSION_FULL" as const };
  }

  const pcToken = randomToken();
  // Conditional update: the first computer to claim the session wins.
  const { data: updated } = await supabaseAdmin
    .from("sessions")
    .update({
      pc_token_hash: await sha256Hex(pcToken),
      status: "paired",
      paired_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .is("pc_token_hash", null)
    .select("*")
    .maybeSingle();

  if (!updated) return { error: "SESSION_FULL" as const };

  await supabaseAdmin.from("pairing_attempts").delete().eq("client_key", keyHash);

  return { pcToken, session: toPublic(updated as SessionRow) };
}

export type TransferItem = {
  id: string;
  direction: string;
  kind: string;
  language: string | null;
  filename: string | null;
  mimeType: string | null;
  size: number;
  content: string | null;
  hasFile: boolean;
  createdAt: string;
};

export async function listTransfers(sessionId: string): Promise<TransferItem[]> {
  const { data } = await supabaseAdmin
    .from("transfers")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((t) => ({
    id: t.id,
    direction: t.direction,
    kind: t.kind,
    language: t.language,
    filename: t.filename,
    mimeType: t.mime_type,
    size: Number(t.size ?? 0),
    content: t.content,
    hasFile: Boolean(t.storage_path),
    createdAt: t.created_at,
  }));
}

export function fileExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1]! : "";
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file";
}

export async function sessionStateFor(session: SessionRow) {
  return toPublic(session);
}
