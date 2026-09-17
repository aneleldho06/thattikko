# Rebrand: LabDrop → തട്ടിക്കോ.fun (thattikko.fun)

A full visual rebrand in the green/yellow/red theme from your reference. All transfer functionality (sessions, 6-digit pairing, code/text/image/file sending, expiry, deletion) stays exactly as it is — only names, colours, typography and layout change, plus three new information pages.

## Colour theme

- Green `#017511` — page background everywhere
- Yellow `#FFC300` — logo, headings, buttons, borders, footer bar
- Red — only the hand-drawn underline under "Don't log in. Just Thattikko."
- Text on green is yellow; text on yellow is green. Same theme on every page including the session and computer screens.

## Home page (`/`)

- Top bar: "തട്ടിക്കോ.fun" wordmark on the left; "How it works", "Features", "FAQ" links on the right (each opens its own page, not an anchor on the home page).
- Centre: your uploaded 3D Malayalam artwork as the hero, with the tagline "Don't log in. Just Thattikko." underneath and a red underline stroke on "Thattikko."
- Two buttons below: Create Session (filled yellow) and Join Session (yellow outline).
- Bottom: yellow footer strip with a continuously scrolling marquee reading:
  `NO LOGIN • NO GOOGLE • NO PASSWORDS • NO "DID I LOG OUT?" • JUST SEND IT • COPY IT • PASTE IT • GET YOUR CODE FROM PHONE TO PC • THATTIKKO MAKES IT EASY • NOTHING LEFT BEHIND •`
  The marquee pauses for visitors who ask their device to reduce motion.
- The old three benefit cards and the data-handling paragraph move off the home page into the new pages, keeping the reference layout clean.

## New pages

- `/how-it-works` — the three steps: create a session on the phone, type the code on the computer, send and copy.
- `/features` — no login, temporary by design, works across networks, code editor with highlighting, files up to 25 MB, everything deleted on expiry.
- `/faq` — questions covering safety, what the 6-digit code is, expiry, file limits, and an honest note that this is not end-to-end encrypted (content is encrypted in transit, stored briefly, deleted on expiry).

Each page keeps the same top bar and footer marquee.

## Existing screens

- Phone session page and shared-computer page: same behaviour and wording flow, restyled in green/yellow, "LabDrop" renamed to "തട്ടിക്കോ.fun" in headings, page titles and share previews. The 6-digit code and received code blocks stay high-contrast and easy to read on a lab monitor.

## Technical details

- Theme tokens in `src/styles.css` converted to the green/yellow palette (oklch) for both light and dark, so components pick the theme up automatically; a `--brand-red` token added for the underline.
- Hero artwork uploaded through Lovable Assets and referenced by pointer rather than committed as a binary.
- Marquee as a small reusable component using a CSS keyframe with duplicated track text; no JS animation loop.
- New route files `src/routes/how-it-works.tsx`, `src/routes/features.tsx`, `src/routes/faq.tsx`, each with its own title/description/OG metadata; navigation via `<Link>`.
- Shared `SiteHeader` / `MarqueeFooter` components; `Logo.tsx` becomes the Thattikko wordmark.
- The three outstanding type errors in `session.tsx` / `connect.tsx` (credential typing and a nullable field) get fixed in this pass, and the whole flow is checked end to end in a browser before finishing.
- No changes to `labdrop.server.ts`, `labdrop.functions.ts`, the database, storage, or the cleanup endpoint.
