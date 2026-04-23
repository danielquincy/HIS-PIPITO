-- Datos demo persistentes para arranque local
-- Objetivo: al menos 10 especialistas y 5 pacientes disponibles

-- ====== STAFF / ESPECIALISTAS ======
INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Ana', 'García', 'a.garcia@ejemplo.org', '22221001', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'a.garcia@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Carlos', 'Mora', 'c.mora@ejemplo.org', '22221002', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'c.mora@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Lucía', 'Ríos', 'l.rios@ejemplo.org', '22221003', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'l.rios@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Mario', 'Suazo', 'm.suazo@ejemplo.org', '22221004', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'm.suazo@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Elena', 'López', 'e.lopez@ejemplo.org', '22221005', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'e.lopez@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Javier', 'Pineda', 'j.pineda@ejemplo.org', '22221006', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'j.pineda@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Marta', 'Cruz', 'm.cruz@ejemplo.org', '22221007', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'm.cruz@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Diego', 'Navarro', 'd.navarro@ejemplo.org', '22221008', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'd.navarro@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Paola', 'Martínez', 'p.martinez@ejemplo.org', '22221009', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'p.martinez@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'René', 'Ortiz', 'r.ortiz@ejemplo.org', '22221010', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'r.ortiz@ejemplo.org');

INSERT INTO especialista (staff_id, activo)
SELECT s.id, TRUE
FROM staff s
WHERE s.email IN (
    'a.garcia@ejemplo.org', 'c.mora@ejemplo.org', 'l.rios@ejemplo.org', 'm.suazo@ejemplo.org',
    'e.lopez@ejemplo.org', 'j.pineda@ejemplo.org', 'm.cruz@ejemplo.org', 'd.navarro@ejemplo.org',
    'p.martinez@ejemplo.org', 'r.ortiz@ejemplo.org'
)
AND NOT EXISTS (SELECT 1 FROM especialista e WHERE e.staff_id = s.id);

INSERT INTO especialista_especialidad (especialista_id, catalogo_id)
SELECT e.id, c.id
FROM especialista e
JOIN staff s ON s.id = e.staff_id
JOIN catalogo c ON c.codigo = 'PEDIATRIA'
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id AND t.codigo = 'ESPECIALIDAD'
WHERE s.email IN ('a.garcia@ejemplo.org', 'p.martinez@ejemplo.org')
AND NOT EXISTS (
    SELECT 1 FROM especialista_especialidad ee
    WHERE ee.especialista_id = e.id AND ee.catalogo_id = c.id
);

INSERT INTO especialista_especialidad (especialista_id, catalogo_id)
SELECT e.id, c.id
FROM especialista e
JOIN staff s ON s.id = e.staff_id
JOIN catalogo c ON c.codigo = 'NEUROPEDIATRIA'
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id AND t.codigo = 'ESPECIALIDAD'
WHERE s.email IN ('c.mora@ejemplo.org', 'r.ortiz@ejemplo.org')
AND NOT EXISTS (
    SELECT 1 FROM especialista_especialidad ee
    WHERE ee.especialista_id = e.id AND ee.catalogo_id = c.id
);

INSERT INTO especialista_especialidad (especialista_id, catalogo_id)
SELECT e.id, c.id
FROM especialista e
JOIN staff s ON s.id = e.staff_id
JOIN catalogo c ON c.codigo = 'FISIATRIA'
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id AND t.codigo = 'ESPECIALIDAD'
WHERE s.email IN ('l.rios@ejemplo.org', 'j.pineda@ejemplo.org')
AND NOT EXISTS (
    SELECT 1 FROM especialista_especialidad ee
    WHERE ee.especialista_id = e.id AND ee.catalogo_id = c.id
);

INSERT INTO especialista_especialidad (especialista_id, catalogo_id)
SELECT e.id, c.id
FROM especialista e
JOIN staff s ON s.id = e.staff_id
JOIN catalogo c ON c.codigo = 'FISIOTERAPIA'
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id AND t.codigo = 'ESPECIALIDAD'
WHERE s.email IN ('m.suazo@ejemplo.org', 'm.cruz@ejemplo.org')
AND NOT EXISTS (
    SELECT 1 FROM especialista_especialidad ee
    WHERE ee.especialista_id = e.id AND ee.catalogo_id = c.id
);

INSERT INTO especialista_especialidad (especialista_id, catalogo_id)
SELECT e.id, c.id
FROM especialista e
JOIN staff s ON s.id = e.staff_id
JOIN catalogo c ON c.codigo = 'TERAPIA_LENGUAJE'
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id AND t.codigo = 'ESPECIALIDAD'
WHERE s.email IN ('e.lopez@ejemplo.org', 'd.navarro@ejemplo.org')
AND NOT EXISTS (
    SELECT 1 FROM especialista_especialidad ee
    WHERE ee.especialista_id = e.id AND ee.catalogo_id = c.id
);

-- ====== PACIENTES ======
INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Juan', 'Pérez', 'EXP-TEST-001', DATE '2015-03-10', '88882001', 'Paciente de prueba', 'Acompañamiento familiar',
    'Barrio Centro, Managua', 'MASCULINO', 'María Pérez (madre)', 'Seguimiento neurodesarrollo', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-001');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Rosa', 'Díaz', 'EXP-TEST-002', DATE '2010-11-22', '88882002', 'Paciente de control', 'Apoyo psicopedagógico',
    'Ciudad Sandino, Managua', 'FEMENINO', 'José Díaz (padre)', 'Reforzamiento de lenguaje', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-002');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Mateo', 'Ruiz', 'EXP-TEST-003', DATE '2013-07-18', '88882003', 'Control trimestral', 'Terapia ocupacional',
    'Tipitapa, Managua', 'MASCULINO', 'Laura Ruiz (madre)', 'Seguimiento de motricidad fina', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-003');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Camila', 'Torres', 'EXP-TEST-004', DATE '2016-01-05', '88882004', 'Ingreso nuevo', 'Estimulación temprana',
    'Masaya', 'FEMENINO', 'Daniel Torres (padre)', 'Evaluación inicial de lenguaje', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-004');

INSERT INTO paciente (
    nombres, apellidos, numero_expediente, fecha_nacimiento, telefono, notas, capacidades_info,
    direccion, sexo, responsable_tutor, diagnostico_referencia, activo
)
SELECT
    'Sebastián', 'Mendoza', 'EXP-TEST-005', DATE '2011-09-27', '88882005', 'Cita de seguimiento', 'Apoyo conductual',
    'León', 'MASCULINO', 'Gloria Mendoza (tutora)', 'Plan de intervención psicopedagógica', TRUE
WHERE NOT EXISTS (SELECT 1 FROM paciente WHERE numero_expediente = 'EXP-TEST-005');
