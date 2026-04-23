ALTER TABLE app_role ADD COLUMN codigo VARCHAR(80);
ALTER TABLE app_role ADD COLUMN nombre VARCHAR(255);
ALTER TABLE app_role ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE app_role SET codigo = UPPER(REPLACE(name, 'ROLE_', '')), nombre = name WHERE codigo IS NULL;

UPDATE app_role SET nombre = 'Administrador de sistema' WHERE name = 'ROLE_ADMIN';
UPDATE app_role SET nombre = 'Coordinador clínico' WHERE name = 'ROLE_COORDINADOR';
UPDATE app_role SET nombre = 'Médico' WHERE name = 'ROLE_MEDICO';
UPDATE app_role SET nombre = 'Consulta' WHERE name = 'ROLE_CONSULTA';
UPDATE app_role SET nombre = 'Maestro IAM' WHERE name = 'ROLE_IAM_MASTER';

ALTER TABLE app_role ALTER COLUMN codigo SET NOT NULL;

CREATE UNIQUE INDEX uk_app_role_codigo ON app_role (codigo);
