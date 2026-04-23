HIS-PIPITOS — scripts SQL de referencia (H2)
==========================================

La aplicación usa H2 en memoria por defecto y Flyway aplica el esquema desde
src/main/resources/db/migration (no hace falta ejecutar estos archivos para arrancar).

Orden si desea reproducir manualmente sobre una BD H2 vacía (p. ej. consola H2 o archivo):
  1) estructura/01_schema.sql
  2) semillas/02_catalogo_y_roles.sql
  3) pruebas/03_datos_prueba.sql

Si ya usa la aplicación con Flyway:
  - No ejecute 01 ni 02 (el esquema y el catálogo ya existen).
  - Puede ejecutar solo: pruebas/03_datos_prueba.sql

Conexión por defecto en application.yml (memoria, sin persistencia entre reinicios):
  jdbc:h2:mem:hispipitos;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
  usuario: sa, contraseña vacía.

Usuarios de prueba (contraseña en todos: password):
  coord_demo   → ROLE_COORDINADOR
  medico_demo  → ROLE_MEDICO
  consulta_demo → ROLE_CONSULTA

El usuario admin se crea por la aplicación al arrancar (no está en estos scripts).
