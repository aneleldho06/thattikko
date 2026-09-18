import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/labdrop/site-chrome";
//import heroAsset from "@/assets/thattikko-3d.png.asset.json";
import heroAsset from "@/assets/thattikko-3d.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "തട്ടിക്കോ.fun — Don't log in. Just Thattikko." },
      {
        name: "description",
        content:
          "A temporary, account-free bridge that sends code, text, images and files from your phone to a shared computer. No logins, nothing left behind.",
      },
      { property: "og:title", content: "തട്ടിക്കോ.fun — Don't log in. Just Thattikko." },
      {
        property: "og:description",
        content:
          "Pair your phone with a shared computer using a 6-digit code. Everything is deleted when the session ends.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-6xl flex-col items-center px-5 py-10 text-center sm:py-16">
        <img
          src={heroAsset} //changed .url thing
          alt="തട്ടിക്കോ.fun"
          className="w-full max-w-3xl select-none"
          draggable={false}
        />

        <p className="-mt-1 text-lg font-bold text-primary sm:text-2xl">
          Don't log in. Just{" "}
          <span className="relative inline-block">
            Thattikko.
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-[4px] w-[86%] rounded-full bg-brand-red"
            />
          </span>
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Link
            to="/session"
            className="rounded-lg bg-primary px-10 py-4 font-display text-xl tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
          >
            CREATE SESSION
          </Link>
          <Link
            to="/connect"
            className="rounded-lg border-2 border-primary px-10 py-4 font-display text-xl tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            JOIN SESSION
          </Link>
        </div>

        <p className="mt-8 max-w-xl text-sm text-muted-foreground">
          Create the session on your phone. Join it on the shared computer. Send code, text, images and
          files — everything disappears when the session ends.
        </p>
      </section>
    </PageShell>
  );
}
