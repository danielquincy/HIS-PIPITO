ALTER TABLE paciente
    ADD COLUMN direccion TEXT;

ALTER TABLE paciente
    ADD COLUMN sexo VARCHAR(20);

ALTER TABLE paciente
    ADD COLUMN responsable_tutor TEXT;

ALTER TABLE paciente
    ADD COLUMN diagnostico_referencia TEXT;
