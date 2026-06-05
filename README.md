# Plataforma Web de Seguimiento y Cuidados Caninos

## Arquitectura rápida
- **Backend**: Node.js + Express + JWT + bcrypt.
- **DB**: Oracle Autonomous Database (servicio `emiliano_medium`) vía Wallet mTLS.
- **Frontend**: HTML + Tailwind CSS (CDN) en `public/`.

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
```

## Base de datos
- Crear tablas: `db/schema.sql`
- Insertar datos de prueba: `db/seed.sql`

El usuario seed utiliza contraseña **"password"** (hash bcrypt pre-generado). Cámbiala en ambientes reales.

## Endpoints principales
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/perfiles`
- `POST /api/perfiles`
- `GET /api/bitacoras`
- `POST /api/bitacoras`
- `GET /api/health` (verifica conectividad con Oracle)

## Seguridad
- JWT obligatorio para rutas de CRUD.
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

### Verificación rápida
- `curl -i http://127.0.0.1:3000/api/health`
- `curl -i http://<EC2_PUBLIC_IP>/api/health`

## CI/CD con GitHub Actions
El workflow está en `.github/workflows/deploy.yml`. Configura estos secretos:
- `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_APP_DIR`
- (opcional) `EC2_SSH_PORT`

El deploy hace `git pull`, `npm install --omit=dev` y reinicia el servicio con `systemctl`.

## Despliegue en EC2 (Amazon Linux 2023)
La app vive en `/home/ec2-user/canino-app` y el Wallet en `/home/ec2-user/wallet`.

1) Instala Node.js y Nginx:
- `sudo dnf install -y nodejs nginx`
- `sudo systemctl enable --now nginx`

2) Crea el archivo de entorno del servicio:
- Copia `scripts/caninoapp.env.example` a `/etc/caninoapp/caninoapp.env`
- Ajusta credenciales y rutas (`TNS_ADMIN=/home/ec2-user/wallet`).

3) Configura el servicio systemd:
- Copia `scripts/caninoapp.service` a `/etc/systemd/system/caninoapp.service`
- `sudo systemctl daemon-reload`
- `sudo systemctl enable --now caninoapp`

4) Configura Nginx (reverse proxy):
- Copia `scripts/nginx-caninoapp.conf` a `/etc/nginx/conf.d/caninoapp.conf`
- `sudo nginx -t`
- `sudo systemctl reload nginx`

## CI/CD con GitHub Actions
El workflow está en `.github/workflows/deploy.yml`. Configura estos secretos en GitHub:
- `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_APP_DIR`
- (opcional) `EC2_SSH_PORT`

El deploy hace `git pull`, `npm install --omit=dev` y reinicia el servicio con `systemctl`.
