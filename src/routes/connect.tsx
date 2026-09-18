import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { PageShell } from "@/components/labdrop/site-chrome";
import type { Credentials } from "@/lib/labdrop-client";
import { joinSessionFn, downloadUrlFn, endSessionFn } from "@/lib/labdrop.functions";
import {
  clearCredentials,
  clientKey,
  errorMessage,
  formatBytes,
  formatCountdown,
  formatTime,
} from "@/lib/labdrop-client";
import { languageLabel } from "@/lib/languages";
import { useLabDropSession, type TransferItem } from "@/lib/use-labdrop-session";

const LabDropEditor = lazy(() => import("@/components/labdrop/editor-view"));

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Join a session — തട്ടിക്കോ.fun" },
      {
        name: "description",
        content:
          "Enter the 6-digit code from your phone to receive code, text, images and files on this shared computer. No sign-in needed.",
      },
      { property: "og:title", content: "Join a session — തട്ടിക്കോ.fun" },
      {
        property: "og:description",
        content: "Type the 6-digit code shown on your phone and pick up your work on this computer.",
      },
    ],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const { creds, setCreds, ready, session, transfers, fatal, setFatal, offline, drop } =
    useLabDropSession("pc");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = session ? new Date(session.expiresAt).getTime() - now : 0;

  if (!ready) return <Shell />;

  if (!creds) {
    return (
      <Shell>
        <div className="mx-auto max-w-md px-5 py-14">
          {fatal ? (
            <p className="mb-5 rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground">
              {fatal === "EXPIRED"
                ? "Session Expired — your temporary data has been deleted."
                : errorMessage(fatal)}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Join a session</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit code shown on your phone.
          </p>
          <CodeEntry
            onJoined={(sessionId, token) => {
              setFatal(null);
              setCreds({ sessionId, token, role: "pc" });
            }}
            onError={setFatal}
          />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
          <div>
            <p className="text-base font-semibold text-foreground">Connected</p>
            <p className="text-sm text-muted-foreground">
              Items from your phone appear below automatically.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Expires in <span className="font-mono text-foreground">{formatCountdown(remaining)}</span>
            </span>
            <button
              onClick={async () => {
                await endSessionFn({ data: { ...creds } });
                clearCredentials("pc");
                drop("");
                setFatal(null);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              End Session
            </button>
          </div>
        </div>

        {offline ? (
          <p className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground">
            Connection interrupted — reconnecting…
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          {transfers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Waiting for the first item from your phone…
            </p>
          ) : (
            transfers.map((t) => <TransferCard key={t.id} item={t} creds={creds} />)
          )}
        </div>
      </div>
    </Shell>
  );
}

function CodeEntry({
  onJoined,
  onError,
}: {
  onJoined: (sessionId: string, token: string) => void;
  onError: (code: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setAt(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const next = Array(6).fill("");
      cleaned
        .slice(0, 6)
        .split("")
        .forEach((d, i) => (next[i] = d));
      setDigits(next);
      refs.current[Math.min(cleaned.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) refs.current[index + 1]?.focus();
  }

  async function submit() {
    const code = digits.join("");
    if (code.length !== 6) {
      onError("INVALID_CODE");
      return;
    }
    setBusy(true);
    const result = await joinSessionFn({ data: { code, clientKey: clientKey() } });
    setBusy(false);
    if ("error" in result && result.error) {
      setDigits(Array(6).fill(""));
      refs.current[0]?.focus();
      onError(result.error);
      return;
    }
    if ("pcToken" in result) onJoined(result.session.sessionId, result.pcToken);
  }

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "Enter") void submit();
            }}
            onPaste={(e) => {
              e.preventDefault();
              setAt(0, e.clipboardData.getData("text"));
            }}
            className="h-14 w-full rounded-lg border border-input bg-background text-center font-mono text-2xl text-foreground outline-none focus:border-primary"
          />
        ))}
      </div>
      <button
        onClick={submit}
        disabled={busy}
        className="mt-5 w-full rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? "Connecting…" : "Connect"}
      </button>
      <p className="mt-4 text-sm text-muted-foreground">
        No code yet?{" "}
        <Link to="/session" className="text-primary hover:underline">
          Create a session on your phone
        </Link>
        .
      </p>
    </div>
  );
}

function TransferCard({
  item,
  creds,
}: {
  item: TransferItem;
  creds: Credentials;
}) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const isImage = item.kind === "image";
  const isPdf = (item.filename ?? "").toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!item.hasFile) return;
    let active = true;
    void downloadUrlFn({ data: { ...creds, transferId: item.id } }).then((result) => {
      if (active && "url" in result && result.url) setUrl(result.url);
    });
    return () => {
      active = false;
    };
  }, [item.id, item.hasFile, creds]);

  async function copy() {
    if (!item.content) return;
    await navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-card-foreground">
            {item.filename ??
              (item.kind === "code" ? `${languageLabel(item.language)} snippet` : "Text")}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTime(item.createdAt)} · {formatBytes(item.size)}
          </p>
        </div>
        <div className="flex gap-2">
          {item.content ? (
            <>
              <button
                onClick={copy}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {copied ? "Copied" : item.kind === "code" ? "COPY CODE" : "Copy text"}
              </button>
              <button
                onClick={() => {
                  const node = document.getElementById(`content-${item.id}`);
                  if (!node) return;
                  const range = document.createRange();
                  range.selectNodeContents(node);
                  const selection = window.getSelection();
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                }}
                className="rounded-md border border-input px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Select All
              </button>
            </>
          ) : null}
          {url ? (
            <a
              href={url}
              download={item.filename ?? "file"}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Download
            </a>
          ) : null}
        </div>
      </header>

      <div id={`content-${item.id}`}>
        {item.kind === "code" && item.content ? (
          <ClientOnly
            fallback={
              <pre className="overflow-auto p-4 font-mono text-[13px] text-foreground">{item.content}</pre>
            }
          >
            <Suspense
              fallback={
                <pre className="overflow-auto p-4 font-mono text-[13px] text-foreground">{item.content}</pre>
              }
            >
              <LabDropEditor
                value={item.content}
                language={item.language ?? "text"}
                readOnly
                minHeight="80px"
                maxHeight="520px"
              />
            </Suspense>
          </ClientOnly>
        ) : null}

        {item.kind === "text" && item.content ? (
          <pre className="overflow-auto whitespace-pre-wrap p-4 text-sm text-foreground">
            {item.content}
          </pre>
        ) : null}

        {isImage && url ? (
          <img src={url} alt={item.filename ?? "Shared image"} className="max-h-[520px] w-full object-contain" />
        ) : null}

        {isPdf && url ? <iframe src={url} title={item.filename ?? "PDF"} className="h-[520px] w-full" /> : null}

        {item.hasFile && !isImage && !isPdf ? (
          <p className="p-4 text-sm text-muted-foreground">
            {url ? "Ready to download." : "Preparing download…"}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <PageShell right={<span className="text-sm text-primary/80">Shared computer</span>}>
      {children}
    </PageShell>
  );
}
