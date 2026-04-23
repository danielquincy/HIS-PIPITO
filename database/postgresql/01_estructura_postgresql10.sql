-- PostgreSQL 10 - estructura completa HIS-PIPITOS
-- Ejecutar con:
-- psql -h localhost -p 5433 -U admin -d hispipitos -f database/postgresql/01_estructura_postgresql10.sql

\set ON_ERROR_STOP on

-- Migraciones estructurales (DDL)
\i ../../src/main/resources/db/migration/V1__schema.sql
\i ../../src/main/resources/db/migration/V4__iam_pantallas_y_bloqueo.sql
\i ../../src/main/resources/db/migration/V5__user_nombres_iam.sql
\i ../../src/main/resources/db/migration/V7__iam_pantalla_tipo_parent.sql
\i ../../src/main/resources/db/migration/V8__app_role_codigo_nombre_activo.sql
\i ../../src/main/resources/db/migration/V10__unidades_operativas_especialidades.sql
\i ../../src/main/resources/db/migration/V11__paciente_campos_robustos.sql
\i ../../src/main/resources/db/migration/V13__clinical_scheduling_module.sql
