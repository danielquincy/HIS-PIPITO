# HIS-PIPITOS

CRM e historial clínico (HIS) para **Los Pipitos**: citas, agenda, pacientes, recursos, catálogos, finanzas por cita, reportes y gobierno de accesos (IAM) integrado en la misma aplicación.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Lenguaje | **Java 17** |
| Framework | **Spring Boot 3.5.x** |
| API web | **Spring Web**, **Bean Validation** |
| Persistencia | **Spring Data JPA** (**Hibernate**) |
| Base de datos | **PostgreSQL** (driver oficial + **Flyway** para migraciones `V*.sql`) |
| Seguridad | **Spring Security**, **OAuth2 Authorization Server** + **Resource Server**, acceso a API con **JWT** (Bearer) |
| Documentos y reportes | **OpenPDF** (PDF), **Apache POI** (Excel `.xlsx`) |
| Construcción | **Apache Maven** |
| Contenedores | **Docker** / **Docker Compose** (ver `docker-compose.yml`, `Dockerfile`) |
| Interfaz web (SPA «ligera») | HTML estático en `src/main/resources/static/`, **JavaScript** vanilla (`app/js/his-app.js`, `app/js/layout.js`), estilos en `static/css/` (p. ej. `shell.css`, `tailwind-app.css` identidad visual) |
| Gráficos (panel) | **Chart.js** 4 (cargado por CDN en el panel de inicio) |
| Iconos UI | **Font Awesome** 6 (referencias en plantillas) |

> La configuración de conexión por defecto está en `src/main/resources/application.yml` (URL/usuario de PostgreSQL sobrescribible con `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`).

---

## Imágenes del repositorio (`images/`)

Recursos en la ruta `images\` (referencia: `C:\Desarrollo\HIS-PIPITO\images`). Útil para documentación, mockups o material de apoyo. Para enlazar desde Markdown en la raíz del repo:


| # | Ruta en el repositorio |
|---|------------------------|
| 1 | ![Imagen](images/1.jpg) |
| 2 | ![Imagen](images/2.jpg) |
| 3 | ![Imagen](images/3.jpg) |
| 4 | ![Imagen](images/4.jpg) |
| 5 | ![Imagen](images/5.jpg) |
| 6 | ![Imagen](images/6.jpg) |
| 7 | ![Imagen](images/7.jpg) |
| 8 | ![Imagen](images/8.jpg) |
| 9 | ![Imagen](images/9.jpg) |
| 10 |![Imagen](images/10.jpg) |
| 11 |![Imagen](images/11.jpg) |
| 12 |![Imagen](images/12.jpg) |
| 13 |![Imagen](images/13.jpg) |
| 14 |![Imagen](images/14.jpg) |
| 15 |![Imagen](images/15.jpg) |
| 16 |![Imagen](images/16.jpg) |
| 17 |![Imagen](images/17.jpg) |
| 18 |![Imagen](images/18.jpg) |
| 19 |![Imagen](images/19.jpg) |
| 20 |![Imagen](images/20.jpg) |
| 21 |![Imagen](images/21.jpg) |
| 22 |![Imagen](images/22.jpg) |
| 23 |![Imagen](images/23.jpg) |
| 24 |![Imagen](images/24.jpg) |
| 25 |![Imagen](images/25.jpg) |
| 26 |![Imagen](images/26.jpg) |

Vista previa (ejemplo): `![Captura 1](images/1.jpg)` (según el visor de Markdown que use el equipo).

---

## Instrucciones de uso del sistema (resumen operativo)

### 1. Acceso e inicio de sesión

1. Arranque la aplicación (véase *Arranque* abajo) y abra en el navegador **`/login.html`** o la raíz `http://localhost:8080/` (según despliegue, puerto **8080** por defecto).
2. Inicie sesión con su usuario. Las credenciales iniciales de administración se definen en configuración (p. ej. `HIS_ADMIN_USER` y `HIS_ADMIN_PASSWORD` en `application.yml` o variables de entorno); **cámbielas en producción**.

### 2. Tras el login

- Los usuarios con rol de **maestro IAM** (p. ej. `ROLE_ADMIN` / `ROLE_IAM_MASTER`, según `his.iam-master-roles` en `application.yml`) suelen ser redirigidos a **`/launcher.html`** para elegir entre el **HIS-PIPITOS** y el subsistema **IAM**.
- El resto de usuarios entra directo al **panel del HIS** (`/app/pages/inicio.html`).

### 3. Navegación principal (HIS)

| Área | Descripción breve |
|------|-------------------|
| **Inicio** | Resumen y KPIs de actividad de citas (según su ámbito) e indicadores financieros para roles con acceso a reportes. Enlaces rápidos a otras secciones. |
| **Gráficos** | Indicadores agregados (p. ej. ventana de días vía reportes). |
| **Agenda** | Vistas de calendario: día, semana, mes y listado *Agenda*; carga de citas por rango de fechas. |
| **Citas** | Listado, creación y edición de citas; estados, portal de paciente, vínculos a recursos, etc. |
| **Pacientes** | Ficha, búsqueda, documentos. |
| **Especialidades / Especialistas** | Catálogo y personal clínico. |
| **Recursos** | Salas y recursos clínicos, disponibilidad. |
| **Reportes** | Resumen y exportación PDF/Excel (según permisos). |

El menú lateral y el alcance de **agenda y citas** respetan los **roles y la asignación de especialistas** (usuarios restringidos solo ven su ámbito).

### 4. API REST (integraciones y pruebas)

Prefijo: **`/api`**. Incluya **`Authorization: Bearer <token>`** (obtener token con el flujo documentado, p. ej. `POST /api/auth/login` o el que tenga su despliegue).

Consulte referencia rápida al final de este documento. Endpoints concretos pueden añadirse o variar; revise controladores bajo `src/main/java/org/lospipitos/his/`.

### 5. Almacenamiento de ficheros

En Docker, los documentos de paciente pueden mapearse a un volumen (p. ej. `his_uploads` en `/data/uploads` dentro del contenedor). Ajuste `HIS_STORAGE_PATH` según entorno.

---

## Requisitos

- **Java 17** y **Apache Maven 3.8+** (desarrollo local o CI).
- **PostgreSQL** alcanzable con esquema/migraciones Flyway aplicables (permisos de `CREATE/ALTER` en la base indicada en `SPRING_DATASOURCE_*`).
- Opcional: **Docker** y **Docker Compose** para construir y ejecutar la imagen de la aplicación.

---

## Arranque

### Con Docker Compose

En la raíz del proyecto:

```bash
docker compose up --build
```

- Servicio **app** en el puerto **8080** (mapeado en el host). Configure variables (URL de BD, usuario, contraseña, `HIS_ISSUER_URI`, almacenamiento) según su `docker-compose.yml` / orquestación.
- Volumen típico de subidas: `his_uploads` → `/data/uploads` (ver `docker-compose.yml`).

### Desarrollo local (sin contenedor de app)

```bash
mvn spring-boot:run
```

Defina las variables de **PostgreSQL** adecuadas o edite `application.yml` en su entorno. Flyway aplicará las migraciones bajo `src/main/resources/db/migration/` al arrancar.

### Puntos de entrada en el navegador (desarrollo típico en `8080`)

| Ruta | Uso |
|------|-----|
| `http://localhost:8080/` | Página de bienvenida |
| `http://localhost:8080/login.html` | Inicio de sesión |
| `http://localhost:8080/launcher.html` | Selector HIS / IAM (perfiles con maestro IAM) |
| `http://localhost:8080/app/pages/inicio.html` | Panel HIS (tras login) |
| `http://localhost:8080/iam/index.html` | IAM: usuarios, roles y asignaciones (acceso restringido) |

**Usuario admin inicial (ejemplo, configurable):** p. ej. `admin` / `admin123` (solo si así está definido; **cambie credenciales en producción**).

---

## API (referencia rápida, prefijo `/api`)

- **Auth:** p. ej. `POST /api/auth/login` (cuerpo JSON con usuario y contraseña) → token; `GET /api/auth/me` (con Bearer) para la sesión actual; `GET /api/auth/mis-pantallas` (pantallas permitidas por roles).
- **IAM (roles maestros):** gestión de roles y usuarios, p. ej. bajo ` /api/iam/...` (ver controladores; requiere permisos).
- **Catálogos:** `GET /api/catalog/...` (tipos, por tipo, recursos, etc. según implementación).
- **Pacientes y documentos:** ` /api/patients` (subida de documentos vía `multipart` donde aplique).
- **Citas:** p. ej. `GET /api/appointments` (rango y filtros), `GET /api/appointments/dashboard` (proyección reducida para el panel de inicio), `POST` / `PATCH` según módulo de agendación.
- **Reportes:** `GET /api/reports/resumen`, exportaciones `pdf` / `xlsx` según endpoints de reportes.
- Incluir siempre **`Authorization: Bearer <access_token>`** en recursos protegidos.

Detalle y ejemplos adicionales: código fuente en `org.lospipitos.his` y anotaciones OpenAPI si el proyecto las incorpora más adelante.

---

## Scripts y base de datos (referencia adicional)

En la carpeta [`database/`](database/) hay material de apoyo: esquemas, semillas y notas; puede haber documentación en [`database/postgresql/`](database/postgresql/) o [`database/README.txt`](database/README.txt) (convenciones **PostgreSQL** o históricas, según el fichero).

---

## Estilos (interfaz)

- Utilidades y tema: `src/main/resources/static/css/tailwind-app.css` y hojas complementarias (identidad de Los Pipitos, componentes *Fluent*-like, etc., según el proyecto).
