package org.lospipitos.his.scheduling;

import java.time.Instant;

/**
 * Proyección mínima para el panel de inicio (KPIs y tablas); evita cargar notas, vínculos, tipos, etc.
 */
public record CitaDashboardRow(
        Instant inicioTs, String estado, String pacienteNombre, String especialistaNombre) {}
