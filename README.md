# jalemos-backend

API de la plataforma jalemos.com (venta de tickets para eventos).

## Requisitos previos

- Node.js instalado
- PostgreSQL instalado (o una base de datos en la nube, ej. Supabase/Railway)

## Instalación

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia el archivo de variables de entorno y complétalo con tus datos:

   ```bash
   cp .env.example .env
   ```

   Edita `DATABASE_URL` con los datos de tu base de datos PostgreSQL, y genera
   un `JWT_SECRET` real con:

   ```bash
   openssl rand -hex 32
   ```

3. Crea las tablas en la base de datos a partir del esquema de Prisma:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Crea tu usuario administrador (nunca se crea por un endpoint público, solo por este script):

   ```bash
   node src/scripts/crearAdmin.js tucorreo@ejemplo.com "unaContraseñaSegura123"
   ```

5. Levanta el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   Debería iniciar en `http://localhost:4000`.

## Endpoints disponibles

| Método | Ruta                          | Quién puede llamarlo | Descripción |
|--------|-------------------------------|-----------------------|-------------|
| POST   | /api/auth/login               | Público (limitado)    | Login del admin, devuelve un JWT |
| GET    | /api/eventos                  | Público               | Lista todos los eventos activos |
| GET    | /api/eventos/:id              | Público               | Detalle de un evento |
| POST   | /api/eventos                  | Solo ADMIN             | Crea un evento con fotos |
| POST   | /api/transacciones            | Público (limitado)    | Registra una compra (tarjeta o depósito) |
| GET    | /api/transacciones            | Solo ADMIN             | Historial de transacciones |
| PATCH  | /api/transacciones/:id/aprobar| Solo ADMIN             | Aprueba un depósito y genera el ticket |
| PATCH  | /api/transacciones/:id/rechazar| Solo ADMIN            | Rechaza un depósito |

Para las rutas de "Solo ADMIN", envía el header:
`Authorization: Bearer <token>` (el token lo devuelve `/api/auth/login`).

## Seguridad implementada en esta fase

- **Autenticación con JWT** y contraseñas guardadas con `bcrypt` (nunca en texto plano).
- **Autorización por rol**: solo un usuario con rol `ADMIN` puede crear eventos o aprobar/rechazar transacciones.
- **El número de tarjeta nunca pasa por este backend.** El pago con tarjeta se hace mediante un token de un solo uso que genera el SDK de la pasarela de pago directamente en el navegador del comprador. Esto es obligatorio: aceptar el número de tarjeta directamente en tu servidor te obligaría a cumplir PCI-DSS, algo muy costoso para un proyecto que inicia.
- **El monto a cobrar siempre se calcula en el servidor** a partir del precio real guardado en la base de datos — nunca se confía en un total enviado desde el navegador.
- **Validación estricta de datos de entrada** con Zod en cada endpoint que recibe datos del usuario.
- **Verificación real del contenido de los archivos subidos** (no solo su extensión) para evitar que se suba un archivo malicioso disfrazado de imagen.
- **Límite de peticiones (rate limiting)**: más estricto en login (fuerza bruta) y en la creación de transacciones.
- **Cabeceras de seguridad HTTP** con Helmet.
- **CORS restringido** solo al dominio del frontend (configurable en `ORIGENES_PERMITIDOS`).
- **Manejo centralizado de errores**: en producción nunca se muestra el detalle interno del error al usuario.
- **Validación de variables de entorno al iniciar**: el servidor no arranca si falta un secreto o si el `JWT_SECRET` es demasiado corto/de ejemplo.

## Antes de salir a producción (checklist adicional)

- [ ] Servir la API únicamente por **HTTPS** (Railway/Render/Vercel lo hacen automático).
- [ ] Cambiar `ORIGENES_PERMITIDOS` al dominio real de jalemos.com.
- [ ] Reemplazar el almacenamiento local de `/uploads` por Cloudinary o S3 (más seguro y escalable).
- [ ] Integrar de verdad la pasarela de pago (Recurrente/Stripe) siguiendo su flujo de tokenización.
- [ ] Configurar backups automáticos de la base de datos.
- [ ] Nunca subir el archivo `.env` real a git (ya está en `.gitignore`).

## Conectar el correo real (Gmail, Zoho, o el que uses)

En tu `.env`, completa `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM`.
Si usas Gmail, necesitas crear una "contraseña de aplicación" (no tu contraseña normal)
desde la configuración de seguridad de tu cuenta de Google. El envío ya está conectado:
se dispara automáticamente al aprobar un depósito o al confirmarse un pago con tarjeta.

## Conectar la pasarela de pago real (Recurrente)

1. Crea tu cuenta en Recurrente y obtén tu API key.
2. Completa `PAGOS_API_URL` y `PAGOS_API_KEY` en tu `.env`.
3. Abre `src/services/pasarelaPago.js` y descomenta/ajusta el bloque de ejemplo
   según la documentación oficial de su API de cobros con token.
4. En el frontend, integra el SDK de Recurrente en el checkout para generar el
   `tokenPago` que se envía a `POST /api/transacciones` — eso es lo único que falta
   para que el flujo de tarjeta quede 100% funcional de principio a fin.

## Próximos pasos

- Probar el flujo completo con una base de datos y cuenta de correo reales.
- Conectar el SDK de la pasarela de pago en el frontend (checkout.jsx).
- Pasar `/uploads` a Cloudinary o S3 antes de salir a producción.
