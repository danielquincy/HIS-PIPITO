-- Más tipos de consulta para robustecer pruebas en pantalla de Citas.

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'TERAPIA_INICIAL', 'Terapia inicial', 10, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'TIPO_CITA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'TERAPIA_INICIAL'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'TERAPIA_SEGUIMIENTO', 'Terapia de seguimiento', 11, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'TIPO_CITA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'TERAPIA_SEGUIMIENTO'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'EVALUACION_INTEGRAL', 'Evaluación integral', 12, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'TIPO_CITA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'EVALUACION_INTEGRAL'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'REEVALUACION', 'Reevaluación', 13, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'TIPO_CITA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'REEVALUACION'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'VALORACION_DOMICILIARIA', 'Valoración domiciliaria', 14, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'TIPO_CITA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'VALORACION_DOMICILIARIA'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'INTERCONSULTA', 'Interconsulta', 15, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'TIPO_CITA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'INTERCONSULTA'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'SESION_GRUPAL', 'Sesión grupal', 16, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'TIPO_CITA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'SESION_GRUPAL'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'ALTA_CLINICA', 'Alta clínica', 17, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'TIPO_CITA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'ALTA_CLINICA'
  );

-- Reglas por tipo (duración y buffers)
INSERT INTO tipo_cita_regla (catalogo_id, duracion_minutos, buffer_antes_minutos, buffer_despues_minutos)
SELECT c.id, 60, 5, 10
FROM catalogo c
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
WHERE t.codigo = 'TIPO_CITA'
  AND c.codigo = 'TERAPIA_INICIAL'
  AND NOT EXISTS (SELECT 1 FROM tipo_cita_regla r WHERE r.catalogo_id = c.id);

INSERT INTO tipo_cita_regla (catalogo_id, duracion_minutos, buffer_antes_minutos, buffer_despues_minutos)
SELECT c.id, 45, 0, 5
FROM catalogo c
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
WHERE t.codigo = 'TIPO_CITA'
  AND c.codigo = 'TERAPIA_SEGUIMIENTO'
  AND NOT EXISTS (SELECT 1 FROM tipo_cita_regla r WHERE r.catalogo_id = c.id);

INSERT INTO tipo_cita_regla (catalogo_id, duracion_minutos, buffer_antes_minutos, buffer_despues_minutos)
SELECT c.id, 90, 10, 15
FROM catalogo c
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
WHERE t.codigo = 'TIPO_CITA'
  AND c.codigo = 'EVALUACION_INTEGRAL'
  AND NOT EXISTS (SELECT 1 FROM tipo_cita_regla r WHERE r.catalogo_id = c.id);

INSERT INTO tipo_cita_regla (catalogo_id, duracion_minutos, buffer_antes_minutos, buffer_despues_minutos)
SELECT c.id, 60, 5, 10
FROM catalogo c
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
WHERE t.codigo = 'TIPO_CITA'
  AND c.codigo = 'REEVALUACION'
  AND NOT EXISTS (SELECT 1 FROM tipo_cita_regla r WHERE r.catalogo_id = c.id);

INSERT INTO tipo_cita_regla (catalogo_id, duracion_minutos, buffer_antes_minutos, buffer_despues_minutos)
SELECT c.id, 75, 10, 10
FROM catalogo c
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
WHERE t.codigo = 'TIPO_CITA'
  AND c.codigo = 'VALORACION_DOMICILIARIA'
  AND NOT EXISTS (SELECT 1 FROM tipo_cita_regla r WHERE r.catalogo_id = c.id);

INSERT INTO tipo_cita_regla (catalogo_id, duracion_minutos, buffer_antes_minutos, buffer_despues_minutos)
SELECT c.id, 30, 0, 5
FROM catalogo c
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
WHERE t.codigo = 'TIPO_CITA'
  AND c.codigo = 'INTERCONSULTA'
  AND NOT EXISTS (SELECT 1 FROM tipo_cita_regla r WHERE r.catalogo_id = c.id);

INSERT INTO tipo_cita_regla (catalogo_id, duracion_minutos, buffer_antes_minutos, buffer_despues_minutos)
SELECT c.id, 90, 10, 10
FROM catalogo c
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
WHERE t.codigo = 'TIPO_CITA'
  AND c.codigo = 'SESION_GRUPAL'
  AND NOT EXISTS (SELECT 1 FROM tipo_cita_regla r WHERE r.catalogo_id = c.id);

INSERT INTO tipo_cita_regla (catalogo_id, duracion_minutos, buffer_antes_minutos, buffer_despues_minutos)
SELECT c.id, 45, 0, 5
FROM catalogo c
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
WHERE t.codigo = 'TIPO_CITA'
  AND c.codigo = 'ALTA_CLINICA'
  AND NOT EXISTS (SELECT 1 FROM tipo_cita_regla r WHERE r.catalogo_id = c.id);
