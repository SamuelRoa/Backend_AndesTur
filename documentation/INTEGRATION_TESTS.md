# Pruebas de Integración (Jest + Supertest)

Este documento explica cómo ejecutar y validar las pruebas de integración implementadas en el proyecto.

## Qué cubren las pruebas
- `GET /api` (health)
- Endpoints de `auth`: `register`, `login`, `verify`, `profile`
- CRUD de `users`, `packages`, `destinations`

Todas las pruebas usan métodos mockeados de los modelos para no alterar la base de datos real.

## Ejecutar pruebas
1. Instala dependencias (si no está hecho):

```bash
npm install
```

2. Ejecuta las pruebas:

```bash
npm test
```

Jest se ejecuta en modo ESM y levanta los tests bajo `src/tests/**/*.test.js`.

## Validación en las pruebas
- Se usa `supertest` para realizar peticiones HTTP a la aplicación exportada (`src/server.js`).
- Se mockean los métodos de los modelos (`findOne`, `findByPk`, `findAll`, `create`, `update`, `destroy`) con `jest.spyOn`.
- Para autenticación se usa `generateToken` desde el middleware para crear tokens válidos y enviarlos en `Authorization: Bearer <token>`.
- Las respuestas se validan comprobando propiedades clave (`success`, `data`, `token`) y tipos.

## Añadir más tests
- Crear un nuevo archivo dentro de `src/tests/` con sufijo `.test.js`.
- Mockear los métodos del modelo que el controlador utilice.
- Usar `jest.restoreAllMocks()` en `afterEach` para limpiar mocks.

## Ejemplo rápido: validar manualmente
1. Levanta la app normalmente (no en modo test):

```bash
npm start
```

2. Haz una petición a `GET /api`:

```bash
curl http://localhost:3000/api
```

Deberías ver un JSON con `success: true`.

## Reporte semanal por correo
Se añadió la tarea de reporte que genera un PDF con las reservaciones de la semana y lo envía por correo.

### Dependencias nuevas
- `node-cron` para programar la tarea semanal.
- `pdfkit` para generar el PDF.

### Cómo funciona
- `src/tasks/weeklyReport.task.js` genera el reporte.
- El reporte busca reservaciones entre el lunes y el domingo de la semana actual.
- Incluye el nombre del paquete y el nombre del cliente gracias a las asociaciones de Sequelize.
- El PDF se envía como adjunto usando `nodemailer`.
- La tarea se programa por defecto a las 08:00 todos los lunes (`0 8 * * 1`).

### Variables de entorno necesarias
- `EMAIL_USER`: remitente del correo.
- `EMAIL_PASS`: contraseña o app password.
- `REPORT_RECIPIENT`: correo destinatario del reporte (opcional, si no está se usa `EMAIL_USER`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`: opcionales si usas un servidor SMTP distinto a Gmail.
- `REPORT_CRON`: opcional para modificar la expresión cron.

### Probar ahora mismo
1. Asegúrate de tener las variables en `.env`.
2. Ejecuta:

```bash
npm run send-report
```

3. El script generará un PDF y lo guardará en `tmp/`.
4. Revisa el correo de destino configurado en `REPORT_RECIPIENT`.

---

Si quieres que las pruebas interactúen con una base de datos real (SQLite en memoria), puedo implementarlo como opción B. Actualmente todo está preparado para correr sin tocar la BD.
