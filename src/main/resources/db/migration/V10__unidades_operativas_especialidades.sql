ALTER TABLE tipo_catalogo
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE tipo_catalogo
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE catalogo
    ADD COLUMN IF NOT EXISTS parent_catalogo_id BIGINT REFERENCES catalogo (id);

ALTER TABLE catalogo
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE catalogo
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE especialista_especialidad
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

INSERT INTO tipo_catalogo (codigo, nombre, descripcion, activo)
SELECT 'UNIDAD_OPERATIVA', 'Unidad operativa', 'Unidades organizativas para clasificar servicios técnicos', TRUE
WHERE NOT EXISTS (SELECT 1 FROM tipo_catalogo WHERE codigo = 'UNIDAD_OPERATIVA');

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'UNIDAD_ATENCION_MEDICA', 'Unidad de Atención Médica', 1, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'UNIDAD_OPERATIVA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c
    WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'UNIDAD_ATENCION_MEDICA'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'UNIDAD_REHABILITACION', 'Unidad de Rehabilitación', 2, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'UNIDAD_OPERATIVA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c
    WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'UNIDAD_REHABILITACION'
  );

INSERT INTO catalogo (tipo_catalogo_id, codigo, nombre, orden, activo)
SELECT t.id, 'UNIDAD_FORMACION', 'Unidad de Formación', 3, TRUE
FROM tipo_catalogo t
WHERE t.codigo = 'UNIDAD_OPERATIVA'
  AND NOT EXISTS (
    SELECT 1 FROM catalogo c
    WHERE c.tipo_catalogo_id = t.id AND c.codigo = 'UNIDAD_FORMACION'
  );

-- Semilla oficial de especialidades por unidad operativa.
INSERT INTO catalogo (tipo_catalogo_id, parent_catalogo_id, codigo, nombre, orden, activo)
SELECT te.id, u.id, x.codigo, x.nombre, x.orden, TRUE
FROM tipo_catalogo te
JOIN tipo_catalogo tu ON tu.codigo = 'UNIDAD_OPERATIVA'
JOIN catalogo u ON u.tipo_catalogo_id = tu.id
JOIN (
  VALUES
    ('UNIDAD_ATENCION_MEDICA', 'NEUROPEDIATRIA', 'Neuropediatría', 1),
    ('UNIDAD_ATENCION_MEDICA', 'FISIATRIA', 'Fisiatría', 2),
    ('UNIDAD_ATENCION_MEDICA', 'PEDIATRIA', 'Pediatría', 3),
    ('UNIDAD_REHABILITACION', 'FISIOTERAPIA', 'Fisioterapia', 1),
    ('UNIDAD_REHABILITACION', 'TERAPIA_LENGUAJE', 'Terapia del Lenguaje', 2),
    ('UNIDAD_REHABILITACION', 'PSICOLOGIA', 'Psicología', 3),
    ('UNIDAD_REHABILITACION', 'PSICOPEDAGOGIA', 'Psicopedagogía', 4),
    ('UNIDAD_REHABILITACION', 'ESTIMULACION_TEMPRANA', 'Estimulación Temprana', 5),
    ('UNIDAD_FORMACION', 'CONSEJERIA_FAMILIAR', 'Consejería Familiar', 1),
    ('UNIDAD_FORMACION', 'CAPACITACION_PADRES', 'Capacitación a Padres', 2)
) AS x(unidad_codigo, codigo, nombre, orden) ON x.unidad_codigo = u.codigo
WHERE te.codigo = 'ESPECIALIDAD'
  AND NOT EXISTS (
    SELECT 1
    FROM catalogo c
    WHERE c.tipo_catalogo_id = te.id
      AND c.codigo = x.codigo
  );

-- Ajusta registros previos para que queden bajo su unidad operativa.
UPDATE catalogo c
SET parent_catalogo_id = (
    SELECT u.id
    FROM catalogo u
    JOIN tipo_catalogo tu ON tu.id = u.tipo_catalogo_id
    WHERE tu.codigo = 'UNIDAD_OPERATIVA' AND u.codigo = 'UNIDAD_ATENCION_MEDICA'
)
WHERE c.codigo IN ('PEDIATRIA', 'FISIATRIA', 'NEUROPEDIATRIA')
  AND c.tipo_catalogo_id = (SELECT id FROM tipo_catalogo WHERE codigo = 'ESPECIALIDAD')
  AND c.parent_catalogo_id IS NULL;

UPDATE catalogo c
SET parent_catalogo_id = (
    SELECT u.id
    FROM catalogo u
    JOIN tipo_catalogo tu ON tu.id = u.tipo_catalogo_id
    WHERE tu.codigo = 'UNIDAD_OPERATIVA' AND u.codigo = 'UNIDAD_REHABILITACION'
)
WHERE c.codigo IN ('FISIOTERAPIA', 'TERAPIA_LENGUAJE', 'PSICOLOGIA', 'PSICOPEDAGOGIA', 'ESTIMULACION_TEMPRANA')
  AND c.tipo_catalogo_id = (SELECT id FROM tipo_catalogo WHERE codigo = 'ESPECIALIDAD')
  AND c.parent_catalogo_id IS NULL;

UPDATE catalogo c
SET parent_catalogo_id = (
    SELECT u.id
    FROM catalogo u
    JOIN tipo_catalogo tu ON tu.id = u.tipo_catalogo_id
    WHERE tu.codigo = 'UNIDAD_OPERATIVA' AND u.codigo = 'UNIDAD_FORMACION'
)
WHERE c.codigo IN ('CONSEJERIA_FAMILIAR', 'CAPACITACION_PADRES')
  AND c.tipo_catalogo_id = (SELECT id FROM tipo_catalogo WHERE codigo = 'ESPECIALIDAD')
  AND c.parent_catalogo_id IS NULL;

-- Migra catálogo legado NEUROLOGIA al estándar NEUROPEDIATRIA.
UPDATE catalogo
SET codigo = 'NEUROPEDIATRIA',
    nombre = 'Neuropediatría'
WHERE codigo = 'NEUROLOGIA'
  AND tipo_catalogo_id = (SELECT id FROM tipo_catalogo WHERE codigo = 'ESPECIALIDAD')
  AND NOT EXISTS (
    SELECT 1 FROM catalogo x
    WHERE x.tipo_catalogo_id = catalogo.tipo_catalogo_id
      AND x.codigo = 'NEUROPEDIATRIA'
  );

