# Guía de Integración de Validaciones

## Estado actual

✅ Sistema de validaciones completo:

- Esquemas Zod para todas las entidades
- JWT para autenticación
- Middleware centralizado de errores
- Controlador y rutas de autenticación

## Próximos pasos

### Paso 1: Configurar archivo .env

Copia el contenido de `.env.example` a un nuevo archivo `.env` y configura tus valores:

```bash
# En la raíz del proyecto
cp .env.example .env
```

Edita `.env` con tus valores reales:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=andestur
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui

PORT=3000
NODE_ENV=development

JWT_SECRET=una-clave-super-segura-y-larga-para-produccion
JWT_EXPIRATION=24h
```

### Paso 2: Instalar bcrypt para hashear contraseñas

```bash
npm install bcrypt
```

Luego en `src/controllers/auth.controller.js`, reemplaza:

```javascript
// TODO: Hashear contraseña con bcrypt
```

Con:

```javascript
import bcrypt from "bcrypt";

// En la función register:
const hashedPassword = await bcrypt.hash(validatedData.password, 10);
const userData = {
  ...validatedData,
  password: hashedPassword,
};
const user = await usersModel.create(userData);

// En la función login:
const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
if (!isPasswordValid) {
  throw new AppError("Contraseña incorrecta", 401);
}
```

### Paso 3: Probar autenticación en Postman

1. **Registrar usuario**:

   ```
   POST http://localhost:3000/api/auth/register

   {
     "username": "testuser",
     "password": "TestPass123!",
     "email": "test@example.com",
     "id_role": 1
   }
   ```

2. **Login**:

   ```
   POST http://localhost:3000/api/auth/login

   {
     "email": "test@example.com",
     "password": "TestPass123!"
   }
   ```

   Copiar el token de la respuesta

3. **Verificar perfil**:

   ```
   GET http://localhost:3000/api/auth/profile

   Headers:
   Authorization: Bearer <token_aqui>
   ```

### Paso 4: Integrar validaciones en rutas existentes

#### Opción A: Middleware en rutas (Recomendado)

Actualiza cada archivo de ruta siguiendo este patrón. Ejemplo: `src/routes/users.routes.js`

```javascript
import { Router } from "express";
import { validateSchema } from "../validations/errorHandler.js";
import { authenticateToken, authorizeRole } from "../validations/jwt.js";
import { createUserSchema, updateUserSchema } from "../validations/schemas.js";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/users.controller.js";

const router = Router();

// Proteger todas las rutas con autenticación
router.use(authenticateToken);

// Crear usuario (solo admin)
router.post(
  "/",
  authorizeRole("admin"),
  validateSchema(createUserSchema, "body"),
  createUser,
);

// Obtener todos
router.get("/", getAllUsers);

// Obtener por ID
router.get("/:id", getUserById);

// Actualizar (solo admin o propietario)
router.put(
  "/:id",
  authorizeRole("admin"),
  validateSchema(updateUserSchema, "body"),
  updateUser,
);

// Eliminar (solo admin)
router.delete("/:id", authorizeRole("admin"), deleteUser);

export default router;
```

#### Opción B: Validación manual en controlador

Usa `validateData()` dentro del controlador:

```javascript
import { validateData, AppError } from "../validations/errorHandler.js";
import { createUserSchema } from "../validations/schemas.js";

export const createUser = async (req, res, next) => {
  try {
    // Validar datos
    const validation = validateData(createUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Error en validación",
        errors: validation.errors,
      });
    }

    // Crear usuario
    const user = await usersModel.create(validation.data);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
```

### Paso 5: Aplicar a todos los controladores

Usa el patrón anterior para actualizar estas rutas (en este orden):

1. `src/routes/users.routes.js` ← Comienza aquí
2. `src/routes/roles.routes.js`
3. `src/routes/customers.routes.js`
4. `src/routes/destinations.routes.js`
5. `src/routes/packages.routes.js`
6. `src/routes/reservations.routes.js`
7. `src/routes/states.routes.js`
8. `src/routes/municipalities.routes.js`
9. `src/routes/vehicles.routes.js`
10. `src/routes/staff.routes.js`
11. `src/routes/payment-details.routes.js`
12. `src/routes/payment-headers.routes.js`
13. `src/routes/packages-destinations.routes.js`
14. `src/routes/staff-packages.routes.js`

### Paso 6: Configurar políticas de acceso por rol

Define permisos por rol:

```javascript
// Admin: Acceso total
router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteUser);

// Manager: Puede actualizar
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("admin", "manager"),
  updateUser,
);

// Staff: Solo lectura
router.get(
  "/",
  authenticateToken,
  authorizeRole("admin", "manager", "staff"),
  getAllUsers,
);

// Cliente: Acceso a su perfil
router.get("/:id", authenticateToken, getProfile); // validar que sea su propio ID
```

### Paso 7: Agregaciones opcionales

#### Email de verificación

```javascript
import nodemailer from "nodemailer";

// Después del registro, enviar email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const verificationLink = `http://localhost:3000/api/auth/verify/${user.id}`;
await transporter.sendMail({
  to: user.email,
  subject: "Verifica tu email",
  html: `<a href="${verificationLink}">Click aquí para verificar</a>`,
});
```

#### Refresh tokens

```javascript
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyToken(refreshToken);

    if (!decoded.success) {
      throw new AppError("Refresh token inválido", 401);
    }

    const newToken = generateToken(decoded.data);
    res.json({ success: true, token: newToken });
  } catch (error) {
    next(error);
  }
};
```

#### Rate limiting

```javascript
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: "Demasiados intentos, intenta después",
});

router.post("/login", loginLimiter, login);
```

## Checklist de implementación

- [ ] Configurar `.env` con credenciales
- [ ] Instalar bcrypt
- [ ] Implementar bcrypt en auth.controller.js
- [ ] Probar endpoints de autenticación en Postman
- [ ] Actualizar `src/routes/users.routes.js`
- [ ] Aplicar patrón a otros 13 archivos de rutas
- [ ] Definir políticas de acceso por rol
- [ ] Probar protección de rutas
- [ ] (Opcional) Implementar email de verificación
- [ ] (Opcional) Implementar refresh tokens
- [ ] (Opcional) Agregar rate limiting

## Comandos útiles

```bash
# Validar sintaxis
node --check src/validations/schemas.js

# Iniciar servidor
npm start

# Ver logs de cambios
git status
git diff src/

# Buscar TODOs pendientes
grep -r "TODO" src/
```

## Soporte

Para ejemplos detallados, ver `src/validations/EJEMPLOS.js`
Para documentación completa, ver `VALIDACIONES.md`
