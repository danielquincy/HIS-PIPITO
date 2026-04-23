-- Pantalla Recursos en IAM + catálogo base para vincular recursos en citas.

INSERT INTO iam_pantalla (codigo, nombre, descripcion, ruta, orden, activo, tipo, parent_id)
SELECT 'RECURSOS', 'Recursos', 'Disponibilidad de salas y recursos', '/app/pages/recursos.html', 9, TRUE, 'PANTALLA', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM iam_pantalla WHERE codigo = 'RECURSOS'
);

INSERT INTO iam_pantalla_rol (pantalla_id, role_id)
SELECT p.id, r.id
FROM iam_pantalla p
CROSS JOIN app_role r
WHERE p.codigo = 'RECURSOS'
  AND r.name IN ('ROLE_ADMIN', 'ROLE_COORDINADOR', 'ROLE_MEDICO')
  AND NOT EXISTS (
    SELECT 1
    FROM iam_pantalla_rol x
    WHERE x.pantalla_id = p.id
      AND x.role_id = r.id
  );

INSERT INTO tipo_catalogo (codigo, nombre, descripcion, activo)
SELECT 'RECURSO_CLINICO', 'Recursos clínicos', 'Recursos adicionales para reservar en citas', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM tipo_catalogo WHERE codigo = 'RECURSO_CLINICO'
);

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'EQUIPO_ULTRASONIDO', 'Equipo de ultrasonido', 1, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (
    SELECT 1
    FROM catalogo c
    WHERE c.tipo_catalogo_id = t.id
      AND c.codigo = 'EQUIPO_ULTRASONIDO'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'MONITOR_SIGNOS', 'Monitor de signos vitales', 2, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (
    SELECT 1
    FROM catalogo c
    WHERE c.tipo_catalogo_id = t.id
      AND c.codigo = 'MONITOR_SIGNOS'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'KIT_REHABILITACION', 'Kit de rehabilitación', 3, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'RECURSO_CLINICO'
  AND NOT EXISTS (
    SELECT 1
    FROM catalogo c
    WHERE c.tipo_catalogo_id = t.id
      AND c.codigo = 'KIT_REHABILITACION'
  );
