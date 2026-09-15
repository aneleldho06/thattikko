CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pairing_code_hash TEXT NOT NULL,
  phone_token_hash TEXT NOT NULL,
  pc_token_hash TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  paired_at TIMESTAMPTZ,
  failed_attempts INT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX sessions_active_code_idx ON public.sessions (pairing_code_hash) WHERE status IN ('waiting','paired');
CREATE INDEX sessions_expires_idx ON public.sessions (expires_at);

CREATE TABLE public.transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'phone_to_pc',
  kind TEXT NOT NULL,
  language TEXT,
  filename TEXT,
  mime_type TEXT,
  size BIGINT NOT NULL DEFAULT 0,
  content TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX transfers_session_idx ON public.transfers (session_id, created_at DESC);

CREATE TABLE public.pairing_attempts (
  client_key TEXT NOT NULL PRIMARY KEY,
  attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.transfers TO service_role;
GRANT ALL ON public.pairing_attempts TO service_role;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairing_attempts ENABLE ROW LEVEL SECURITY;