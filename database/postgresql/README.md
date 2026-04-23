# PostgreSQL 10 - HIS-PIPITOS

## Conexion solicitada

- Servidor: `localhost`
- Puerto: `5433`
- Usuario: `admin`
- Password: `admin`
- Base de datos: `hispipitos`

Cadena JDBC:

`jdbc:postgresql://localhost:5433/hispipitos`

## Ejecucion de scripts

1. Crear usuario/base (ejecutar como superusuario):

```bash
psql -h localhost -p 5433 -U postgres -f database/postgresql/00_crear_base_y_usuario.sql
```

2. Crear estructura:

```bash
psql -h localhost -p 5433 -U admin -d hispipitos -f database/postgresql/01_estructura_postgresql10.sql
```

3. Insertar datos:

```bash
psql -h localhost -p 5433 -U admin -d hispipitos -f database/postgresql/02_datos_postgresql10.sql
```

## Aplicación Spring Boot y Flyway

Desde **Flyway 10**, el soporte de PostgreSQL no va solo en `flyway-core`: hay que incluir **`org.flywaydb:flyway-database-postgresql`**. Si falta, el arranque puede fallar con:

`Unsupported Database: PostgreSQL 10.23` (u otra versión).

Esa dependencia ya está añadida en el `pom.xml` del proyecto. Tras un `mvn clean compile` o una recarga de Maven en el IDE, vuelve a levantar la app.

### Esquema creado con scripts `psql` y error de historial Flyway

Si la base ya tiene tablas (por `01_estructura` + `02_datos`) pero no existe `flyway_schema_history`, al arrancar la app Flyway puede fallar pidiendo **baseline**. En `application.yml` está configurado `spring.flyway.baseline-on-migrate: true` y `baseline-version: 18` (inmediatamente **después** de la última migración, V17) para alinear el historial **sin** volver a ejecutar V1..V17.
