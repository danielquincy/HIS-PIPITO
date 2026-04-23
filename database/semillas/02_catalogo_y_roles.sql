-- HIS-PIPITOS — catálogos y roles base (equivalente a Flyway V2__seed_catalog.sql, sintaxis H2)
-- Requiere que exista el esquema (01_schema.sql o migraciones Flyway).

INSERT INTO tipo_catalogo (codigo, nombre, descripcion, activo) VALUES
    ('ESPECIALIDAD', 'Especialidad médica', 'Especialidades clínicas', TRUE),
    ('UNIDAD_OPERATIVA', 'Unidad operativa', 'Unidades organizativas para servicios técnicos', TRUE),
    ('DOCUMENTO_TIPO', 'Tipo de documento', 'Clasificación de documentos de paciente', TRUE),
    ('ESTADO_CITA', 'Estado de cita', 'Estados posibles de una cita', TRUE);

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'UNIDAD_ATENCION_MEDICA', 'Unidad de Atención Médica', 1, TRUE FROM tipo_catalogo WHERE codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'UNIDAD_REHABILITACION', 'Unidad de Rehabilitación', 2, TRUE FROM tipo_catalogo WHERE codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'UNIDAD_FORMACION', 'Unidad de Formación', 3, TRUE FROM tipo_catalogo WHERE codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'NEUROPEDIATRIA', 'Neuropediatría', 1, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_ATENCION_MEDICA'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'FISIATRIA', 'Fisiatría', 2, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_ATENCION_MEDICA'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'PEDIATRIA', 'Pediatría', 3, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_ATENCION_MEDICA'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'FISIOTERAPIA', 'Fisioterapia', 1, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_REHABILITACION'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'TERAPIA_LENGUAJE', 'Terapia del Lenguaje', 2, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_REHABILITACION'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'PSICOLOGIA', 'Psicología', 3, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_REHABILITACION'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'PSICOPEDAGOGIA', 'Psicopedagogía', 4, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_REHABILITACION'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'ESTIMULACION_TEMPRANA', 'Estimulación Temprana', 5, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_REHABILITACION'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'CONSEJERIA_FAMILIAR', 'Consejería Familiar', 1, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_FORMACION'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, 'CAPACITACION_PADRES', 'Capacitación a Padres', 2, TRUE
FROM tipo_catalogo te
JOIN catalogo u ON u.codigo = 'UNIDAD_FORMACION'
JOIN tipo_catalogo tu ON u.tipo_catalogo_id = tu.id
WHERE te.codigo = 'ESPECIALIDAD' AND tu.codigo = 'UNIDAD_OPERATIVA';

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'HISTORIA_CLINICA', 'Historia clínica', 1, TRUE FROM tipo_catalogo WHERE codigo = 'DOCUMENTO_TIPO';

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'LABORATORIO', 'Laboratorio', 2, TRUE FROM tipo_catalogo WHERE codigo = 'DOCUMENTO_TIPO';

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'PROGRAMADA', 'Programada', 1, TRUE FROM tipo_catalogo WHERE codigo = 'ESTADO_CITA';

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'COMPLETADA', 'Completada', 2, TRUE FROM tipo_catalogo WHERE codigo = 'ESTADO_CITA';

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'CANCELADA', 'Cancelada', 3, TRUE FROM tipo_catalogo WHERE codigo = 'ESTADO_CITA';

INSERT INTO app_role (name) SELECT 'ROLE_ADMIN' WHERE NOT EXISTS (SELECT 1 FROM app_role WHERE name = 'ROLE_ADMIN');
INSERT INTO app_role (name) SELECT 'ROLE_COORDINADOR' WHERE NOT EXISTS (SELECT 1 FROM app_role WHERE name = 'ROLE_COORDINADOR');
INSERT INTO app_role (name) SELECT 'ROLE_MEDICO' WHERE NOT EXISTS (SELECT 1 FROM app_role WHERE name = 'ROLE_MEDICO');
INSERT INTO app_role (name) SELECT 'ROLE_CONSULTA' WHERE NOT EXISTS (SELECT 1 FROM app_role WHERE name = 'ROLE_CONSULTA');
