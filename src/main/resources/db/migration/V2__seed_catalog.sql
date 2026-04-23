INSERT INTO tipo_catalogo (codigo, nombre, descripcion, activo) VALUES
    ('ESPECIALIDAD', 'Especialidad médica', 'Especialidades clínicas', TRUE),
    ('DOCUMENTO_TIPO', 'Tipo de documento', 'Clasificación de documentos de paciente', TRUE),
    ('ESTADO_CITA', 'Estado de cita', 'Estados posibles de una cita', TRUE);

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'PEDIATRIA', 'Pediatría', 1, TRUE FROM tipo_catalogo WHERE codigo = 'ESPECIALIDAD';

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT id, 'NEUROLOGIA', 'Neurología', 2, TRUE FROM tipo_catalogo WHERE codigo = 'ESPECIALIDAD';

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
