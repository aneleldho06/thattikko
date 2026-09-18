import { Link } from "@tanstack/react-router";

import { ThattikkoWordmark } from "./Logo";

const MARQUEE_TEXT =
  'NO LOGIN • NO GOOGLE • NO PASSWORDS • NO "DID I LOG OUT?" • JUST SEND IT • COPY IT • PASTE IT • GET YOUR CODE FROM PHONE TO PC • THATTIKKO MAKES IT EASY • NOTHING LEFT BEHIND • ';
  
const NAV = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/features", label: "Features" },
  { to: "/faq", label: "FAQ" },
] as const;

export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="w-full">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <Link to="/" className="shrink-0">
          <ThattikkoWordmark className="text-2xl" />
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold text-primary sm:gap-8 sm:text-base">
          {right ?? (
            <>
              {NAV.map((item) => (
                <Link key={item.to} to={item.to} className="hover:underline">
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function MarqueeFooter() {
  return (
    <footer className="mt-auto w-full overflow-hidden bg-primary py-3">
      <div className="marquee-track flex w-max gap-8 whitespace-nowrap font-display text-sm tracking-wide text-primary-foreground sm:text-base">
        <span>{MARQUEE_TEXT}</span>
        <span aria-hidden="true">{MARQUEE_TEXT}</span>
      </div>
    </footer>
  );
}

export function PageShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader {...(right ? { right } : {})} />
      <main className="flex-1">{children}</main>
      <MarqueeFooter />
    </div>
  );
}
