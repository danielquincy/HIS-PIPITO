-- Carga adicional para demos:
-- - Más pacientes
-- - Más citas con fechas entre enero y junio
-- - Cobertura cruzada entre pacientes y especialistas activos

-- ====== PACIENTES ADICIONALES ======
INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Valeria', 'Acosta', 'EXP-TEST-006', DATE '2014-02-11', '88882006', 'Seguimiento mensual', 'Apoyo de lenguaje expresivo',
    'Managua', 'FEMENINO', 'Nora Acosta (madre)', 'Trastorno del desarrollo del habla', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-006');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Tomás', 'Blandón', 'EXP-TEST-007', DATE '2012-05-03', '88882007', 'Plan interdisciplinario', 'Rehabilitación motora',
    'Tipitapa', 'MASCULINO', 'Rosa Blandón (madre)', 'Seguimiento de fisiatría', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-007');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Gabriela', 'Cano', 'EXP-TEST-008', DATE '2017-08-19', '88882008', 'Control bimensual', 'Estimulación temprana',
    'Masaya', 'FEMENINO', 'Luis Cano (padre)', 'Retraso del neurodesarrollo', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-008');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Andrés', 'Duarte', 'EXP-TEST-009', DATE '2011-12-09', '88882009', 'Evaluación funcional', 'Apoyo psicopedagógico',
    'León', 'MASCULINO', 'Marta Duarte (tutora)', 'Dificultades de aprendizaje', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-009');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Sofía', 'Espinoza', 'EXP-TEST-010', DATE '2013-01-25', '88882010', 'Seguimiento integral', 'Intervención sensorial',
    'Granada', 'FEMENINO', 'Carlos Espinoza (padre)', 'Desregulación sensorial', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-010');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Bruno', 'Flores', 'EXP-TEST-011', DATE '2015-06-14', '88882011', 'Control por especialidad', 'Terapia ocupacional',
    'Managua', 'MASCULINO', 'Elena Flores (madre)', 'Motricidad fina', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-011');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Isabella', 'Gutiérrez', 'EXP-TEST-012', DATE '2010-04-06', '88882012', 'Seguimiento trimestral', 'Apoyo cognitivo',
    'Carazo', 'FEMENINO', 'Miguel Gutiérrez (padre)', 'Reforzamiento neurocognitivo', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-012');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Samuel', 'Hernández', 'EXP-TEST-013', DATE '2016-10-31', '88882013', 'Ingreso nuevo', 'Apoyo de integración escolar',
    'Chinandega', 'MASCULINO', 'María Hernández (madre)', 'Dificultad de comunicación social', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-013');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Daniela', 'Ibarra', 'EXP-TEST-014', DATE '2012-09-12', '88882014', 'Control de progreso', 'Fisioterapia pediátrica',
    'Estelí', 'FEMENINO', 'José Ibarra (padre)', 'Alteraciones posturales', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-014');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Nicolás', 'Jiménez', 'EXP-TEST-015', DATE '2014-11-20', '88882015', 'Monitoreo mensual', 'Intervención del habla',
    'Rivas', 'MASCULINO', 'Paola Jiménez (madre)', 'Dislalia funcional', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-015');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Martina', 'López', 'EXP-TEST-016', DATE '2011-03-08', '88882016', 'Revaloración clínica', 'Apoyo motor grueso',
    'Matagalpa', 'FEMENINO', 'David López (padre)', 'Secuelas motoras leves', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-016');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Thiago', 'Morales', 'EXP-TEST-017', DATE '2013-07-27', '88882017', 'Control por terapia', 'Psicomotricidad',
    'Boaco', 'MASCULINO', 'Ruth Morales (madre)', 'Retraso psicomotor', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-017');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Amanda', 'Núñez', 'EXP-TEST-018', DATE '2015-01-16', '88882018', 'Seguimiento de adaptación', 'Apoyo emocional',
    'Jinotega', 'FEMENINO', 'Rafael Núñez (padre)', 'Ansiedad asociada a intervención', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-018');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Emiliano', 'Orozco', 'EXP-TEST-019', DATE '2010-06-22', '88882019', 'Control ampliado', 'Soporte funcional',
    'Managua', 'MASCULINO', 'Lidia Orozco (madre)', 'Seguimiento neurológico', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-019');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Renata', 'Pérez', 'EXP-TEST-020', DATE '2016-04-29', '88882020', 'Evolución favorable', 'Lenguaje receptivo',
    'Masaya', 'FEMENINO', 'Iván Pérez (padre)', 'Retraso leve del lenguaje', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-020');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Gael', 'Quintero', 'EXP-TEST-021', DATE '2012-02-13', '88882021', 'Monitoreo de conducta', 'Intervención escolar',
    'Nueva Segovia', 'MASCULINO', 'Andrea Quintero (madre)', 'Dificultades de autorregulación', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-021');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Mía', 'Ramírez', 'EXP-TEST-022', DATE '2014-09-01', '88882022', 'Control clínico', 'Estimulación multisensorial',
    'León', 'FEMENINO', 'Óscar Ramírez (padre)', 'Integración sensorial', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-022');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Liam', 'Sánchez', 'EXP-TEST-023', DATE '2013-05-26', '88882023', 'Plan activo', 'Terapia de apoyo',
    'Chontales', 'MASCULINO', 'Patricia Sánchez (madre)', 'Déficit atencional', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-023');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Alma', 'Téllez', 'EXP-TEST-024', DATE '2011-07-15', '88882024', 'Revisión semestral', 'Fisiatría + lenguaje',
    'Madriz', 'FEMENINO', 'Noel Téllez (padre)', 'Compromiso motor y de lenguaje', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-024');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Ian', 'Urbina', 'EXP-TEST-025', DATE '2015-12-02', '88882025', 'Atención compartida', 'Intervención interdisciplinaria',
    'Granada', 'MASCULINO', 'Karla Urbina (madre)', 'Retraso global del desarrollo', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-025');

-- ====== CITAS ENE-JUN PARA TODOS LOS PACIENTES Y ESPECIALISTAS ======
-- Genera 6 citas por combinación paciente-especialista (enero a junio), con salas y tipos de cita rotativos.
INSERT INTO cita (
    paciente_id, especialista_id, inicio_ts, fin_ts, duracion_minutos, estado, notas,
    tipo_cita_catalogo_id, sala_id, motivo_texto, origen, created_by_user_id
)
SELECT
    base.paciente_id,
    base.especialista_id,
    (base.month_start + ((base.day_of_month - 1) * INTERVAL '1 day') + (base.start_min * INTERVAL '1 minute')) AS inicio_ts,
    (base.month_start + ((base.day_of_month - 1) * INTERVAL '1 day') + ((base.start_min + 45) * INTERVAL '1 minute')) AS fin_ts,
    45 AS duracion_minutos,
    CASE MOD(base.seq_global, 7)
        WHEN 0 THEN 'PROGRAMADA'
        WHEN 1 THEN 'COMPLETADA'
        WHEN 2 THEN 'PROGRAMADA'
        WHEN 3 THEN 'COMPLETADA'
        WHEN 4 THEN 'PROGRAMADA'
        WHEN 5 THEN 'NO_ASISTIO'
        ELSE 'CANCELADA'
    END AS estado,
    'Agenda demo enero-junio #' || base.seq_global AS notas,
    tipos.tipo_cita_catalogo_id,
    salas.sala_id,
    'DEMO_ENE_JUN_2026',
    'INTERNO',
    NULL
FROM (
    SELECT
        p.id AS paciente_id,
        e.id AS especialista_id,
        m.month_start,
        m.day_of_month,
        m.start_min,
        m.month_seq,
        ROW_NUMBER() OVER (ORDER BY p.id, e.id, m.month_seq) AS seq_global
    FROM paciente p
    JOIN especialista e ON e.activo = TRUE
    JOIN (
        SELECT DATE '2026-01-01' AS month_start, 6 AS day_of_month, 480 AS start_min, 1 AS month_seq
        UNION ALL SELECT DATE '2026-02-01', 7, 540, 2
        UNION ALL SELECT DATE '2026-03-01', 8, 600, 3
        UNION ALL SELECT DATE '2026-04-01', 9, 660, 4
        UNION ALL SELECT DATE '2026-05-01', 10, 720, 5
        UNION ALL SELECT DATE '2026-06-01', 11, 780, 6
    ) m ON 1 = 1
    WHERE p.activo = TRUE
) base
JOIN (
    SELECT
        c.id AS tipo_cita_catalogo_id,
        ROW_NUMBER() OVER (ORDER BY c.orden, c.id) AS rn_tipo,
        COUNT(*) OVER () AS total_tipos
    FROM catalogo c
    JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
    WHERE t.codigo = 'TIPO_CITA'
      AND c.activo = TRUE
) tipos ON tipos.rn_tipo = MOD(base.seq_global, tipos.total_tipos) + 1
JOIN (
    SELECT
        s.id AS sala_id,
        ROW_NUMBER() OVER (ORDER BY s.id) AS rn_sala,
        COUNT(*) OVER () AS total_salas
    FROM sala s
    WHERE s.activo = TRUE
) salas ON salas.rn_sala = MOD(base.seq_global, salas.total_salas) + 1
WHERE NOT EXISTS (
    SELECT 1
    FROM cita c
    WHERE c.motivo_texto = 'DEMO_ENE_JUN_2026'
);

-- ====== CALENDARIO OPERATIVO CARGADO ENE-JUN ======
-- Carga adicional para visualizar agenda "llena" en entorno demo:
-- - 4 dias por mes (enero-junio)
-- - 8 bloques por dia (08:00-15:00 cada hora)
-- - Cruce de pacientes activos con especialistas activos
INSERT INTO cita (
    paciente_id, especialista_id, inicio_ts, fin_ts, duracion_minutos, estado, notas,
    tipo_cita_catalogo_id, sala_id, motivo_texto, origen, created_by_user_id
)
SELECT
    base.paciente_id,
    base.especialista_id,
    (base.month_start + ((base.day_of_month - 1) * INTERVAL '1 day') + (base.start_min * INTERVAL '1 minute')) AS inicio_ts,
    (base.month_start + ((base.day_of_month - 1) * INTERVAL '1 day') + ((base.start_min + 50) * INTERVAL '1 minute')) AS fin_ts,
    50 AS duracion_minutos,
    CASE MOD(base.seq_global, 6)
        WHEN 0 THEN 'PROGRAMADA'
        WHEN 1 THEN 'COMPLETADA'
        WHEN 2 THEN 'PROGRAMADA'
        WHEN 3 THEN 'COMPLETADA'
        WHEN 4 THEN 'NO_ASISTIO'
        ELSE 'CANCELADA'
    END AS estado,
    'Calendario operativo demo ene-jun bloque #' || base.seq_global AS notas,
    tipos.tipo_cita_catalogo_id,
    salas.sala_id,
    'DEMO_CALENDARIO_LLENO_ENE_JUN_2026',
    'INTERNO',
    NULL
FROM (
    SELECT
        p.id AS paciente_id,
        e.id AS especialista_id,
        g.month_start,
        g.day_of_month,
        g.start_min,
        g.slot_seq,
        ROW_NUMBER() OVER (ORDER BY p.id, e.id, g.month_start, g.day_of_month, g.start_min) AS seq_global
    FROM paciente p
    JOIN especialista e ON e.activo = TRUE
    JOIN (
        -- Enero
        SELECT DATE '2026-01-01' AS month_start, 5 AS day_of_month, 480 AS start_min, 1 AS slot_seq
        UNION ALL SELECT DATE '2026-01-01', 5, 540, 2
        UNION ALL SELECT DATE '2026-01-01', 5, 600, 3
        UNION ALL SELECT DATE '2026-01-01', 5, 660, 4
        UNION ALL SELECT DATE '2026-01-01', 5, 720, 5
        UNION ALL SELECT DATE '2026-01-01', 5, 780, 6
        UNION ALL SELECT DATE '2026-01-01', 5, 840, 7
        UNION ALL SELECT DATE '2026-01-01', 5, 900, 8
        UNION ALL SELECT DATE '2026-01-01', 12, 480, 9
        UNION ALL SELECT DATE '2026-01-01', 12, 540, 10
        UNION ALL SELECT DATE '2026-01-01', 12, 600, 11
        UNION ALL SELECT DATE '2026-01-01', 12, 660, 12
        UNION ALL SELECT DATE '2026-01-01', 12, 720, 13
        UNION ALL SELECT DATE '2026-01-01', 12, 780, 14
        UNION ALL SELECT DATE '2026-01-01', 12, 840, 15
        UNION ALL SELECT DATE '2026-01-01', 12, 900, 16
        UNION ALL SELECT DATE '2026-01-01', 19, 480, 17
        UNION ALL SELECT DATE '2026-01-01', 19, 540, 18
        UNION ALL SELECT DATE '2026-01-01', 19, 600, 19
        UNION ALL SELECT DATE '2026-01-01', 19, 660, 20
        UNION ALL SELECT DATE '2026-01-01', 19, 720, 21
        UNION ALL SELECT DATE '2026-01-01', 19, 780, 22
        UNION ALL SELECT DATE '2026-01-01', 19, 840, 23
        UNION ALL SELECT DATE '2026-01-01', 19, 900, 24
        UNION ALL SELECT DATE '2026-01-01', 26, 480, 25
        UNION ALL SELECT DATE '2026-01-01', 26, 540, 26
        UNION ALL SELECT DATE '2026-01-01', 26, 600, 27
        UNION ALL SELECT DATE '2026-01-01', 26, 660, 28
        UNION ALL SELECT DATE '2026-01-01', 26, 720, 29
        UNION ALL SELECT DATE '2026-01-01', 26, 780, 30
        UNION ALL SELECT DATE '2026-01-01', 26, 840, 31
        UNION ALL SELECT DATE '2026-01-01', 26, 900, 32
        -- Febrero
        UNION ALL SELECT DATE '2026-02-01', 4, 480, 33
        UNION ALL SELECT DATE '2026-02-01', 4, 540, 34
        UNION ALL SELECT DATE '2026-02-01', 4, 600, 35
        UNION ALL SELECT DATE '2026-02-01', 4, 660, 36
        UNION ALL SELECT DATE '2026-02-01', 4, 720, 37
        UNION ALL SELECT DATE '2026-02-01', 4, 780, 38
        UNION ALL SELECT DATE '2026-02-01', 4, 840, 39
        UNION ALL SELECT DATE '2026-02-01', 4, 900, 40
        UNION ALL SELECT DATE '2026-02-01', 11, 480, 41
        UNION ALL SELECT DATE '2026-02-01', 11, 540, 42
        UNION ALL SELECT DATE '2026-02-01', 11, 600, 43
        UNION ALL SELECT DATE '2026-02-01', 11, 660, 44
        UNION ALL SELECT DATE '2026-02-01', 11, 720, 45
        UNION ALL SELECT DATE '2026-02-01', 11, 780, 46
        UNION ALL SELECT DATE '2026-02-01', 11, 840, 47
        UNION ALL SELECT DATE '2026-02-01', 11, 900, 48
        UNION ALL SELECT DATE '2026-02-01', 18, 480, 49
        UNION ALL SELECT DATE '2026-02-01', 18, 540, 50
        UNION ALL SELECT DATE '2026-02-01', 18, 600, 51
        UNION ALL SELECT DATE '2026-02-01', 18, 660, 52
        UNION ALL SELECT DATE '2026-02-01', 18, 720, 53
        UNION ALL SELECT DATE '2026-02-01', 18, 780, 54
        UNION ALL SELECT DATE '2026-02-01', 18, 840, 55
        UNION ALL SELECT DATE '2026-02-01', 18, 900, 56
        UNION ALL SELECT DATE '2026-02-01', 25, 480, 57
        UNION ALL SELECT DATE '2026-02-01', 25, 540, 58
        UNION ALL SELECT DATE '2026-02-01', 25, 600, 59
        UNION ALL SELECT DATE '2026-02-01', 25, 660, 60
        UNION ALL SELECT DATE '2026-02-01', 25, 720, 61
        UNION ALL SELECT DATE '2026-02-01', 25, 780, 62
        UNION ALL SELECT DATE '2026-02-01', 25, 840, 63
        UNION ALL SELECT DATE '2026-02-01', 25, 900, 64
        -- Marzo
        UNION ALL SELECT DATE '2026-03-01', 4, 480, 65
        UNION ALL SELECT DATE '2026-03-01', 4, 540, 66
        UNION ALL SELECT DATE '2026-03-01', 4, 600, 67
        UNION ALL SELECT DATE '2026-03-01', 4, 660, 68
        UNION ALL SELECT DATE '2026-03-01', 4, 720, 69
        UNION ALL SELECT DATE '2026-03-01', 4, 780, 70
        UNION ALL SELECT DATE '2026-03-01', 4, 840, 71
        UNION ALL SELECT DATE '2026-03-01', 4, 900, 72
        UNION ALL SELECT DATE '2026-03-01', 11, 480, 73
        UNION ALL SELECT DATE '2026-03-01', 11, 540, 74
        UNION ALL SELECT DATE '2026-03-01', 11, 600, 75
        UNION ALL SELECT DATE '2026-03-01', 11, 660, 76
        UNION ALL SELECT DATE '2026-03-01', 11, 720, 77
        UNION ALL SELECT DATE '2026-03-01', 11, 780, 78
        UNION ALL SELECT DATE '2026-03-01', 11, 840, 79
        UNION ALL SELECT DATE '2026-03-01', 11, 900, 80
        UNION ALL SELECT DATE '2026-03-01', 18, 480, 81
        UNION ALL SELECT DATE '2026-03-01', 18, 540, 82
        UNION ALL SELECT DATE '2026-03-01', 18, 600, 83
        UNION ALL SELECT DATE '2026-03-01', 18, 660, 84
        UNION ALL SELECT DATE '2026-03-01', 18, 720, 85
        UNION ALL SELECT DATE '2026-03-01', 18, 780, 86
        UNION ALL SELECT DATE '2026-03-01', 18, 840, 87
        UNION ALL SELECT DATE '2026-03-01', 18, 900, 88
        UNION ALL SELECT DATE '2026-03-01', 25, 480, 89
        UNION ALL SELECT DATE '2026-03-01', 25, 540, 90
        UNION ALL SELECT DATE '2026-03-01', 25, 600, 91
        UNION ALL SELECT DATE '2026-03-01', 25, 660, 92
        UNION ALL SELECT DATE '2026-03-01', 25, 720, 93
        UNION ALL SELECT DATE '2026-03-01', 25, 780, 94
        UNION ALL SELECT DATE '2026-03-01', 25, 840, 95
        UNION ALL SELECT DATE '2026-03-01', 25, 900, 96
        -- Abril
        UNION ALL SELECT DATE '2026-04-01', 1, 480, 97
        UNION ALL SELECT DATE '2026-04-01', 1, 540, 98
        UNION ALL SELECT DATE '2026-04-01', 1, 600, 99
        UNION ALL SELECT DATE '2026-04-01', 1, 660, 100
        UNION ALL SELECT DATE '2026-04-01', 1, 720, 101
        UNION ALL SELECT DATE '2026-04-01', 1, 780, 102
        UNION ALL SELECT DATE '2026-04-01', 1, 840, 103
        UNION ALL SELECT DATE '2026-04-01', 1, 900, 104
        UNION ALL SELECT DATE '2026-04-01', 8, 480, 105
        UNION ALL SELECT DATE '2026-04-01', 8, 540, 106
        UNION ALL SELECT DATE '2026-04-01', 8, 600, 107
        UNION ALL SELECT DATE '2026-04-01', 8, 660, 108
        UNION ALL SELECT DATE '2026-04-01', 8, 720, 109
        UNION ALL SELECT DATE '2026-04-01', 8, 780, 110
        UNION ALL SELECT DATE '2026-04-01', 8, 840, 111
        UNION ALL SELECT DATE '2026-04-01', 8, 900, 112
        UNION ALL SELECT DATE '2026-04-01', 15, 480, 113
        UNION ALL SELECT DATE '2026-04-01', 15, 540, 114
        UNION ALL SELECT DATE '2026-04-01', 15, 600, 115
        UNION ALL SELECT DATE '2026-04-01', 15, 660, 116
        UNION ALL SELECT DATE '2026-04-01', 15, 720, 117
        UNION ALL SELECT DATE '2026-04-01', 15, 780, 118
        UNION ALL SELECT DATE '2026-04-01', 15, 840, 119
        UNION ALL SELECT DATE '2026-04-01', 15, 900, 120
        UNION ALL SELECT DATE '2026-04-01', 22, 480, 121
        UNION ALL SELECT DATE '2026-04-01', 22, 540, 122
        UNION ALL SELECT DATE '2026-04-01', 22, 600, 123
        UNION ALL SELECT DATE '2026-04-01', 22, 660, 124
        UNION ALL SELECT DATE '2026-04-01', 22, 720, 125
        UNION ALL SELECT DATE '2026-04-01', 22, 780, 126
        UNION ALL SELECT DATE '2026-04-01', 22, 840, 127
        UNION ALL SELECT DATE '2026-04-01', 22, 900, 128
        -- Mayo
        UNION ALL SELECT DATE '2026-05-01', 6, 480, 129
        UNION ALL SELECT DATE '2026-05-01', 6, 540, 130
        UNION ALL SELECT DATE '2026-05-01', 6, 600, 131
        UNION ALL SELECT DATE '2026-05-01', 6, 660, 132
        UNION ALL SELECT DATE '2026-05-01', 6, 720, 133
        UNION ALL SELECT DATE '2026-05-01', 6, 780, 134
        UNION ALL SELECT DATE '2026-05-01', 6, 840, 135
        UNION ALL SELECT DATE '2026-05-01', 6, 900, 136
        UNION ALL SELECT DATE '2026-05-01', 13, 480, 137
        UNION ALL SELECT DATE '2026-05-01', 13, 540, 138
        UNION ALL SELECT DATE '2026-05-01', 13, 600, 139
        UNION ALL SELECT DATE '2026-05-01', 13, 660, 140
        UNION ALL SELECT DATE '2026-05-01', 13, 720, 141
        UNION ALL SELECT DATE '2026-05-01', 13, 780, 142
        UNION ALL SELECT DATE '2026-05-01', 13, 840, 143
        UNION ALL SELECT DATE '2026-05-01', 13, 900, 144
        UNION ALL SELECT DATE '2026-05-01', 20, 480, 145
        UNION ALL SELECT DATE '2026-05-01', 20, 540, 146
        UNION ALL SELECT DATE '2026-05-01', 20, 600, 147
        UNION ALL SELECT DATE '2026-05-01', 20, 660, 148
        UNION ALL SELECT DATE '2026-05-01', 20, 720, 149
        UNION ALL SELECT DATE '2026-05-01', 20, 780, 150
        UNION ALL SELECT DATE '2026-05-01', 20, 840, 151
        UNION ALL SELECT DATE '2026-05-01', 20, 900, 152
        UNION ALL SELECT DATE '2026-05-01', 27, 480, 153
        UNION ALL SELECT DATE '2026-05-01', 27, 540, 154
        UNION ALL SELECT DATE '2026-05-01', 27, 600, 155
        UNION ALL SELECT DATE '2026-05-01', 27, 660, 156
        UNION ALL SELECT DATE '2026-05-01', 27, 720, 157
        UNION ALL SELECT DATE '2026-05-01', 27, 780, 158
        UNION ALL SELECT DATE '2026-05-01', 27, 840, 159
        UNION ALL SELECT DATE '2026-05-01', 27, 900, 160
        -- Junio
        UNION ALL SELECT DATE '2026-06-01', 3, 480, 161
        UNION ALL SELECT DATE '2026-06-01', 3, 540, 162
        UNION ALL SELECT DATE '2026-06-01', 3, 600, 163
        UNION ALL SELECT DATE '2026-06-01', 3, 660, 164
        UNION ALL SELECT DATE '2026-06-01', 3, 720, 165
        UNION ALL SELECT DATE '2026-06-01', 3, 780, 166
        UNION ALL SELECT DATE '2026-06-01', 3, 840, 167
        UNION ALL SELECT DATE '2026-06-01', 3, 900, 168
        UNION ALL SELECT DATE '2026-06-01', 10, 480, 169
        UNION ALL SELECT DATE '2026-06-01', 10, 540, 170
        UNION ALL SELECT DATE '2026-06-01', 10, 600, 171
        UNION ALL SELECT DATE '2026-06-01', 10, 660, 172
        UNION ALL SELECT DATE '2026-06-01', 10, 720, 173
        UNION ALL SELECT DATE '2026-06-01', 10, 780, 174
        UNION ALL SELECT DATE '2026-06-01', 10, 840, 175
        UNION ALL SELECT DATE '2026-06-01', 10, 900, 176
        UNION ALL SELECT DATE '2026-06-01', 17, 480, 177
        UNION ALL SELECT DATE '2026-06-01', 17, 540, 178
        UNION ALL SELECT DATE '2026-06-01', 17, 600, 179
        UNION ALL SELECT DATE '2026-06-01', 17, 660, 180
        UNION ALL SELECT DATE '2026-06-01', 17, 720, 181
        UNION ALL SELECT DATE '2026-06-01', 17, 780, 182
        UNION ALL SELECT DATE '2026-06-01', 17, 840, 183
        UNION ALL SELECT DATE '2026-06-01', 17, 900, 184
        UNION ALL SELECT DATE '2026-06-01', 24, 480, 185
        UNION ALL SELECT DATE '2026-06-01', 24, 540, 186
        UNION ALL SELECT DATE '2026-06-01', 24, 600, 187
        UNION ALL SELECT DATE '2026-06-01', 24, 660, 188
        UNION ALL SELECT DATE '2026-06-01', 24, 720, 189
        UNION ALL SELECT DATE '2026-06-01', 24, 780, 190
        UNION ALL SELECT DATE '2026-06-01', 24, 840, 191
        UNION ALL SELECT DATE '2026-06-01', 24, 900, 192
    ) g ON 1 = 1
    WHERE p.activo = TRUE
) base
JOIN (
    SELECT
        c.id AS tipo_cita_catalogo_id,
        ROW_NUMBER() OVER (ORDER BY c.orden, c.id) AS rn_tipo,
        COUNT(*) OVER () AS total_tipos
    FROM catalogo c
    JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
    WHERE t.codigo = 'TIPO_CITA'
      AND c.activo = TRUE
) tipos ON tipos.rn_tipo = MOD(base.seq_global, tipos.total_tipos) + 1
JOIN (
    SELECT
        s.id AS sala_id,
        ROW_NUMBER() OVER (ORDER BY s.id) AS rn_sala,
        COUNT(*) OVER () AS total_salas
    FROM sala s
    WHERE s.activo = TRUE
) salas ON salas.rn_sala = MOD(base.seq_global, salas.total_salas) + 1
WHERE NOT EXISTS (
    SELECT 1
    FROM cita c
    WHERE c.motivo_texto = 'DEMO_CALENDARIO_LLENO_ENE_JUN_2026'
);
