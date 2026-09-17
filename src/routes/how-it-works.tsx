import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/labdrop/site-chrome";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — തട്ടിക്കോ.fun" },
      {
        name: "description",
        content:
          "Three steps: create a session on your phone, type the 6-digit code on the shared computer, then send and copy your code, text, images and files.",
      },
      { property: "og:title", content: "How it works — തട്ടിക്കോ.fun" },
      {
        property: "og:description",
        content: "Create a session, enter the 6-digit code on the computer, send and copy. No logins.",
      },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    n: "01",
    title: "Create a session on your phone",
    body: "Pick how long it should stay open — 5, 15, 30 or 60 minutes. You get a 6-digit code instantly. No account, no email, no password.",
  },
  {
    n: "02",
    title: "Type the code on the computer",
    body: "On the shared computer open thattikko.fun, choose Join Session and type the 6 digits. The code works once, only for that computer.",
  },
  {
    n: "03",
    title: "Send it, copy it, paste it",
    body: "Send code with syntax highlighting, plain text, images or files up to 25 MB. On the computer, hit COPY CODE and paste straight into your IDE.",
  },
  {
    n: "04",
    title: "Walk away clean",
    body: "End the session or let it expire. Every transfer, file and token is deleted — nothing left behind on the shared machine.",
  },
];

function HowItWorks() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
        <h1 className="font-display text-4xl text-primary sm:text-5xl">How it works</h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Your phone is on mobile data, the lab computer is on Ethernet. They don't need the same
          network — only the 6-digit code.
        </p>

        <ol className="mt-10 space-y-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-xl border-2 border-primary/40 bg-card p-5 sm:p-6">
              <span className="font-display text-xl text-primary/70">{s.n}</span>
              <h2 className="mt-2 text-xl font-bold text-primary">{s.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/session"
            className="rounded-lg bg-primary px-8 py-3.5 text-center font-display text-lg tracking-wide text-primary-foreground hover:bg-primary/90"
          >
            CREATE SESSION
          </Link>
          <Link
            to="/connect"
            className="rounded-lg border-2 border-primary px-8 py-3.5 text-center font-display text-lg tracking-wide text-primary hover:bg-primary hover:text-primary-foreground"
          >
            JOIN SESSION
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
