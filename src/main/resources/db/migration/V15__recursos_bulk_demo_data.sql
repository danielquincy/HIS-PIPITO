-- Carga masiva demo para validar pantalla Recursos con volumen realista.
-- Incluye más salas, más recursos clínicos y muchas reservaciones con vínculos a recursos.

-- ====== SALAS ADICIONALES ======
INSERT INTO sala (codigo, nombre, activo)
SELECT 'CONS2', 'Consultorio 2', TRUE
WHERE NOT EXISTS (SELECT 1 FROM sala WHERE codigo = 'CONS2');

INSERT INTO sala (codigo, nombre, activo)
SELECT 'CONS3', 'Consultorio 3', TRUE
WHERE NOT EXISTS (SELECT 1 FROM sala WHERE codigo = 'CONS3');

INSERT INTO sala (codigo, nombre, activo)
SELECT 'CONS4', 'Consultorio 4', TRUE
WHERE NOT EXISTS (SELECT 1 FROM sala WHERE codigo = 'CONS4');

INSERT INTO sala (codigo, nombre, activo)
SELECT 'TER_FIS_1', 'Sala Terapia Física 1', TRUE
WHERE NOT EXISTS (SELECT 1 FROM sala WHERE codigo = 'TER_FIS_1');

INSERT INTO sala (codigo, nombre, activo)
SELECT 'TER_FIS_2', 'Sala Terapia Física 2', TRUE
WHERE NOT EXISTS (SELECT 1 FROM sala WHERE codigo = 'TER_FIS_2');

INSERT INTO sala (codigo, nombre, activo)
SELECT 'TER_LEN_1', 'Sala Terapia de Lenguaje 1', TRUE
WHERE NOT EXISTS (SELECT 1 FROM sala WHERE codigo = 'TER_LEN_1');

INSERT INTO sala (codigo, nombre, activo)
SELECT 'EVAL_NEURO', 'Sala Evaluación Neuropediátrica', TRUE
WHERE NOT EXISTS (SELECT 1 FROM sala WHERE codigo = 'EVAL_NEURO');

INSERT INTO sala (codigo, nombre, activo)
SELECT 'SENSORIAL', 'Sala Estimulación Sensorial', TRUE
WHERE NOT EXISTS (SELECT 1 FROM sala WHERE codigo = 'SENSORIAL');

-- ====== RECURSOS ADICIONALES ======
INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'CAMILLA_PEDIATRICA', 'Camilla pediátrica', 10, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'CAMILLA_PEDIATRICA');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'BASCULA_PEDIATRICA', 'Báscula pediátrica', 11, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'BASCULA_PEDIATRICA');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'TALLIMETRO', 'Tallímetro', 12, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'TALLIMETRO');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'OXIMETRO', 'Oxímetro de pulso', 13, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'OXIMETRO');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'NEBULIZADOR', 'Nebulizador', 14, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'NEBULIZADOR');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'TENSIOMETRO_DIGITAL', 'Tensiómetro digital', 15, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'TENSIOMETRO_DIGITAL');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'ESTETOSCOPIO_PED', 'Estetoscopio pediátrico', 16, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'ESTETOSCOPIO_PED');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'SET_MOTRICIDAD_FINA', 'Set motricidad fina', 17, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'SET_MOTRICIDAD_FINA');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'TABLERO_SENSORIAL', 'Tablero sensorial', 18, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'TABLERO_SENSORIAL');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'SET_LOGOPEDIA', 'Set logopedia', 19, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'SET_LOGOPEDIA');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'LAMPARA_EXPLORACION', 'Lámpara de exploración', 20, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'LAMPARA_EXPLORACION');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'KIT_EVALUACION_COG', 'Kit evaluación cognitiva', 21, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'KIT_EVALUACION_COG');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'SILLA_POSTURAL', 'Silla postural', 22, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'SILLA_POSTURAL');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'BARRAS_PARALELAS', 'Barras paralelas', 23, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'BARRAS_PARALELAS');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'PELOTA_TERAPIA', 'Pelota de terapia', 24, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'PELOTA_TERAPIA');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'COLCHONETA_TERAPIA', 'Colchoneta de terapia', 25, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'COLCHONETA_TERAPIA');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'SET_INTEGRACION_SENSORIAL', 'Set integración sensorial', 26, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'SET_INTEGRACION_SENSORIAL');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'EQUIPO_ELECTROESTIM', 'Equipo de electroestimulación', 27, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'EQUIPO_ELECTROESTIM');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'SET_VALORACION_NEURO', 'Set valoración neurológica', 28, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'SET_VALORACION_NEURO');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'KIT_ESTIMULACION_TEMPRANA', 'Kit estimulación temprana', 29, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'KIT_ESTIMULACION_TEMPRANA');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'SET_EVALUACION_LENGUAJE', 'Set evaluación de lenguaje', 30, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'SET_EVALUACION_LENGUAJE');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'AUDIOMETRO_PORTATIL', 'Audiómetro portátil', 31, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'AUDIOMETRO_PORTATIL');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'SET_PRAXIAS', 'Set de praxias', 32, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'SET_PRAXIAS');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'MESA_OCUPACIONAL', 'Mesa de terapia ocupacional', 33, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'MESA_OCUPACIONAL');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'KIT_ESTIRAMIENTO', 'Kit de estiramiento', 34, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'KIT_ESTIRAMIENTO');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'SET_EVALUACION_POSTURAL', 'Set evaluación postural', 35, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'SET_EVALUACION_POSTURAL');

-- ====== CITAS MASIVAS ======
-- Crea 120 citas distribuidas en el tiempo para observar comportamiento de disponibilidad.
INSERT INTO cita (
    paciente_id, especialista_id, inicio_ts, fin_ts, duracion_minutos, estado, notas,
    tipo_cita_catalogo_id, sala_id, motivo_texto, origen, created_by_user_id
)
SELECT
    base.paciente_id,
    base.especialista_id,
    (CURRENT_TIMESTAMP - INTERVAL '25 day' + ((base.rn - 1) * INTERVAL '90 minute')) AS inicio_ts,
    (CURRENT_TIMESTAMP - INTERVAL '25 day' + ((base.rn - 1) * INTERVAL '90 minute') + INTERVAL '45 minute') AS fin_ts,
    45,
    CASE MOD(base.rn, 6)
        WHEN 0 THEN 'PROGRAMADA'
        WHEN 1 THEN 'PROGRAMADA'
        WHEN 2 THEN 'COMPLETADA'
        WHEN 3 THEN 'PROGRAMADA'
        WHEN 4 THEN 'NO_ASISTIO'
        ELSE 'CANCELADA'
    END AS estado,
    'Carga masiva de validación operativa #' || base.rn,
    tipos.tipo_cita_catalogo_id,
    base.sala_id,
    'DEMO_RECURSOS_CARGA_MASIVA',
    'INTERNO',
    NULL
FROM (
    SELECT
        p.id AS paciente_id,
        e.id AS especialista_id,
        s.id AS sala_id,
        ROW_NUMBER() OVER (ORDER BY p.id, e.id, s.id) AS rn
    FROM paciente p
    JOIN especialista e ON e.activo = TRUE
    JOIN sala s ON s.activo = TRUE
    WHERE p.numero_expediente LIKE 'EXP-TEST-%'
) base
JOIN (
    SELECT
        c.id AS tipo_cita_catalogo_id,
        ROW_NUMBER() OVER (ORDER BY c.id) AS rn_tipo
    FROM catalogo c
    JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
    WHERE t.codigo = 'TIPO_CITA' AND c.activo = TRUE
) tipos ON tipos.rn_tipo = MOD(base.rn, 3) + 1
WHERE base.rn <= 120
  AND NOT EXISTS (
      SELECT 1 FROM cita c WHERE c.motivo_texto = 'DEMO_RECURSOS_CARGA_MASIVA'
  );

-- ====== VINCULOS DE RECURSO PARA CADA CITA MASIVA ======
INSERT INTO cita_vinculo (cita_id, tipo_vinculo, ref_id, descripcion)
SELECT
    c.id,
    'RECURSO',
    r.id,
    r.nombre
FROM cita c
JOIN (
    SELECT
        cc.id,
        cc.nombre,
        ROW_NUMBER() OVER (ORDER BY cc.orden, cc.id) AS rn
    FROM catalogo cc
    JOIN tipo_catalogo tt ON tt.id = cc.tipo_catalogo_id
    WHERE tt.codigo = 'RECURSO_CLINICO' AND cc.activo = TRUE
) r ON r.rn = MOD(c.id, 10) + 1
WHERE c.motivo_texto = 'DEMO_RECURSOS_CARGA_MASIVA'
  AND NOT EXISTS (
      SELECT 1
      FROM cita_vinculo v
      WHERE v.cita_id = c.id
        AND v.tipo_vinculo = 'RECURSO'
  );
