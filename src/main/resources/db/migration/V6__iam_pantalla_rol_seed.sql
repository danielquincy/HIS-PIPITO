-- Enlaza pantallas con roles: un usuario solo ve las pantallas asociadas a sus roles (unión).
-- Ajuste posteriormente desde IAM → Roles por pantalla.

-- ROLE_ADMIN: todas las pantallas
INSERT INTO iam_pantalla_rol (pantalla_id, role_id)
SELECT p.id, r.id
FROM iam_pantalla p
CROSS JOIN app_role r
WHERE r.name = 'ROLE_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM iam_pantalla_rol x WHERE x.pantalla_id = p.id AND x.role_id = r.id
  );

-- ROLE_COORDINADOR: módulo clínico e informes (sin IAM)
INSERT INTO iam_pantalla_rol (pantalla_id, role_id)
SELECT p.id, r.id
FROM iam_pantalla p
CROSS JOIN app_role r
WHERE r.name = 'ROLE_COORDINADOR'
  AND p.codigo <> 'IAM'
  AND NOT EXISTS (
    SELECT 1 FROM iam_pantalla_rol x WHERE x.pantalla_id = p.id AND x.role_id = r.id
  );

-- ROLE_MEDICO: agenda y expediente clínico
INSERT INTO iam_pantalla_rol (pantalla_id, role_id)
SELECT p.id, r.id
FROM iam_pantalla p
CROSS JOIN app_role r
WHERE r.name = 'ROLE_MEDICO'
  AND p.codigo IN ('INICIO', 'AGENDA', 'CITAS', 'PACIENTES', 'ESPECIALIDADES')
  AND NOT EXISTS (
    SELECT 1 FROM iam_pantalla_rol x WHERE x.pantalla_id = p.id AND x.role_id = r.id
  );

-- ROLE_CONSULTA: consulta básica
INSERT INTO iam_pantalla_rol (pantalla_id, role_id)
SELECT p.id, r.id
FROM iam_pantalla p
CROSS JOIN app_role r
WHERE r.name = 'ROLE_CONSULTA'
  AND p.codigo IN ('INICIO', 'CITAS', 'PACIENTES')
  AND NOT EXISTS (
    SELECT 1 FROM iam_pantalla_rol x WHERE x.pantalla_id = p.id AND x.role_id = r.id
  );

-- ROLE_IAM_MASTER: entrada al HIS y consola IAM
INSERT INTO iam_pantalla_rol (pantalla_id, role_id)
SELECT p.id, r.id
FROM iam_pantalla p
CROSS JOIN app_role r
WHERE r.name = 'ROLE_IAM_MASTER'
  AND p.codigo IN ('INICIO', 'IAM')
  AND NOT EXISTS (
    SELECT 1 FROM iam_pantalla_rol x WHERE x.pantalla_id = p.id AND x.role_id = r.id
  );

