-- HIS-PIPITOS — datos de demostración (usuarios, personal, pacientes, citas, finanzas), sintaxis H2
-- Contraseña de todos los usuarios de prueba: password
-- Hash BCrypt (cost 10) para la cadena "password" (Spring Security compatible)
-- Ejecutar después de 01 + 02, o en una BD ya poblada por Flyway.

BEGIN;

-- Usuarios de aplicación de prueba
INSERT INTO app_user (username, email, password_hash, enabled)
SELECT 'coord_demo', 'coord@ejemplo.org', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE
WHERE NOT EXISTS (SELECT 1 FROM app_user WHERE username = 'coord_demo');

INSERT INTO app_user (username, email, password_hash, enabled)
SELECT 'medico_demo', 'medico@ejemplo.org', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE
WHERE NOT EXISTS (SELECT 1 FROM app_user WHERE username = 'medico_demo');

INSERT INTO app_user (username, email, password_hash, enabled)
SELECT 'consulta_demo', 'consulta@ejemplo.org', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', TRUE
WHERE NOT EXISTS (SELECT 1 FROM app_user WHERE username = 'consulta_demo');

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM app_user u
JOIN app_role r ON r.name = 'ROLE_COORDINADOR'
WHERE u.username = 'coord_demo'
  AND NOT EXISTS (SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM app_user u
JOIN app_role r ON r.name = 'ROLE_MEDICO'
WHERE u.username = 'medico_demo'
  AND NOT EXISTS (SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM app_user u
JOIN app_role r ON r.name = 'ROLE_CONSULTA'
WHERE u.username = 'consulta_demo'
  AND NOT EXISTS (SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

-- Personal y especialistas
INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Ana', 'García', 'a.garcia@ejemplo.org', '2222-1001', TRUE
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'a.garcia@ejemplo.org');

INSERT INTO staff (nombres, apellidos, email, telefono, activo)
SELECT 'Carlos', 'Mora', 'c.mora@ejemplo.org', '2222-1002', TRUE
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
WHERE s.email = 'a.garcia@ejemplo.org'
  AND NOT EXISTS (SELECT 1 FROM especialista e WHERE e.staff_id = s.id);

INSERT INTO especialista (staff_id, activo)
SELECT s.id, TRUE
FROM staff s
WHERE s.email = 'c.mora@ejemplo.org'
  AND NOT EXISTS (SELECT 1 FROM especialista e WHERE e.staff_id = s.id);

INSERT INTO especialista (staff_id, activo)
SELECT s.id, TRUE
FROM staff s
WHERE s.email IN (
    'l.rios@ejemplo.org', 'm.suazo@ejemplo.org', 'e.lopez@ejemplo.org', 'j.pineda@ejemplo.org',
    'm.cruz@ejemplo.org', 'd.navarro@ejemplo.org', 'p.martinez@ejemplo.org', 'r.ortiz@ejemplo.org'
)
  AND NOT EXISTS (SELECT 1 FROM especialista e WHERE e.staff_id = s.id);

-- Ana: Pediatría y Neurología; Carlos: Neurología
INSERT INTO especialista_especialidad (especialista_id, catalogo_id)
SELECT e.id, c.id
FROM especialista e
JOIN staff s ON s.id = e.staff_id
JOIN catalogo c ON c.codigo IN ('PEDIATRIA', 'NEUROPEDIATRIA')
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id AND t.codigo = 'ESPECIALIDAD'
WHERE s.email = 'a.garcia@ejemplo.org'
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
WHERE s.email = 'c.mora@ejemplo.org'
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

INSERT INTO especialista_especialidad (especialista_id, catalogo_id)
SELECT e.id, c.id
FROM especialista e
JOIN staff s ON s.id = e.staff_id
JOIN catalogo c ON c.codigo = 'PEDIATRIA'
JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id AND t.codigo = 'ESPECIALIDAD'
WHERE s.email = 'p.martinez@ejemplo.org'
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
WHERE s.email = 'r.ortiz@ejemplo.org'
  AND NOT EXISTS (
      SELECT 1 FROM especialista_especialidad ee
      WHERE ee.especialista_id = e.id AND ee.catalogo_id = c.id
  );

-- Pacientes
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

-- Citas (45 min): dos el mismo día para el mismo paciente (válido)
INSERT INTO cita (paciente_id, especialista_id, inicio_ts, fin_ts, duracion_minutos, estado, notas)
SELECT p.id, sub.esp_id,
       CAST('2026-04-15 14:00:00+00:00' AS TIMESTAMP WITH TIME ZONE),
       CAST('2026-04-15 14:45:00+00:00' AS TIMESTAMP WITH TIME ZONE),
       45, 'PROGRAMADA', 'Primera valoración'
FROM paciente p
CROSS JOIN (
    SELECT e.id AS esp_id
    FROM especialista e
    JOIN staff s ON s.id = e.staff_id
    WHERE s.email = 'a.garcia@ejemplo.org'
    LIMIT 1
) sub
WHERE p.numero_expediente = 'EXP-TEST-001'
  AND NOT EXISTS (
      SELECT 1 FROM cita c2
      WHERE c2.paciente_id = p.id
        AND c2.inicio_ts = CAST('2026-04-15 14:00:00+00:00' AS TIMESTAMP WITH TIME ZONE)
  );

INSERT INTO cita (paciente_id, especialista_id, inicio_ts, fin_ts, duracion_minutos, estado, notas)
SELECT p.id, sub.esp_id,
       CAST('2026-04-15 16:00:00+00:00' AS TIMESTAMP WITH TIME ZONE),
       CAST('2026-04-15 16:45:00+00:00' AS TIMESTAMP WITH TIME ZONE),
       45, 'PROGRAMADA', 'Segunda cita mismo día'
FROM paciente p
CROSS JOIN (
    SELECT e.id AS esp_id
    FROM especialista e
    JOIN staff s ON s.id = e.staff_id
    WHERE s.email = 'a.garcia@ejemplo.org'
    LIMIT 1
) sub
WHERE p.numero_expediente = 'EXP-TEST-001'
  AND NOT EXISTS (
      SELECT 1 FROM cita c2
      WHERE c2.paciente_id = p.id
        AND c2.inicio_ts = CAST('2026-04-15 16:00:00+00:00' AS TIMESTAMP WITH TIME ZONE)
  );

INSERT INTO cita (paciente_id, especialista_id, inicio_ts, fin_ts, duracion_minutos, estado, notas)
SELECT p.id, sub.esp_id,
       CAST('2026-04-16 10:00:00+00:00' AS TIMESTAMP WITH TIME ZONE),
       CAST('2026-04-16 10:45:00+00:00' AS TIMESTAMP WITH TIME ZONE),
       45, 'COMPLETADA', 'Cita completada — demo'
FROM paciente p
CROSS JOIN (
    SELECT e.id AS esp_id
    FROM especialista e
    JOIN staff s ON s.id = e.staff_id
    WHERE s.email = 'c.mora@ejemplo.org'
    LIMIT 1
) sub
WHERE p.numero_expediente = 'EXP-TEST-002'
  AND NOT EXISTS (
      SELECT 1 FROM cita c2
      WHERE c2.paciente_id = p.id
        AND c2.inicio_ts = CAST('2026-04-16 10:00:00+00:00' AS TIMESTAMP WITH TIME ZONE)
  );

INSERT INTO cita_financiero (cita_id, monto_ingreso, monto_costo, moneda, notas)
SELECT c.id, 1500.00, 400.00, 'NIO', 'Demo ingreso/costo'
FROM cita c
JOIN paciente p ON p.id = c.paciente_id
WHERE p.numero_expediente = 'EXP-TEST-001'
  AND c.inicio_ts = CAST('2026-04-15 14:00:00+00:00' AS TIMESTAMP WITH TIME ZONE)
  AND NOT EXISTS (SELECT 1 FROM cita_financiero f WHERE f.cita_id = c.id);

INSERT INTO cita_financiero (cita_id, monto_ingreso, monto_costo, moneda, notas)
SELECT c.id, 1200.00, 350.00, 'NIO', NULL
FROM cita c
JOIN paciente p ON p.id = c.paciente_id
WHERE p.numero_expediente = 'EXP-TEST-002'
  AND c.inicio_ts = CAST('2026-04-16 10:00:00+00:00' AS TIMESTAMP WITH TIME ZONE)
  AND NOT EXISTS (SELECT 1 FROM cita_financiero f WHERE f.cita_id = c.id);

INSERT INTO documento_paciente (
    paciente_id, tipo_catalogo_id, tipo_documento_catalogo_id,
    nombre_archivo, mime_type, ruta_storage, tamano_bytes, usuario_subida_id
)
SELECT
    p.id,
    (SELECT t.id FROM tipo_catalogo t WHERE t.codigo = 'DOCUMENTO_TIPO' LIMIT 1),
    (SELECT c.id FROM catalogo c
     JOIN tipo_catalogo t ON t.id = c.tipo_catalogo_id
     WHERE t.codigo = 'DOCUMENTO_TIPO' AND c.codigo = 'HISTORIA_CLINICA' LIMIT 1),
    'historia_demo.pdf',
    'application/pdf',
    '/data/uploads/demo/historia_demo.pdf',
    1024,
    (SELECT u.id FROM app_user u WHERE u.username = 'medico_demo' LIMIT 1)
FROM paciente p
WHERE p.numero_expediente = 'EXP-TEST-001'
  AND NOT EXISTS (
      SELECT 1 FROM documento_paciente d WHERE d.paciente_id = p.id AND d.nombre_archivo = 'historia_demo.pdf'
  );

COMMIT;
