import type { DeviceRole } from "./labdrop.functions";

export type Credentials = { sessionId: string; token: string; role: DeviceRole };

const KEY = (role: DeviceRole) => `labdrop.${role}`;

// sessionStorage, not localStorage: closing the browser tab on a shared lab PC
// already wipes the credential, in addition to the server-side expiry.
export function loadCredentials(role: DeviceRole): Credentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY(role));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Credentials;
    return parsed.sessionId && parsed.token ? { ...parsed, role } : null;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials) {
  window.sessionStorage.setItem(KEY(creds.role), JSON.stringify(creds));
}

export function clearCredentials(role: DeviceRole) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY(role));
}

/** Random per-browser id used only for pairing rate limits. */
export function clientKey(): string {
  const key = "labdrop.client";
  let value = window.localStorage.getItem(key);
  if (!value) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    value = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    window.localStorage.setItem(key, value);
  }
  return value;
}

export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CODE: "Invalid session code. Please check the code and try again.",
  EXPIRED: "This session has expired. Create a new session to continue.",
  SESSION_FULL: "This session is already connected to a computer.",
  LOCKED: "Too many incorrect codes. Please wait a few minutes and try again.",
  UNAUTHORIZED: "This session is no longer available on this device.",
  TOO_LARGE: "File is too large. Maximum size is 25 MB.",
  BAD_TYPE: "That file type is not supported.",
  BAD_REQUEST: "Something went wrong. Please try again.",
  NOT_FOUND: "That item is no longer available.",
};

export function errorMessage(code: string | undefined): string {
  return (code && ERROR_MESSAGES[code]) || ERROR_MESSAGES["BAD_REQUEST"]!;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatCountdown(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function uploadFile(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}
