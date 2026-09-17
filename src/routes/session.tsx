import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";

import { ThattikkoWordmark } from "@/components/labdrop/Logo";
import { MarqueeFooter } from "@/components/labdrop/site-chrome";
import type { Credentials } from "@/lib/labdrop-client";
import {
  createSessionFn,
  sendTextFn,
  prepareUploadFn,
  completeUploadFn,
  deleteTransferFn,
  endSessionFn,
} from "@/lib/labdrop.functions";
import {
  MAX_FILE_BYTES,
  clearCredentials,
  errorMessage,
  formatBytes,
  formatCountdown,
  formatTime,
  uploadFile,
} from "@/lib/labdrop-client";
import { LANGUAGES, detectLanguage, type LanguageId } from "@/lib/languages";
import { useLabDropSession } from "@/lib/use-labdrop-session";

const LabDropEditor = lazy(() => import("@/components/labdrop/editor-view"));

export const Route = createFileRoute("/session")({
  head: () => ({
    meta: [
      { title: "Create a session — LabDrop" },
      {
        name: "description",
        content:
          "Create a temporary LabDrop session on your phone and send code, text, images and files to a shared computer.",
      },
      { property: "og:title", content: "Create a session — LabDrop" },
      {
        property: "og:description",
        content: "Get a 6-digit code, pair the shared computer, and send your work across in seconds.",
      },
    ],
  }),
  component: SessionPage,
});

const DURATIONS = [5, 15, 30, 60];
type Tab = "code" | "text" | "image" | "file";

function SessionPage() {
  const { creds, setCreds, ready, session, transfers, fatal, setFatal, offline, refresh, drop } =
    useLabDropSession("phone");
  const [minutes, setMinutes] = useState(15);
  const [code, setCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !creds) return;
    setCode(window.sessionStorage.getItem("labdrop.code"));
  }, [creds]);

  async function create() {
    setCreating(true);
    setFatal(null);
    try {
      const result = await createSessionFn({ data: { minutes } });
      window.sessionStorage.setItem("labdrop.code", result.code);
      setCode(result.code);
      setCreds({ sessionId: result.session.sessionId, token: result.phoneToken, role: "phone" });
    } catch {
      setFatal("BAD_REQUEST");
    } finally {
      setCreating(false);
    }
  }

  async function end() {
    if (creds) await endSessionFn({ data: { ...creds } });
    window.sessionStorage.removeItem("labdrop.code");
    clearCredentials("phone");
    drop("");
    setFatal(null);
  }

  const remaining = session ? new Date(session.expiresAt).getTime() - now : 0;

  if (!ready) return <Shell />;

  if (!creds) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-5 py-10">
          {fatal ? (
            <p className="mb-5 rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground">
              {fatal === "EXPIRED"
                ? "Session Expired — your temporary data has been deleted."
                : errorMessage(fatal)}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create a session</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick how long the session should stay open. It closes automatically and everything is
            deleted.
          </p>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {DURATIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                  minutes === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-accent"
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
          <button
            onClick={create}
            disabled={creating}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create Session"}
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-5 py-6">
        {offline ? (
          <p className="mb-4 rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground">
            Connection interrupted — reconnecting…
          </p>
        ) : null}

        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Enter this code on the computer</p>
          <p className="mt-2 font-mono text-5xl font-semibold tracking-[0.2em] text-foreground">
            {code ?? "······"}
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Expires in <span className="font-mono text-foreground">{formatCountdown(remaining)}</span>
            </span>
            <span
              className={
                session?.pcConnected ? "font-medium text-primary" : "text-muted-foreground"
              }
            >
              {session?.pcConnected ? "Connected — Lab Computer" : "Waiting for computer…"}
            </span>
          </div>
        </div>

        <SendPanel creds={creds} onSent={refresh} />

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">Sent in this session</h2>
          {transfers.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing sent yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {transfers.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {t.filename ?? (t.kind === "code" ? "Code snippet" : "Text")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(t.createdAt)} · {formatBytes(t.size)}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await deleteTransferFn({ data: { ...creds, transferId: t.id } });
                      void refresh();
                    }}
                    className="shrink-0 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={end}
          className="mt-8 w-full rounded-lg border border-destructive px-5 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          End Session and delete everything
        </button>
      </div>
    </Shell>
  );
}

function SendPanel({
  creds,
  onSent,
}: {
  creds: Credentials;
  onSent: () => void;
}) {
  const [tab, setTab] = useState<Tab>("code");
  const [source, setSource] = useState("");
  const [language, setLanguage] = useState<LanguageId>("text");
  const [manualLanguage, setManualLanguage] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const detected = useMemo(() => detectLanguage(source), [source]);
  useEffect(() => {
    if (!manualLanguage) setLanguage(detected);
  }, [detected, manualLanguage]);

  async function sendText(kind: "code" | "text") {
    const content = kind === "code" ? source : text;
    if (!content.trim()) return;
    setBusy(true);
    setError(null);
    const result = await sendTextFn({
      data: { ...creds, kind, content, ...(kind === "code" ? { language } : {}) },
    });
    setBusy(false);
    if ("error" in result && result.error) {
      setError(errorMessage(result.error));
      return;
    }
    if (kind === "code") setSource("");
    else setText("");
    onSent();
  }

  async function sendFile(file: File) {
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError(errorMessage("TOO_LARGE"));
      return;
    }
    setProgress(0);
    try {
      const prepared = await prepareUploadFn({
        data: { ...creds, filename: file.name, size: file.size },
      });
      if ("error" in prepared && prepared.error) {
        setError(errorMessage(prepared.error));
        setProgress(null);
        return;
      }
      if (!("uploadUrl" in prepared)) return;
      await uploadFile(prepared.uploadUrl, file, setProgress);
      const done = await completeUploadFn({
        data: {
          ...creds,
          path: prepared.path,
          filename: prepared.filename,
          mimeType: file.type || "application/octet-stream",
        },
      });
      if ("error" in done && done.error) setError(errorMessage(done.error));
      else onSent();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card">
      <div className="flex border-b border-border">
        {(["code", "text", "image", "file"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-3 text-sm font-medium capitalize ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {error ? (
          <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {tab === "code" ? (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <label htmlFor="lang" className="text-sm text-muted-foreground">
                Language
              </label>
              <select
                id="lang"
                value={language}
                onChange={(e) => {
                  setManualLanguage(true);
                  setLanguage(e.target.value as LanguageId);
                }}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSource("");
                  setManualLanguage(false);
                }}
                className="ml-auto rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                Clear
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <ClientOnly
                fallback={
                  <textarea
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="h-[220px] w-full resize-none bg-background p-3 font-mono text-[13px] text-foreground outline-none"
                    placeholder="Paste or type your code here"
                  />
                }
              >
                <Suspense
                  fallback={<div className="h-[220px] bg-background p-3 text-sm text-muted-foreground">Loading editor…</div>}
                >
                  <LabDropEditor
                    value={source}
                    language={language}
                    onChange={setSource}
                    placeholder="Paste or type your code here"
                  />
                </Suspense>
              </ClientOnly>
            </div>
            <button
              onClick={() => sendText("code")}
              disabled={busy || !source.trim()}
              className="mt-3 w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              Send code
            </button>
          </div>
        ) : null}

        {tab === "text" ? (
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder="Type or paste text"
              className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
            />
            <button
              onClick={() => sendText("text")}
              disabled={busy || !text.trim()}
              className="mt-3 w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              Send text
            </button>
          </div>
        ) : null}

        {tab === "image" || tab === "file" ? (
          <div>
            <input
              ref={tab === "image" ? imageInput : fileInput}
              type="file"
              {...(tab === "image" ? { accept: "image/png,image/jpeg,image/gif,image/webp" } : {})}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void sendFile(file);
              }}
            />
            <button
              onClick={() => (tab === "image" ? imageInput : fileInput).current?.click()}
              disabled={progress !== null}
              className="w-full rounded-lg border border-dashed border-input px-5 py-8 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
            >
              {tab === "image" ? "Choose an image" : "Choose a file"}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              Up to 25 MB. Images, PDF, TXT, DOC, DOCX, ZIP and common source files.
            </p>
            {progress !== null ? (
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Uploading… {progress}%</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link to="/">
            <LabDropWordmark subtle />
          </Link>
          <span className="text-xs text-muted-foreground">Phone</span>
        </div>
      </header>
      {children}
    </div>
  );
}
