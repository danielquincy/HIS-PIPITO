-- Listados por rango (Agenda, Citas) filtran frecuentemente por ventana de inicio_ts sin especialista fijo.
CREATE INDEX IF NOT EXISTS idx_cita_inicio_ts ON cita (inicio_ts);
