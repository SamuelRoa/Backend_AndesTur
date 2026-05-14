# Sistema de Validaciones - Andestur API

## Descripción

Este proyecto incluye un sistema completo de validaciones con:

- **Zod**: Validación de esquemas y tipos TypeScript
- **JWT**: Autenticación y autorización con tokens
- **Middleware centralizado**: Manejo de errores y validaciones
- **Validaciones genéricas**: Reutilizables en toda la aplicación
- **Validaciones específicas**: Por cada entidad del negocio

---

## Estructura de archivos

```
src/validations/
├── schemas.js          # Definición de todos los esquemas Zod
├── jwt.js              # Funciones y middleware de JWT
├── errorHandler.js     # Middleware centralizado de errores
└── EJEMPLOS.js         # Ejemplos de uso
```

---

## 1. Validaciones Genéricas

### Tipos básicos

```javascript
import {
  idSchema,
  emailSchema,
  nameSchema,
  phoneSchema,
  dniSchema,
  passwordSchema,
  priceSchema,
  dateSchema,
  futureDateSchema,
} from "../validations/schemas.js";

// Validar ID
const id = idSchema.parse(123); // ✓ válido
const id = idSchema.parse("456"); // ✓ convierte a número
const id = idSchema.parse(-1); // ✗ error: debe ser positivo

// Validar email
const email = emailSchema.parse("user@example.com"); // ✓ válido
const email = emailSchema.parse("invalid"); // ✗ error: email inválido

// Validar contraseña
const pwd = passwordSchema.parse("SecurePass123!"); // ✓ válido
const pwd = passwordSchema.parse("123456"); // ✗ error: requiere mayúscula, minúscula, número y carácter especial

// Validar DNI
const dni = dniSchema.parse("12345678"); // ✓ válido
const dni = dniSchema.parse("123"); // ✗ error: mínimo 6 dígitos

// Validar precio
const price = priceSchema.parse(99.99); // ✓ válido
const price = priceSchema.parse(-50); // ✗ error: debe ser positivo

// Validar fechas
const date = dateSchema.parse("2026-06-01"); // ✓ válido
const futDate = futureDateSchema.parse("2026-06-01"); // ✓ válido
const futDate = futureDateSchema.parse("2020-01-01"); // ✗ error: fecha en el pasado
```

### Enums disponibles

```javascript
import {
  userStateEnum,
  staffTypeEnum,
  payMethodEnum,
  payStateEnum,
} from "../validations/schemas.js";

userStateEnum.parse("active"); // ✓ válido: "active" | "inactive" | "blocked"
staffTypeEnum.parse("guide"); // ✓ válido: "guide" | "driver"
payMethodEnum.parse("card"); // ✓ válido: "cash" | "card" | "digital"
payStateEnum.parse("pending"); // ✓ válido: "pending" | "partial" | "paid" | "cancelled" | "expired"
```

---

## 2. Validaciones Específicas por Entidad

### Usuarios

```javascript
import { createUserSchema, updateUserSchema } from "../validations/schemas.js";

// Crear usuario
const newUser = createUserSchema.parse({
  username: "johndoe",
  password: "SecurePass123!",
  email: "john@example.com",
  state: "active",
  id_role: 1,
});

// Actualizar usuario (todos los campos son opcionales)
const updates = updateUserSchema.parse({
  email: "newemail@example.com",
});
```

### Clientes

```javascript
import { createCustomerSchema } from "../validations/schemas.js";

const customer = createCustomerSchema.parse({
  dni: "12345678",
  name: "Carlos",
  lastname: "García",
  phone_number: "3001234567",
  email: "carlos@example.com",
});
```

### Paquetes turísticos

```javascript
import { createPackageSchema } from "../validations/schemas.js";

const package = createPackageSchema.parse({
  name: "Tour Medellín",
  description: "Recorrido por la ciudad",
  departure_date: "2026-06-01",
  return_date: "2026-06-05",
  price: 1200.0,
  id_vehicle: 1,
  available_places: 20,
});
// ✗ Error si return_date <= departure_date
// ✓ Se valida automáticamente que las fechas sean válidas
```

### Reservaciones

```javascript
import { createReservationSchema } from "../validations/schemas.js";

const reservation = createReservationSchema.parse({
  id_package: 1,
  id_customer: 1,
  reservation_date: "2026-05-14",
  pay_state: "pending",
});
```

---

## 3. Autenticación JWT

### Registrar usuario

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!",
  "email": "john@example.com",
  "id_role": 1
}

RESPUESTA (201):
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id_user": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "state": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

RESPUESTA (200):
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "id_user": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "state": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Acceder a ruta protegida

```bash
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

RESPUESTA (200):
{
  "success": true,
  "data": {
    "id_user": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "state": "active",
    "role": { ... }
  }
}
```

---

## 4. Usando validaciones en controladores

### Enfoque manual

```javascript
import { validateData } from "../validations/errorHandler.js";
import { createUserSchema } from "../validations/schemas.js";
import { usersModel } from "../models/users.models.js";

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

    const user = await usersModel.create(validation.data);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error); // Pasa al errorHandler centralizado
  }
};
```

### Enfoque con middleware

```javascript
import { Router } from "express";
import { validateSchema } from "../validations/errorHandler.js";
import { createUserSchema } from "../validations/schemas.js";
import { authenticateToken, authorizeRole } from "../validations/jwt.js";

const router = Router();

// Aplicar validación como middleware
router.post(
  "/",
  authenticateToken,
  authorizeRole("admin"),
  validateSchema(createUserSchema, "body"),
  createUser,
);

// En el controlador:
export const createUser = async (req, res, next) => {
  try {
    // req.bodyValidated contiene los datos validados
    const user = await usersModel.create(req.bodyValidated);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 5. Proteger rutas

### Autenticación simple

```javascript
import { authenticateToken } from "../validations/jwt.js";

router.get("/profile", authenticateToken, getProfile);
// Solo usuarios autenticados pueden acceder
```

### Autorización por rol

```javascript
import { authorizeRole } from "../validations/jwt.js";

router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteUser);
// Solo admin puede ejecutar
```

### Múltiples roles

```javascript
router.post(
  "/",
  authenticateToken,
  authorizeRole("admin", "moderator"),
  createItem,
);
// Admin o moderator pueden ejecutar
```

---

## 6. Manejo de errores

### Errores de validación (400)

```json
{
  "success": false,
  "message": "Error en validación de datos",
  "errors": [
    {
      "field": "password",
      "message": "Contraseña debe tener al menos 8 caracteres",
      "code": "too_small"
    },
    {
      "field": "email",
      "message": "Email inválido",
      "code": "invalid_string"
    }
  ]
}
```

### Errores de autenticación (401)

```json
{
  "success": false,
  "message": "Token expirado"
}
```

### Errores de autorización (403)

```json
{
  "success": false,
  "message": "Acceso denegado. Se requiere uno de los roles: admin"
}
```

### Errores de duplicados (409)

```json
{
  "success": false,
  "message": "Valor duplicado en campo(s): email"
}
```

---

## 7. Configuración

### Variables de entorno (.env)

```env
# JWT
JWT_SECRET=tu-clave-secreta-super-segura-aqui
JWT_EXPIRATION=24h

# Servidor
PORT=3000
NODE_ENV=development
```

---

## 8. Mejoras futuras

- [ ] Implementar bcrypt para hashear contraseñas
- [ ] Agregar refresh tokens
- [ ] Rate limiting en rutas públicas
- [ ] CORS configurado por ambiente
- [ ] Auditoría de cambios
- [ ] Soft deletes para datos sensibles
- [ ] Two-factor authentication
- [ ] OAuth2 integration

---

## 9. Resumen de archivos

| Archivo              | Descripción                        |
| -------------------- | ---------------------------------- |
| `schemas.js`         | Definición de esquemas Zod         |
| `jwt.js`             | JWT y middlewares de autenticación |
| `errorHandler.js`    | Manejo centralizado de errores     |
| `auth.controller.js` | Controlador de login/registro      |
| `auth.routes.js`     | Rutas de autenticación             |
| `EJEMPLOS.js`        | Ejemplos de uso                    |

---

## 10. Referencias

- [Zod Documentation](https://zod.dev/)
- [JWT.io](https://jwt.io/)
- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
