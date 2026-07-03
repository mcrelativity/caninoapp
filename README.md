# Plataforma Web de Seguimiento y Cuidados Caninos

Infraestructura MultiCloud personal: AWS (EC2 + VPC) para la app web, OCI Autonomous AI Database para datos estructurados, y Azure Blob Storage para archivos/multimedia, con CI/CD en GitHub Actions y controles OWASP Top 10 en la capa de aplicación.

Diagrama de topología completo: [`docs/topologia-diagrama.pdf`](docs/topologia-diagrama.pdf) (también disponible como [PNG](docs/topologia-diagrama.png)).

## Arquitectura rápida
- **Backend**: Node.js + Express + JWT + bcrypt, desplegado en AWS EC2 dentro de una VPC.
- **Base de datos**: OCI Autonomous AI Database (servicio `emiliano_medium`) vía Wallet mTLS — datos estructurados (usuarios, perfiles, bitácoras).
- **Almacenamiento de archivos**: Azure Blob Storage (contenedor privado `media`) — fotos de perfiles caninos, autenticación con Shared Key (backend) y acceso temporal a cada archivo vía SAS (10 min).
- **Frontend**: HTML + Tailwind CSS (CDN) en `public/`.
- **CI/CD**: GitHub Actions con etapas `build` → `test` → `deploy`, automatizado en cada push a `main`.

## Controles OWASP Top 10 implementados
| Control | Categoría OWASP | Dónde verlo |
|---|---|---|
| Cabeceras de seguridad (CSP restrictiva) | A05 Configuración de seguridad | `helmet()` en `app.js`; `curl -I` al sitio desplegado |
| Queries 100% parametrizadas (bind variables) | A03 Inyección | Todos los `controllers/*.js`, sin concatenación de SQL |
| Sesión segura vía JWT + verificación de ownership | A01 Control de acceso roto | `middlewares/auth.js`; cada query filtra por `usuario_id` |
| Rate limiting en login/register (10 intentos / 15 min) | A07 Fallas de identificación y autenticación | `routes/authRoutes.js`; probar con 11 intentos seguidos → 429 |
| Validación de archivos subidos (whitelist MIME + límite 5MB) | A04 Diseño inseguro | `middlewares/upload.js`; subir un `.pdf` a `/api/perfiles/:id/foto` → 400 |
| Hash de contraseñas con bcrypt (10 rounds) | A02 Fallas criptográficas | `controllers/authController.js` |
| Errores genéricos sin stack trace | A05 Configuración de seguridad | Manejador de errores en `app.js` |

## Requisitos
- Node.js 18+ y npm.
- Oracle Instant Client (para `oracledb`).
- Wallet mTLS de Oracle ADB (carpeta con `tnsnames.ora`).

## Estructura
- `app.js` entry point.
- `config/db.js` pool Oracle.
- `controllers/`, `routes/`, `middlewares/`.
- `public/` frontend estático.
- `db/schema.sql` y `db/seed.sql`.

## Variables de entorno
Copia `.env.example` a `.env` y completa los valores:
- `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`
- `TNS_ADMIN` (ruta al Wallet), `ORACLE_CLIENT_LIB_DIR` (ruta al Instant Client)
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_ACCOUNT_KEY`, `AZURE_STORAGE_CONTAINER_NAME`

Ejemplo local:
```
PORT=3000
DB_USER=admin
DB_PASSWORD=********
DB_CONNECT_STRING=emiliano_medium
TNS_ADMIN=/home/ec2-user/wallet
ORACLE_CLIENT_LIB_DIR=/home/ec2-user/instantclient
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=12h
AZURE_STORAGE_ACCOUNT_NAME=prueba3emiliano
AZURE_STORAGE_ACCOUNT_KEY=********
AZURE_STORAGE_CONTAINER_NAME=media
```

## Base de datos
- Crear tablas: `db/schema.sql`
- Insertar datos de prueba: `db/seed.sql`
- Migraciones incrementales: `db/migrations/` — **deben aplicarse manualmente contra la base real** (no se ejecutan solas en el deploy). Ej. `002_add_perfil_foto.sql` agrega la columna `foto_blob_name` que usa la subida de fotos a Azure Blob Storage; sin ella, `POST /api/perfiles/:id/foto` falla con 500.

## Azure Blob Storage: creación y control de acceso
Recursos ya provisionados: cuenta de almacenamiento `prueba3emiliano` con el contenedor privado `media` (sin acceso público de lectura anónima, verificado: una petición sin SAS devuelve `PublicAccessNotPermitted`).

**Decisión de diseño**: la opción ideal era autenticar la app vía un Service Principal con el rol RBAC `Storage Blob Data Contributor` (sin exponer nunca una clave de cuenta). Se evaluó, pero la cuenta de Azure usada no tiene permisos para crear App Registrations (`az ad sp create-for-rbac` falla por permisos) y no hay un administrador del tenant disponible para crearlo. Como alternativa segura, la app se autentica con la **Access Key** de la cuenta (`StorageSharedKeyCredential`, solo en el backend, nunca en el cliente) y para cada archivo genera una **SAS de solo lectura de 10 minutos** bajo demanda (`config/blobStorage.js`) — el front-end nunca ve la clave real ni una URL permanente. Esto cumple contenedor privado + política de acceso temporal (SAS); el punto que queda sin RBAC explícito es una limitación de permisos de la cuenta, no de la implementación.

Comandos de referencia si necesitas recrear los recursos:
```bash
az group create --name caninoapp-rg --location eastus
az storage account create --name prueba3emiliano --resource-group caninoapp-rg \
  --sku Standard_LRS --kind StorageV2 --allow-blob-public-access false
az storage container create --account-name prueba3emiliano --name media \
  --auth-mode login --public-access off
az storage account keys list --account-name prueba3emiliano --resource-group caninoapp-rg
```
La llave obtenida va en `AZURE_STORAGE_ACCOUNT_KEY` (`.env` local y `/etc/caninoapp/caninoapp.env` en EC2) — nunca en un archivo versionado en git.

## Endpoints principales
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/perfiles`
- `POST /api/perfiles`
- `GET /api/bitacoras`
- `POST /api/bitacoras`
- `GET /api/health` (verifica conectividad con Oracle)

## Rutas de interfaz
- `/` landing
- `/login` acceso
- `/register` registro
- `/reset-password` recuperación
- `/dashboard` panel CRUD visual

## Seguridad
Ver tabla completa de controles OWASP Top 10 más arriba. Resumen:
- JWT obligatorio para rutas de CRUD, con verificación de ownership por `usuario_id`.
- Rate limiting en `/api/auth/login` y `/api/auth/register`.
- Validación de tipo y tamaño de archivos subidos a Azure Blob Storage.
- Respuestas de error sin stack trace.
- Cabeceras seguras mediante `helmet`.

## Desarrollo local
1) Instala dependencias: `npm install`.
2) Crea `.env` con credenciales válidas.
3) Inicia la app: `npm run start`.
4) Prueba salud: `GET /api/health`.

## Despliegue en EC2 (Amazon Linux 2023)
La app vive en `/home/ec2-user/canino-app` y el Wallet en `/home/ec2-user/wallet`.

### Instalación base
1) `sudo dnf install -y nodejs nginx git`
2) `sudo systemctl enable --now nginx`

### Configuración de entorno
1) Copia `scripts/caninoapp.env.example` a `/etc/caninoapp/caninoapp.env`.
2) Ajusta `DB_USER` y `DB_PASSWORD` reales.
3) Verifica `TNS_ADMIN=/home/ec2-user/wallet` y `ORACLE_CLIENT_LIB_DIR=/home/ec2-user/instantclient`.

### systemd (mantiene viva la app)
1) Copia `scripts/caninoapp.service` a `/etc/systemd/system/caninoapp.service`.
2) `sudo systemctl daemon-reload`
3) `sudo systemctl enable --now caninoapp`

### Nginx (reverse proxy)
1) Copia `scripts/nginx-caninoapp.conf` a `/etc/nginx/conf.d/caninoapp.conf`.
2) `sudo nginx -t`
3) `sudo systemctl reload nginx`

Importante: `client_max_body_size` debe ser igual o mayor al límite de subida de archivos de la app (5MB, ver `MAX_FILE_SIZE_BYTES` en `config/blobStorage.js`) — si nginx tiene un límite menor, rechaza la subida con `413` antes de que llegue al backend.

### Verificación rápida
- `curl -i http://127.0.0.1:3000/api/health`
- `curl -i http://<EC2_PUBLIC_IP>/api/health`

## CI/CD con GitHub Actions
El workflow está en `.github/workflows/deploy.yml`, con tres etapas encadenadas (`build` → `test` → `deploy`) que corren automáticamente en cada push a `main`, sin intervención manual:
1. **build**: `npm ci` + `npm run build` (selfcheck de estructura del proyecto).
2. **test**: `npm test` (suite Jest: validadores de entrada y middleware de autenticación).
3. **deploy** (solo si `build` y `test` pasan): SSH a la instancia EC2, `git pull`, `npm install --omit=dev` y reinicio del servicio con `systemctl`.

Configura estos secretos en GitHub:
- `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_APP_DIR`
- (opcional) `EC2_SSH_PORT`

## Estado del proyecto
- [ ] Aplicación web en producción (EC2)
- [ ] Repositorio GitHub con el pipeline CI/CD (`build` → `test` → `deploy`)
- [ ] Diagrama de topología: [`docs/topologia-diagrama.pdf`](docs/topologia-diagrama.pdf) / [`docs/topologia-diagrama.png`](docs/topologia-diagrama.png)
- [ ] VPC, controles OWASP, OCI Autonomous AI Database y Azure Blob Storage (subida/descarga de foto) funcionando de punta a punta
