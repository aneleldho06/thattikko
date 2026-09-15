import { createFileRoute } from "@tanstack/react-router";

// Scheduled cleanup endpoint. It deletes expired sessions, their transfer
// metadata and their temporary files. It only ever removes expired rows, so it
// is safe to call publicly; it never returns user content.
export const Route = createFileRoute("/api/public/hooks/cleanup")({
  server: {
    handlers: {
      POST: async () => {
        const { cleanupExpired } = await import("@/lib/labdrop.server");
        const removed = await cleanupExpired();
        return Response.json({ ok: true, removed });
      },
      GET: async () => {
        const { cleanupExpired } = await import("@/lib/labdrop.server");
        const removed = await cleanupExpired();
        return Response.json({ ok: true, removed });
      },
    },
  },
});
