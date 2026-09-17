import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/labdrop/site-chrome";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — തട്ടിക്കോ.fun" },
      {
        name: "description",
        content:
          "No login, temporary sessions, code editor with syntax highlighting, files up to 25 MB, works across different networks, everything deleted on expiry.",
      },
      { property: "og:title", content: "Features — തട്ടിക്കോ.fun" },
      {
        property: "og:description",
        content: "Account-free phone to computer transfer with temporary sessions and automatic deletion.",
      },
    ],
  }),
  component: Features,
});

const FEATURES = [
  {
    title: "No login, ever",
    body: "No Google, Gmail or WhatsApp on the shared computer. A 6-digit code is the whole handshake.",
  },
  {
    title: "Temporary by design",
    body: "Sessions run 5 to 60 minutes. When they end, transfers, files and tokens are deleted — not archived.",
  },
  {
    title: "Different networks are fine",
    body: "Phone on mobile data, computer on lab Ethernet. No same-Wi-Fi requirement, no local pairing.",
  },
  {
    title: "Built for code",
    body: "A real editor with line numbers and highlighting for C, C++, Java, Python, JavaScript, HTML, CSS, SQL, JSON and Bash, with automatic language detection.",
  },
  {
    title: "Copy in one click",
    body: "On the computer every snippet gets a big COPY CODE button plus Select All, ready to paste into your IDE.",
  },
  {
    title: "Files and images too",
    body: "Images, PDF, TXT, DOC, DOCX, ZIP and common source files up to 25 MB, with upload progress and inline previews.",
  },
  {
    title: "Single-use pairing",
    body: "One phone, one computer. The code is stored only as a hash, works once, and repeated wrong guesses get locked out.",
  },
  {
    title: "Light on old hardware",
    body: "Minimal JavaScript, no heavy animation, keyboard-friendly — it loads fast on tired lab PCs.",
  },
];

function Features() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <h1 className="font-display text-4xl text-primary sm:text-5xl">Features</h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          A temporary, account-free bridge from your phone to a shared computer.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border-2 border-primary/40 bg-card p-5">
              <h2 className="text-lg font-bold text-primary">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
