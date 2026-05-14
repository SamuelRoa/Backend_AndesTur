# Arquitectura del Sistema de Validaciones

## Flujo de una solicitud HTTP

```
                    Cliente
                       |
                       v
              POST /api/auth/login
                       |
                       v
         ┌─────────────────────────┐
         │  Servidor Express       │
         └─────────────────────────┘
                       |
                       v (Middleware Stack)
         ┌─────────────────────────┐
         │ 1. helmet (seguridad)   │
         ├─────────────────────────┤
         │ 2. cors (orígenes)      │
         ├─────────────────────────┤
         │ 3. json parser          │
         ├─────────────────────────┤
         │ 4. morgan (logging)     │
         ├─────────────────────────┤
         │ 5. bodyParser           │
         └─────────────────────────┘
                       |
                       v
         ┌─────────────────────────┐
         │ Router (/api)           │
         │                         │
         │ ├── /auth routes        │
         │ ├── /users routes       │
         │ ├── /packages routes    │
         │ └── ... más routes      │
         └─────────────────────────┘
                       |
                       v
         ┌─────────────────────────┐
         │ Auth Routes             │
         │ (auth.routes.js)        │
         └─────────────────────────┘
                       |
                       v (Middleware: authenticateToken?)
         ┌─────────────────────────┐
         │ JWT Middleware          │
         │ (validar token)         │
         │                         │
         │ ✓ Token válido          │
         │ └─> req.user = decoded  │
         │                         │
         │ ✗ Token inválido        │
         │ └─> error 401           │
         └─────────────────────────┘
                       |
                       v (Middleware: validateSchema?)
         ┌─────────────────────────┐
         │ Validación Schema       │
         │ (errorHandler.js)       │
         │                         │
         │ ✓ Datos válidos         │
         │ └─> req.body validado   │
         │                         │
         │ ✗ Datos inválidos       │
         │ └─> error 400           │
         └─────────────────────────┘
                       |
                       v
         ┌─────────────────────────┐
         │ Controlador             │
         │ (auth.controller.js)    │
         │                         │
         │ login(req, res)         │
         └─────────────────────────┘
                       |
                       v (Try-catch)
         ┌─────────────────────────┐
         │ Lógica de negocio       │
         │                         │
         │ 1. Buscar usuario       │
         │ 2. Validar contraseña   │
         │ 3. Generar JWT          │
         │ 4. Retornar respuesta   │
         └─────────────────────────┘
                       |
        Error? ┌───────┴───────┐ OK
               |               |
               v               v
    ┌──────────────────┐  ┌─────────────────┐
    │ next(error)      │  │ res.json(200)   │
    └──────────────────┘  └─────────────────┘
               |               |
               v               v
    ┌──────────────────┐  ┌─────────────────┐
    │ Error Middleware │  │ Respuesta al    │
    │                  │  │ cliente         │
    │ ✓ Zod error      │  │                 │
    │ ✓ DB error       │  │ {               │
    │ ✓ JWT error      │  │   success: true,│
    │ ✓ Custom error   │  │   data: {...}   │
    │                  │  │ }               │
    │ Retorna          │  └─────────────────┘
    │ error formateado │
    └──────────────────┘
               |
               v
          Cliente
```

---

## Estructura de archivos

```
src/
├── server.js                 [ACTUALIZADO]
│   └─> Integra errorHandler middleware
│
├── routes/
│   ├── index.js              [ACTUALIZADO]
│   │   └─> Registra authRoutes
│   ├── auth.routes.js        [NUEVO]
│   │   └─> POST /register, /login
│   │   └─> GET /verify, /profile
│   ├── users.routes.js       [A ACTUALIZAR]
│   └─> ... más rutas
│
├── controllers/
│   ├── auth.controller.js    [NUEVO - importa desde middleware]
│   │   ├─> register()
│   │   ├─> login()
│   │   ├─> verifyAuth()
│   │   └─> getProfile()
│   ├── users.controller.js   [EXISTENTE - aplicar validaciones]
│   └─> ... más controladores
│
├── middleware/               [NUEVA CARPETA - CENTRALIZADO]
│   ├── index.js              [NUEVO - exportar todos]
│   ├── auth.middleware.js    [NUEVO]
│   │   ├─> generateToken()
│   │   ├─> verifyToken()
│   │   ├─> decodeToken()
│   │   ├─> authenticateToken
│   │   └─> authorizeRole()
│   ├── validation.middleware.js [NUEVO]
│   │   ├─> validateSchema()
│   │   └─> validateData()
│   ├── errorHandler.middleware.js [NUEVO]
│   │   ├─> AppError class
│   │   ├─> errorHandler
│   │   ├─> notFoundHandler
│   │   ├─> asyncHandler
│   │   └─> [manejo centralizado]
│   └── README.md             [NUEVO - documentación]
│
└── validations/              [CARPETA DE ESQUEMAS]
    ├── schemas.js            [NUEVO - 40+ esquemas Zod]
    ├── jwt.js                [LEGACY - usar middleware/]
    ├── errorHandler.js       [LEGACY - usar middleware/]
    └── EJEMPLOS.js           [REFERENCIA]
```

---

## Componentes clave

### 1. Esquemas Zod (schemas.js)

```
schemas.js
├── Genéricos
│   ├─ idSchema
│   ├─ emailSchema
│   ├─ passwordSchema
│   ├─ phoneSchema
│   ├─ dniSchema
│   ├─ priceSchema
│   ├─ dateSchema
│   └─ enums (userState, staffType, payMethod, payState)
│
└─ Por Entidad (40+ total)
   ├─ Users: createUserSchema, updateUserSchema
   ├─ Roles: createRoleSchema, updateRoleSchema
   ├─ Customers: createCustomerSchema, updateCustomerSchema
   ├─ Packages: createPackageSchema, updatePackageSchema
   └─ ... más entidades
```

### 2. JWT (jwt.js)

```
jwt.js
├─ generateToken(payload)
│  └─> Crea JWT con 24h expiration
│
├─ verifyToken(token)
│  └─> Verifica y decodifica JWT
│
├─ decodeToken(token)
│  └─> Solo decodifica (sin verificación)
│
├─ authenticateToken middleware
│  ├─ Busca Authorization header
│  ├─ Valida token
│  ├─ Adjunta req.user = decoded
│  └─ Retorna 401 si falla
│
└─ authorizeRole(...roles) middleware
   ├─ Requiere authenticateToken primero
   ├─ Verifica req.user.role
   ├─ Retorna 403 si no autorizado
   └─ next() si OK
```

### 3. Error Handler (errorHandler.js)

```
errorHandler.js
├─ validateSchema(schema, source) middleware
│  ├─ Valida body/query/params
│  ├─ Retorna 400 + errores formateados si falla
│  └─ Adjunta req.bodyValidated si OK
│
├─ validateData(schema, data) función
│  ├─ Valida datos manualmente
│  └─ Retorna {success, data/errors}
│
├─ errorHandler middleware
│  ├─ Zod errors → 400
│  ├─ DB unique errors → 409
│  ├─ DB validation errors → 400
│  ├─ JWT errors → 401
│  └─ Generic → 500
│
├─ AppError class
│  └─ Extiende Error con statusCode
│
└─ notFoundHandler middleware
   └─ Captura rutas no encontradas → 404
```

### 4. Auth Controller (auth.controller.js)

```
auth.controller.js
├─ register(req, res)
│  ├─ Validar createUserSchema
│  ├─ Verificar email único
│  ├─ Verificar rol existe
│  ├─ Crear usuario (sin hashear pwd aún)
│  └─ Retornar 201 + token
│
├─ login(req, res)
│  ├─ Validar loginSchema
│  ├─ Buscar usuario
│  ├─ Verificar estado = active
│  ├─ Comparar contraseña (TODO: bcrypt)
│  └─ Retornar 200 + token
│
├─ verifyAuth(req, res)
│  ├─ Requiere authenticateToken
│  └─ Retorna req.user
│
└─ getProfile(req, res)
   ├─ Requiere authenticateToken
   ├─ Buscar usuario en DB
   ├─ Incluir relación role
   └─ Retornar 200 + usuario completo
```

---

## Flujos comunes

### Registrarse

```
1. Cliente envía POST /api/auth/register
   {
     "username": "johndoe",
     "password": "SecurePass123!",
     "email": "john@example.com",
     "id_role": 1
   }

2. Validación de schema (createUserSchema)
   ✓ username: string no vacío
   ✓ password: 8+ chars, mayúscula, minúscula, número, símbolo
   ✓ email: formato válido
   ✓ id_role: número entero positivo

3. Verificaciones en BD
   ✓ Email no existe (unique constraint)
   ✓ Role existe

4. Crear usuario en BD
   User {
     id_user: 1,
     username: "johndoe",
     email: "john@example.com",
     password: "[plaintext - TODO: hashear con bcrypt]",
     state: "active",
     id_role: 1
   }

5. Generar JWT
   Token = sign({
     id_user: 1,
     email: "john@example.com",
     username: "johndoe",
     role: "admin"
   }, secret, {expiresIn: "24h"})

6. Retornar 201
   {
     "success": true,
     "message": "Usuario registrado",
     "data": { id_user, username, email, state },
     "token": "eyJhbG..."
   }
```

### Login

```
1. Cliente envía POST /api/auth/login
   {
     "email": "john@example.com",
     "password": "SecurePass123!"
   }

2. Validación loginSchema
   ✓ email: formato válido
   ✓ password: no vacío

3. Buscar usuario por email en BD
   ✓ Encontrado
   ✗ No encontrado → 401

4. Verificar estado
   ✓ state = "active"
   ✗ state = "inactive" → 401

5. Comparar contraseña (TODO: bcrypt.compare)
   ✓ Coincide
   ✗ No coincide → 401

6. Generar JWT (igual que registro)

7. Retornar 200 + token
```

### Acceder ruta protegida

```
1. Cliente envía GET /api/auth/profile
   Headers: Authorization: Bearer eyJhbG...

2. Middleware authenticateToken
   ├─ Extrae token del header
   ├─ Llama verifyToken(token)
   ├─ Decodifica payload
   ├─ Adjunta req.user = { id_user, email, username, role }
   └─ Llama next()

3. Si token inválido/expirado
   └─ Retorna 401

4. Controlador getProfile
   ├─ Accede req.user (ya autenticado)
   ├─ Busca usuario en BD
   ├─ Incluye rol
   └─ Retorna 200 + datos completos
```

### Acceder ruta protegida por rol

```
1. Cliente envía DELETE /api/users/1
   Headers: Authorization: Bearer eyJhbG...
   Requiere: admin

2. Middleware authenticateToken
   └─ OK (igual que antes)

3. Middleware authorizeRole("admin")
   ├─ Verifica req.user.role = "admin"
   ├─ Si OK → next()
   └─ Si NO → retorna 403

4. Controlador deleteUser
   ├─ Busca usuario
   ├─ Elimina de BD
   └─ Retorna 200
```

---

## Estados y códigos HTTP

```
✓ 200 OK                - Solicitud exitosa
✓ 201 Created           - Recurso creado exitosamente
✗ 400 Bad Request       - Validación fallida
✗ 401 Unauthorized      - Token inválido/expirado
✗ 403 Forbidden         - Rol insuficiente
✗ 404 Not Found         - Recurso no existe
✗ 409 Conflict          - Valor duplicado en DB
✗ 500 Server Error      - Error interno del servidor
```

---

## Variables de entorno

```
JWT_SECRET           - Clave para firmar JWT (>32 caracteres en prod)
JWT_EXPIRATION       - Duración de token (default: 24h)
NODE_ENV             - development | production
DB_*                 - Credenciales de BD
PORT                 - Puerto del servidor (default: 3000)
```

---

## Próximos pasos

1. **Implementar bcrypt** → Hashear contraseñas
2. **Validar en todas las rutas** → Aplicar schemas a CRUD
3. **Proteger rutas** → Usar authenticateToken y authorizeRole
4. **Testing** → Validar con Postman
5. **Producción** → Cambiar JWT_SECRET y configurar CORS
