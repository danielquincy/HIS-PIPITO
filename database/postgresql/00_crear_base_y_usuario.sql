-- PostgreSQL 10 - creacion inicial de usuario y base
-- Ejecutar conectado como superusuario (por ejemplo postgres).

DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin LOGIN PASSWORD 'admin';
    ELSE
        ALTER ROLE admin WITH LOGIN PASSWORD 'admin';
    END IF;
END
$$;

SELECT 'CREATE DATABASE hispipitos OWNER admin'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'hispipitos')
\gexec

GRANT ALL PRIVILEGES ON DATABASE hispipitos TO admin;
