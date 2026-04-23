-- PostgreSQL 10 - datos/semillas HIS-PIPITOS
-- Ejecutar con:
-- psql -h localhost -p 5433 -U admin -d hispipitos -f database/postgresql/02_datos_postgresql10.sql

\set ON_ERROR_STOP on

-- Migraciones de datos y semillas
\i ../../src/main/resources/db/migration/V2__seed_catalog.sql
\i ../../src/main/resources/db/migration/V3__iam_master_role.sql
\i ../../src/main/resources/db/migration/V6__iam_pantalla_rol_seed.sql
\i ../../src/main/resources/db/migration/V9__seed_demo_users_roles.sql
\i ../../src/main/resources/db/migration/V12__seed_demo_patients_and_specialists.sql
\i ../../src/main/resources/db/migration/V14__recursos_screen_and_catalog_seed.sql
\i ../../src/main/resources/db/migration/V15__recursos_bulk_demo_data.sql
\i ../../src/main/resources/db/migration/V16__seed_more_tipo_cita.sql
\i ../../src/main/resources/db/migration/V17__seed_more_patients_and_appointments_jan_jun.sql
