import { useCallback, useEffect, useRef, useState } from "react";

import { sessionStateFn, type DeviceRole } from "./labdrop.functions";
import { clearCredentials, loadCredentials, saveCredentials, type Credentials } from "./labdrop-client";

export type TransferItem = {
  id: string;
  direction: string;
  kind: string;
  language: string | null;
  filename: string | null;
  mimeType: string | null;
  size: number;
  content: string | null;
  hasFile: boolean;
  createdAt: string;
};

export type PublicSession = {
  sessionId: string;
  status: string;
  expiresAt: string;
  pcConnected: boolean;
};

/**
 * Polls the server for session state + transfers. Polling (rather than a
 * realtime socket) keeps the tables fully RLS-locked: the browser never has
 * database credentials, only its own device token.
 */
export function useLabDropSession(role: DeviceRole) {
  const [creds, setCredsState] = useState<Credentials | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const credsRef = useRef<Credentials | null>(null);

  useEffect(() => {
    const stored = loadCredentials(role);
    credsRef.current = stored;
    setCredsState(stored);
    setReady(true);
  }, [role]);

  const setCreds = useCallback((next: Credentials | null) => {
    credsRef.current = next;
    setCredsState(next);
    if (next) saveCredentials(next);
  }, []);

  const drop = useCallback(
    (reason: string) => {
      clearCredentials(role);
      credsRef.current = null;
      setCredsState(null);
      setSession(null);
      setTransfers([]);
      setFatal(reason);
    },
    [role],
  );

  const refresh = useCallback(async () => {
    const current = credsRef.current;
    if (!current) return;
    try {
      const result = await sessionStateFn({
        data: { sessionId: current.sessionId, token: current.token, role },
      });
      setOffline(false);
      if ("error" in result && result.error) {
        drop(result.error);
        return;
      }
      if ("session" in result && result.session) {
        setSession(result.session);
        setTransfers(result.transfers as TransferItem[]);
      }
    } catch {
      setOffline(true);
    }
  }, [drop, role]);

  useEffect(() => {
    if (!creds) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      await refresh();
      if (!active) return;
      timer = setTimeout(loop, 1500);
    };
    void loop();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [creds, refresh]);

  return { creds, setCreds, ready, session, transfers, fatal, setFatal, offline, refresh, drop };
}
