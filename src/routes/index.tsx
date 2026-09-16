import { createFileRoute, Link } from "@tanstack/react-router";

import { LabDropMark, LabDropWordmark } from "@/components/labdrop/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LabDrop — Send code and files to a shared computer, no login" },
      {
        name: "description",
        content:
          "Send code, text, images and files from your phone to a shared lab computer using a temporary private session. No accounts, no sign-in, auto-deleted on expiry.",
      },
      { property: "og:title", content: "LabDrop — Transfer to shared computers. Without signing in." },
      {
        property: "og:description",
        content:
          "Pair your phone with a lab computer using a 6-digit code. Code, text, images and files arrive instantly and vanish when the session ends.",
      },
    ],
  }),
  component: Landing,
});

const BENEFITS = [
  {
    title: "No Login",
    body: "No Google, Gmail or WhatsApp on the shared computer. Just a 6-digit code.",
  },
  {
    title: "Temporary",
    body: "Sessions last 5 to 60 minutes. Everything you sent is deleted on expiry.",
  },
  {
    title: "Fast",
    body: "Works across networks — phone on mobile data, computer on lab Ethernet.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <LabDropWordmark />
          <Link to="/connect" className="text-sm font-medium text-primary hover:underline">
            I'm on the computer
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="py-14 sm:py-20">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">LabDrop</h1>
          <p className="mt-3 text-xl font-medium text-foreground sm:text-2xl">
            Transfer to shared computers. Without signing in.
          </p>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Send code, text, images and files from your phone to a shared computer using a temporary
            private session.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/session"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Session
            </Link>
            <Link
              to="/connect"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-6 py-3 text-base font-medium text-foreground hover:bg-accent"
            >
              Join Session
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Create the session on your phone. Join from the shared computer.
          </p>
        </section>

        <section className="grid gap-4 pb-14 sm:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl border border-border bg-card p-5">
              <LabDropMark className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-base font-semibold text-card-foreground">{b.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </section>

        <section className="pb-16">
          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <h2 className="text-sm font-semibold text-foreground">How your data is handled</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Transfers travel over HTTPS and are stored briefly so the paired computer can pick them up.
              Only the two paired devices can read them, and everything — code, text, images, files and
              the session record — is deleted when the session expires or you end it. LabDrop does not
              claim end-to-end encryption: a 6-digit code cannot safely carry an encryption key, and we
              would rather be accurate than impressive.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
