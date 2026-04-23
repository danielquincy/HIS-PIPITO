-- Seed temporal de usuarios IAM para pruebas funcionales.
-- Password común: Temp1234! (prefix {noop} para entorno de desarrollo)

INSERT INTO app_user (
    username,
    email,
    password_hash,
    enabled,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    failed_login_attempts,
    locked_at,
    password_must_change,
    temporal_password
)
SELECT
    v.username,
    v.email,
    '{noop}Temp1234!',
    TRUE,
    v.primer_nombre,
    v.segundo_nombre,
    v.primer_apellido,
    v.segundo_apellido,
    0,
    NULL,
    FALSE,
    FALSE
FROM (
    VALUES
        ('medico.ana', 'ana.medico@his.local', 'Ana', 'Lucia', 'Vega', 'Torres'),
        ('medico.luis', 'luis.medico@his.local', 'Luis', 'Alberto', 'Mena', 'Ruiz'),
        ('medico.clara', 'clara.medico@his.local', 'Clara', 'Isabel', 'Soto', 'Perez'),
        ('consulta.sofia', 'sofia.consulta@his.local', 'Sofia', 'Elena', 'Rivas', 'Lopez'),
        ('consulta.diego', 'diego.consulta@his.local', 'Diego', 'Andres', 'Navas', 'Diaz'),
        ('consulta.paola', 'paola.consulta@his.local', 'Paola', 'Maria', 'Rojas', 'Silva'),
        ('coord.mario', 'mario.coord@his.local', 'Mario', 'Jose', 'Cruz', 'Morales'),
        ('coord.elena', 'elena.coord@his.local', 'Elena', 'Patricia', 'Irias', 'Gomez'),
        ('coord.raul', 'raul.coord@his.local', 'Raul', 'Antonio', 'Mejia', 'Flores'),
        ('admin.carla', 'carla.admin@his.local', 'Carla', 'Noemi', 'Pineda', 'Castro'),
        ('admin.jorge', 'jorge.admin@his.local', 'Jorge', 'Rene', 'Blandon', 'Hernandez'),
        ('iam.sandra', 'sandra.iam@his.local', 'Sandra', 'Milena', 'Aguilar', 'Suazo'),
        ('iam.fernando', 'fernando.iam@his.local', 'Fernando', 'Isaac', 'Campos', 'Lara'),
        ('enfermeria.luz', 'luz.enfermeria@his.local', 'Luz', 'Damaris', 'Ortez', 'Reyes'),
        ('enfermeria.erick', 'erick.enfermeria@his.local', 'Erick', 'Daniel', 'Carcache', 'Nuñez'),
        ('trabajo.marta', 'marta.social@his.local', 'Marta', 'Yadira', 'Paz', 'Ochoa'),
        ('psicologia.kevin', 'kevin.psico@his.local', 'Kevin', 'Ramon', 'Zelaya', 'Umanzor'),
        ('terapia.laura', 'laura.terapia@his.local', 'Laura', 'Beatriz', 'Valle', 'Ponce'),
        ('nutricion.rosa', 'rosa.nutri@his.local', 'Rosa', 'Amelia', 'Molina', 'Pacheco'),
        ('archivo.noe', 'noe.archivo@his.local', 'Noe', 'Adonay', 'Bautista', 'Mairena')
) AS v(username, email, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
WHERE NOT EXISTS (SELECT 1 FROM app_user u WHERE u.username = v.username);

-- Asignación de roles por vocación
INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM app_user u
JOIN app_role r ON r.name = 'ROLE_MEDICO'
WHERE u.username IN ('medico.ana', 'medico.luis', 'medico.clara')
  AND NOT EXISTS (SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM app_user u
JOIN app_role r ON r.name = 'ROLE_CONSULTA'
WHERE u.username IN ('consulta.sofia', 'consulta.diego', 'consulta.paola', 'enfermeria.luz', 'enfermeria.erick', 'trabajo.marta', 'psicologia.kevin', 'terapia.laura', 'nutricion.rosa', 'archivo.noe')
  AND NOT EXISTS (SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM app_user u
JOIN app_role r ON r.name = 'ROLE_COORDINADOR'
WHERE u.username IN ('coord.mario', 'coord.elena', 'coord.raul')
  AND NOT EXISTS (SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM app_user u
JOIN app_role r ON r.name = 'ROLE_ADMIN'
WHERE u.username IN ('admin.carla', 'admin.jorge')
  AND NOT EXISTS (SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM app_user u
JOIN app_role r ON r.name = 'ROLE_IAM_MASTER'
WHERE u.username IN ('iam.sandra', 'iam.fernando', 'admin.carla')
  AND NOT EXISTS (SELECT 1 FROM user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

-- Algunos usuarios bloqueados (>3 intentos) para poblar la pantalla "Bloqueados"
UPDATE app_user
SET failed_login_attempts = 4,
    locked_at = COALESCE(locked_at, CURRENT_TIMESTAMP)
WHERE username IN ('consulta.sofia', 'coord.elena', 'enfermeria.erick', 'trabajo.marta', 'archivo.noe', 'medico.luis');
