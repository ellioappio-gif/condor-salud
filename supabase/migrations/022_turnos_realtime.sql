-- ─── 022: Enable Realtime on turnos table ────────────────────
-- Required for doctor dashboard notifications (v0.22.0).
-- Without this, Supabase Realtime channel subscribes successfully
-- but INSERT/UPDATE events are never delivered.

ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos;

-- Also add pacientes for future live-update features
ALTER PUBLICATION supabase_realtime ADD TABLE public.pacientes;
