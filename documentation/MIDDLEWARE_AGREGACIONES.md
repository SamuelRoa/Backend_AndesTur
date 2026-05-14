# Agregaciones a src/middleware/

## Lo que se agregó

Reorganicé completamente el sistema de middlewares para que siga las convenciones de Express.js, usando la carpeta `src/middleware/` como debería ser.

### Archivos creados en `src/middleware/`

#### 1. **auth.middleware.js**

Toda la lógica de JWT:

- `generateToken()` - Generar JWT
- `verifyToken()` - Verificar JWT
- `decodeToken()` - Decodificar sin verificar
- `authenticateToken` - Middleware para proteger rutas
- `authorizeRole()` - Middleware para autorizar por rol

#### 2. **validation.middleware.js**

Validación centralizada:

- `validateSchema()` - Middleware para validar contra esquema Zod
- `validateData()` - Función para validar datos manualmente

#### 3. **errorHandler.middleware.js**

Manejo de errores:

- `AppError` - Clase personalizada de error
- `errorHandler` - Middleware centralizado que captura TODOS los errores
- `notFoundHandler` - Middleware para rutas no encontradas (404)
- `asyncHandler` - Wrapper para funciones async (opcional pero útil)

#### 4. **index.js**

Exporta todos los middlewares de forma centralizada para facilitar imports:

```javascript
// En lugar de:
import { validateSchema } from "../middleware/validation.middleware.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { errorHandler } from "../middleware/errorHandler.middleware.js";

// Ahora puedes:
import {
  validateSchema,
  authenticateToken,
  errorHandler,
} from "../middleware/index.js";
```

#### 5. **README.md**

Documentación completa de cada middleware.

---

## Cambios en otros archivos

Se actualizaron los imports en:

1. **src/server.js**
   - `from "./validations/errorHandler.js"` → `from "./middleware/index.js"`

2. **src/controllers/auth.controller.js**
   - `from "../validations/jwt.js"` → `from "../middleware/auth.middleware.js"`
   - `from "../validations/errorHandler.js"` → `from "../middleware/errorHandler.middleware.js"`

3. **src/routes/auth.routes.js**
   - `from "../validations/jwt.js"` → `from "../middleware/auth.middleware.js"`

---

## Estructura ahora es

```
src/middleware/
├── index.js                      ← Exportar todo
├── auth.middleware.js            ← JWT + autenticación
├── validation.middleware.js      ← Validación Zod
├── errorHandler.middleware.js    ← Manejo de errores
└── README.md                     ← Documentación

src/validations/
├── schemas.js                    ← Esquemas Zod (SIGUE AQUÍ)
├── jwt.js                        ← [Legacy - no usar]
├── errorHandler.js               ← [Legacy - no usar]
└── EJEMPLOS.js                   ← Referencias
```

---

## Beneficios

✅ **Estructura estándar de Express.js**

- Los middlewares están donde deben estar
- Fácil de navegar para otros desarrolladores

✅ **Separación de responsabilidades**

- `auth.middleware.js` - Solo JWT
- `validation.middleware.js` - Solo validación
- `errorHandler.middleware.js` - Solo errores

✅ **Fácil de importar**

- `import { ... } from "../middleware"` desde cualquier lado

✅ **Documentación centralizada**

- README.md con todos los middlewares documentados

✅ **Reutilizable**

- Cada middleware es independiente y puede usarse en cualquier ruta

---

## Próximos pasos

1. **Aplicar en todas las rutas**

   ```javascript
   import { validateSchema, authenticateToken } from "../middleware";

   router.post("/", validateSchema(schema), create);
   router.get("/profile", authenticateToken, getProfile);
   ```

2. **Implementar bcrypt**

   ```bash
   npm install bcrypt
   ```

3. **Probar en Postman**
   - Registrarse
   - Login
   - Acceder rutas protegidas

---

## Validación

✅ Todos los archivos verificados sin errores de sintaxis
✅ Importes actualizados correctamente
✅ Middleware stack en orden correcto en `server.js`
✅ Exporta centralizado en `index.js`

---

## Referencias

- Ver `src/middleware/README.md` para documentación completa
- Ver `ARQUITECTURA.md` para flujos y diagramas
- Ver `IMPLEMENTACION_VALIDACIONES.md` para guía de integración
