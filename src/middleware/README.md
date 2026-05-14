# Middleware - Andestur API

Middlewares organizados para autenticación, validación y manejo de errores.

## Estructura

```
middleware/
├── index.js                      # Exportar todos los middlewares
├── auth.middleware.js            # JWT y autenticación
├── validation.middleware.js      # Validación de esquemas Zod
└── errorHandler.middleware.js    # Manejo centralizado de errores
```

---

## 1. auth.middleware.js

**Manejo de JWT y autenticación**

### Funciones

#### generateToken(payload)

Genera un JWT firmado.

```javascript
import { generateToken } from "../middleware/auth.middleware.js";

const token = generateToken({
  id_user: 1,
  email: "user@example.com",
  role: "admin",
});
```

#### verifyToken(token)

Verifica y decodifica un JWT.

```javascript
const result = verifyToken(token);
if (result.success) {
  console.log(result.data); // payload decodificado
} else {
  console.log(result.message); // "Token expirado" o "Token inválido"
}
```

#### decodeToken(token)

Solo decodifica sin verificar.

```javascript
const payload = decodeToken(token);
```

#### authenticateToken (middleware)

Valida JWT en el header `Authorization: Bearer <token>`.

```javascript
router.get("/profile", authenticateToken, getProfile);
```

Adjunta `req.user` con los datos decodificados.

#### authorizeRole(...roles) (middleware)

Verifica que el usuario tenga uno de los roles permitidos.

Requiere `authenticateToken` antes.

```javascript
router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteUser);

router.post(
  "/",
  authenticateToken,
  authorizeRole("admin", "manager"),
  createItem,
);
```

---

## 2. validation.middleware.js

**Validación de esquemas Zod**

### Funciones

#### validateSchema(schema, source)

Middleware para validar datos contra un esquema Zod.

```javascript
import { validateSchema } from "../middleware/validation.middleware.js";
import { createUserSchema } from "../validations/schemas.js";

router.post("/", validateSchema(createUserSchema, "body"), createUser);
```

Parámetros:

- `schema` - Esquema Zod
- `source` - "body" (default) | "query" | "params"

Si validación falla, retorna 400 con errores.

Si OK, adjunta `req.bodyValidated` con datos validados.

#### validateData(schema, data)

Valida datos manualmente (no es middleware).

```javascript
import { validateData } from "../middleware/validation.middleware.js";

const validation = validateData(createUserSchema, req.body);
if (!validation.success) {
  // validation.errors
} else {
  // validation.data
}
```

---

## 3. errorHandler.middleware.js

**Manejo centralizado de errores**

### Clases

#### AppError

Error personalizado con statusCode.

```javascript
import { AppError } from "../middleware/errorHandler.middleware.js";

throw new AppError("Usuario no encontrado", 404);
throw new AppError("Acceso denegado", 403);
```

### Funciones

#### errorHandler (middleware)

Captura todos los errores y retorna respuestas consistentes.

**Debe ir al final de la pila de middlewares:**

```javascript
app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler); // Último
```

Maneja:

- Errores Zod → 400
- Errores Sequelize (unique) → 409
- Errores Sequelize (validation) → 400
- Errores Sequelize (foreign key) → 400
- Errores JWT → 401
- AppError personalizado
- Errores genéricos → 500

En desarrollo (`NODE_ENV=development`), incluye stack trace.

#### notFoundHandler (middleware)

Captura rutas no encontradas.

```javascript
app.use(notFoundHandler); // Debe ir antes de errorHandler
```

Retorna 404 para cualquier ruta no encontrada.

#### asyncHandler(fn)

Wrapper para funciones async que evita try-catch repetitivo.

```javascript
import { asyncHandler } from "../middleware/errorHandler.middleware.js";

export const getUser = asyncHandler(async (req, res) => {
  // No necesita try-catch, los errores van a errorHandler
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError("Usuario no encontrado", 404);
  res.json(user);
});
```

---

## Uso en server.js

```javascript
import { errorHandler, notFoundHandler } from "./middleware/index.js";

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);
```

---

## Uso en rutas

```javascript
import express from "express";
import {
  authenticateToken,
  authorizeRole,
  validateSchema,
} from "../middleware/index.js";
import { createUserSchema } from "../validations/schemas.js";

const router = express.Router();

// Ruta pública con validación
router.post("/", validateSchema(createUserSchema, "body"), createUser);

// Ruta protegida
router.get("/profile", authenticateToken, getProfile);

// Ruta protegida por rol
router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteUser);
```

---

## Uso en controladores

```javascript
import {
  AppError,
  asyncHandler,
} from "../middleware/errorHandler.middleware.js";

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  res.json({
    success: true,
    data: user,
  });
});
```

---

## Exportar desde index.js

Para facilitar importes, `index.js` exporta todos:

```javascript
import {
  authenticateToken,
  authorizeRole,
  generateToken,
  validateSchema,
  validateData,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
} from "../middleware/index.js";
```

---

## Flujo de errores

```
Solicitud HTTP
     ↓
Middleware/Controlador
     ↓
├─ Validación Zod → ZodError → errorHandler → 400
├─ DB unique → SequelizeUniqueConstraintError → 409
├─ Token inválido → 401
├─ Rol insuficiente → 403
└─ AppError → statusCode personalizado
     ↓
errorHandler formatea y retorna
     ↓
Respuesta JSON
```

---

## Respuestas de error

### Validación (400)

```json
{
  "success": false,
  "message": "Error en validación de datos",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email",
      "code": "invalid_string"
    }
  ]
}
```

### Autenticación (401)

```json
{
  "success": false,
  "message": "Token expirado"
}
```

### Autorización (403)

```json
{
  "success": false,
  "message": "Acceso denegado. Se requiere uno de los roles: admin"
}
```

### Duplicado (409)

```json
{
  "success": false,
  "message": "Valor duplicado en campo(s): email",
  "fields": ["email"]
}
```

### No encontrado (404)

```json
{
  "success": false,
  "message": "Ruta no encontrada: GET /api/invalid"
}
```

---

## Configuración

Variables de entorno (`/.env`):

```env
JWT_SECRET=tu-clave-secreta-aqui
JWT_EXPIRATION=24h
NODE_ENV=development
```

---

## Checklist de integración

- ✅ Middleware en carpeta correcta (`src/middleware/`)
- ✅ Importes actualizados en `server.js`, rutas y controladores
- ✅ errorHandler y notFoundHandler en pila correcta
- ✅ Errores Zod mapeados a 400
- ✅ Errores Sequelize mapeados correctamente
- ✅ Errores JWT mapeados a 401
- ⏳ Aplicar a todos los controladores y rutas
- ⏳ Testing en Postman

---

## Próximos pasos

1. Aplicar validación a todas las rutas
2. Implementar bcrypt en auth.controller.js
3. Proteger rutas sensibles con authenticateToken
4. Definir políticas de acceso por rol
5. Testing completo en Postman
