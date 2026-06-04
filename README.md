# Plataforma Web de Seguimiento y Cuidados Caninos

## Arquitectura rápida
- **Backend**: Node.js + Express + JWT + bcrypt.
- **DB**: Oracle Autonomous Database (servicio `emiliano_medium`) vía Wallet mTLS.
- **Frontend**: HTML + Tailwind CSS (CDN) en `public/`.

## Variables de entorno
Copia `.env.example` a `.env` y completa los valores:
- `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`
- `TNS_ADMIN` (ruta al Wallet), `ORACLE_CLIENT_LIB_DIR` (ruta al Instant Client)
- `JWT_SECRET`, `JWT_EXPIRES_IN`

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

## Seguridad
- JWT obligatorio para rutas de CRUD.
- Respuestas de error sin stack trace.
- Cabeceras seguras mediante `helmet`.
