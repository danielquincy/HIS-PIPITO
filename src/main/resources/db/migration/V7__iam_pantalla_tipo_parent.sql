ALTER TABLE iam_pantalla ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'PANTALLA';
ALTER TABLE iam_pantalla ADD COLUMN parent_id BIGINT REFERENCES iam_pantalla (id);
CREATE INDEX idx_iam_pantalla_parent ON iam_pantalla (parent_id);
