import { createServerFn } from "@tanstack/react-start";

export type DeviceRole = "phone" | "pc";

type Auth = { sessionId: string; token: string; role: DeviceRole };

function readAuth(input: unknown): Auth {
  const data = (input ?? {}) as Record<string, unknown>;
  const role = data["role"] === "pc" ? "pc" : "phone";
  return {
    sessionId: String(data["sessionId"] ?? ""),
    token: String(data["token"] ?? ""),
    role,
  };
}

export const createSessionFn = createServerFn({ method: "POST" })
  .inputValidator((input: { minutes: number }) => ({ minutes: Number(input?.minutes ?? 15) }))
  .handler(async ({ data }) => {
    const { createSession } = await import("./labdrop.server");
    const result = await createSession(data.minutes);
    return { ok: true as const, ...result };
  });

export const joinSessionFn = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; clientKey: string }) => ({
    code: String(input?.code ?? "").slice(0, 12),
    clientKey: String(input?.clientKey ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    const { joinSession } = await import("./labdrop.server");
    const { getRequestIP } = await import("@tanstack/react-start/server");
    const ip = getRequestIP({ xForwardedFor: true }) ?? "noip";
    return joinSession(data.code, `${ip}:${data.clientKey}`);
  });

export const sessionStateFn = createServerFn({ method: "POST" })
  .inputValidator(readAuth)
  .handler(async ({ data }) => {
    const { authorize, listTransfers, sessionStateFor } = await import("./labdrop.server");
    const result = await authorize(data.sessionId, data.token, data.role);
    if ("error" in result) return { error: result.error };
    return {
      session: await sessionStateFor(result.session),
      transfers: await listTransfers(result.session.id),
    };
  });

export const sendTextFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      sessionId: string;
      token: string;
      role: DeviceRole;
      kind: "code" | "text";
      language?: string;
      content: string;
      filename?: string;
    }) => ({
      ...readAuth(input),
      kind: input?.kind === "text" ? ("text" as const) : ("code" as const),
      language: input?.language ? String(input.language).slice(0, 24) : null,
      content: String(input?.content ?? ""),
      filename: input?.filename ? String(input.filename).slice(0, 120) : null,
    }),
  )
  .handler(async ({ data }) => {
    const { authorize, MAX_TEXT_CHARS } = await import("./labdrop.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await authorize(data.sessionId, data.token, data.role);
    if ("error" in result) return { error: result.error };
    if (data.content.trim().length === 0) return { error: "BAD_REQUEST" as const };
    if (data.content.length > MAX_TEXT_CHARS) return { error: "TOO_LARGE" as const };

    const { error } = await supabaseAdmin.from("transfers").insert({
      session_id: result.session.id,
      direction: data.role === "phone" ? "phone_to_pc" : "pc_to_phone",
      kind: data.kind,
      language: data.language,
      filename: data.filename,
      size: data.content.length,
      content: data.content,
    });
    if (error) return { error: "BAD_REQUEST" as const };
    return { ok: true as const };
  });

export const prepareUploadFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      sessionId: string;
      token: string;
      role: DeviceRole;
      filename: string;
      size: number;
    }) => ({
      ...readAuth(input),
      filename: String(input?.filename ?? ""),
      size: Number(input?.size ?? 0),
    }),
  )
  .handler(async ({ data }) => {
    const mod = await import("./labdrop.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await mod.authorize(data.sessionId, data.token, data.role);
    if ("error" in result) return { error: result.error };
    if (data.size <= 0 || data.size > mod.MAX_FILE_BYTES) return { error: "TOO_LARGE" as const };

    const safeName = mod.sanitizeFilename(data.filename);
    const ext = mod.fileExtension(safeName);
    if (!mod.ALLOWED_EXTENSIONS.includes(ext)) return { error: "BAD_TYPE" as const };

    const path = `${result.session.id}/${mod.randomToken().slice(0, 16)}-${safeName}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(mod.BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) return { error: "BAD_REQUEST" as const };
    return { ok: true as const, path, uploadUrl: signed.signedUrl, filename: safeName };
  });

export const completeUploadFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      sessionId: string;
      token: string;
      role: DeviceRole;
      path: string;
      filename: string;
      mimeType?: string;
    }) => ({
      ...readAuth(input),
      path: String(input?.path ?? ""),
      filename: String(input?.filename ?? ""),
      mimeType: input?.mimeType ? String(input.mimeType).slice(0, 120) : null,
    }),
  )
  .handler(async ({ data }) => {
    const mod = await import("./labdrop.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await mod.authorize(data.sessionId, data.token, data.role);
    if ("error" in result) return { error: result.error };
    if (!data.path.startsWith(`${result.session.id}/`)) return { error: "UNAUTHORIZED" as const };

    const folder = result.session.id;
    const name = data.path.slice(folder.length + 1);
    const { data: listed } = await supabaseAdmin.storage.from(mod.BUCKET).list(folder, {
      search: name,
      limit: 1,
    });
    const object = listed?.[0];
    if (!object) return { error: "NOT_FOUND" as const };

    const size = Number((object.metadata as Record<string, unknown> | null)?.["size"] ?? 0);
    if (size > mod.MAX_FILE_BYTES) {
      await supabaseAdmin.storage.from(mod.BUCKET).remove([data.path]);
      return { error: "TOO_LARGE" as const };
    }

    const safeName = mod.sanitizeFilename(data.filename);
    const ext = mod.fileExtension(safeName);
    if (!mod.ALLOWED_EXTENSIONS.includes(ext)) {
      await supabaseAdmin.storage.from(mod.BUCKET).remove([data.path]);
      return { error: "BAD_TYPE" as const };
    }

    const imageExts = ["png", "jpg", "jpeg", "gif", "webp"];
    const { error } = await supabaseAdmin.from("transfers").insert({
      session_id: result.session.id,
      direction: data.role === "phone" ? "phone_to_pc" : "pc_to_phone",
      kind: imageExts.includes(ext) ? "image" : "file",
      filename: safeName,
      mime_type: data.mimeType,
      size,
      storage_path: data.path,
    });
    if (error) return { error: "BAD_REQUEST" as const };
    return { ok: true as const };
  });

export const downloadUrlFn = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string; token: string; role: DeviceRole; transferId: string }) => ({
    ...readAuth(input),
    transferId: String(input?.transferId ?? ""),
  }))
  .handler(async ({ data }) => {
    const mod = await import("./labdrop.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await mod.authorize(data.sessionId, data.token, data.role);
    if ("error" in result) return { error: result.error };

    const { data: row } = await supabaseAdmin
      .from("transfers")
      .select("storage_path")
      .eq("id", data.transferId)
      .eq("session_id", result.session.id)
      .maybeSingle();
    if (!row?.storage_path) return { error: "NOT_FOUND" as const };

    const { data: signed, error } = await supabaseAdmin.storage
      .from(mod.BUCKET)
      .createSignedUrl(row.storage_path, 300);
    if (error || !signed) return { error: "NOT_FOUND" as const };
    return { ok: true as const, url: signed.signedUrl };
  });

export const deleteTransferFn = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string; token: string; role: DeviceRole; transferId: string }) => ({
    ...readAuth(input),
    transferId: String(input?.transferId ?? ""),
  }))
  .handler(async ({ data }) => {
    const mod = await import("./labdrop.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await mod.authorize(data.sessionId, data.token, data.role);
    if ("error" in result) return { error: result.error };

    const { data: row } = await supabaseAdmin
      .from("transfers")
      .select("id, storage_path")
      .eq("id", data.transferId)
      .eq("session_id", result.session.id)
      .maybeSingle();
    if (!row) return { error: "NOT_FOUND" as const };
    if (row.storage_path) {
      await supabaseAdmin.storage.from(mod.BUCKET).remove([row.storage_path]);
    }
    await supabaseAdmin.from("transfers").delete().eq("id", row.id);
    return { ok: true as const };
  });

export const endSessionFn = createServerFn({ method: "POST" })
  .inputValidator(readAuth)
  .handler(async ({ data }) => {
    const mod = await import("./labdrop.server");
    const result = await mod.authorize(data.sessionId, data.token, data.role);
    if ("error" in result) return { ok: true as const };
    await mod.destroySessions([result.session.id]);
    return { ok: true as const };
  });
