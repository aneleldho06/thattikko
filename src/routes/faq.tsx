import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/labdrop/site-chrome";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — തട്ടിക്കോ.fun" },
      {
        name: "description",
        content:
          "Answers about the 6-digit code, session expiry, file limits, safety on shared computers and how your temporary data is handled.",
      },
      { property: "og:title", content: "FAQ — തട്ടിക്കോ.fun" },
      {
        property: "og:description",
        content: "What the code does, how long sessions last, what gets deleted, and what we do not claim.",
      },
    ],
  }),
  component: Faq,
});

const QA = [
  {
    q: "Do I need an account?",
    a: "No. There is no sign-up, no email and no password anywhere in the flow — on either device.",
  },
  {
    q: "What is the 6-digit code?",
    a: "It pairs one phone with one computer. It is stored only as a hash, works a single time, and after pairing both devices use their own secret token instead.",
  },
  {
    q: "How long does a session last?",
    a: "You choose 5, 15, 30 or 60 minutes. One hour is the maximum. It expires on its own even if you close the browser.",
  },
  {
    q: "What happens to my files afterwards?",
    a: "When you end the session, or when it expires, the transfers, stored files and tokens are deleted by a scheduled cleanup. Nothing is kept for later.",
  },
  {
    q: "How big can a file be?",
    a: "25 MB per file. Images, PDF, TXT, DOC, DOCX, ZIP and common source files are allowed; the type and size are checked on the server.",
  },
  {
    q: "Can someone guess my code?",
    a: "Repeated wrong guesses lock that visitor out for a while, and the code stops working the moment a computer pairs with it.",
  },
  {
    q: "Is it end-to-end encrypted?",
    a: "No, and we would rather say so. A 6-digit code cannot safely carry an encryption key. Content travels over HTTPS, is stored briefly under rules only your two paired devices pass, and is deleted on expiry.",
  },
  {
    q: "Is it safe to use on a college computer?",
    a: "That is the point. You never sign into a personal account there, and closing the tab clears the computer's session credentials.",
  },
];

function Faq() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <h1 className="font-display text-4xl text-primary sm:text-5xl">FAQ</h1>

        <dl className="mt-10 space-y-4">
          {QA.map((item) => (
            <div key={item.q} className="rounded-xl border-2 border-primary/40 bg-card p-5">
              <dt className="text-lg font-bold text-primary">{item.q}</dt>
              <dd className="mt-2 text-sm text-muted-foreground sm:text-base">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PageShell>
  );
}
