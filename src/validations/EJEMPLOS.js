// ==================== EJEMPLO DE INTEGRACIÓN DE VALIDACIONES ====================

// Este archivo muestra ejemplos de cómo usar el sistema de validaciones
// en los controladores existentes.

// ==================== EJEMPLO 1: Controlador con validación ====================
/*
import { validateData, AppError } from "../validations/errorHandler.js";
import { createUserSchema, updateUserSchema } from "../validations/schemas.js";
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

    const validatedData = validation.data;

    // Crear usuario
    const user = await usersModel.create(validatedData);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error); // Pasar al errorHandler centralizado
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    // Validar datos de actualización
    const validation = validateData(updateUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Error en validación",
        errors: validation.errors,
      });
    }

    const [updated] = await usersModel.update(validation.data, {
      where: { id_user: id },
    });

    if (!updated) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const updatedUser = await usersModel.findByPk(id);
    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
*/

// ==================== EJEMPLO 2: Usar middleware de validación en rutas ====================
/*
import express from "express";
import { validateSchema } from "../validations/errorHandler.js";
import { createUserSchema, updateUserSchema } from "../validations/schemas.js";
import { authenticateToken } from "../validations/jwt.js";
import { createUser, updateUser, deleteUser, getAllUsers } from "../controllers/users.controller.js";

const router = express.Router();

// Proteger todas las rutas con autenticación
router.use(authenticateToken);

// Aplicar validación al middleware
router.post("/", validateSchema(createUserSchema, "body"), createUser);
router.put("/:id", validateSchema(updateUserSchema, "body"), updateUser);
router.delete("/:id", deleteUser);
router.get("/", getAllUsers);

export default router;
*/

// ==================== EJEMPLO 3: Flujo completo de autenticación ====================
/*
1. Usuario se registra:
   POST /api/auth/register
   {
     "username": "johndoe",
     "password": "SecurePass123!",
     "email": "john@example.com",
     "id_role": 1
   }

2. Usuario recibe token JWT y lo almacena localmente

3. Usuario hace login:
   POST /api/auth/login
   {
     "email": "john@example.com",
     "password": "SecurePass123!"
   }

4. Usuario recibe nuevo token

5. Usuario accede a rutas protegidas:
   GET /api/auth/profile
   Headers: {
     "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }

6. Si token es válido, se procesa la solicitud
   Si token es inválido o expirado, se rechaza con 401
*/

// ==================== ESQUEMAS DE VALIDACIÓN DISPONIBLES ====================
/*
GENÉRICAS:
- idSchema
- emailSchema
- nameSchema
- descriptionSchema
- phoneSchema
- dniSchema
- passwordSchema
- priceSchema
- dateSchema
- futureDateSchema
- userStateEnum
- staffTypeEnum
- payMethodEnum
- payStateEnum

POR ENTIDAD:
- createUserSchema / updateUserSchema
- createRoleSchema / updateRoleSchema
- createCustomerSchema / updateCustomerSchema
- createStateSchema / updateStateSchema
- createMunicipalitySchema / updateMunicipalitySchema
- createDestinationSchema / updateDestinationSchema
- createVehicleSchema / updateVehicleSchema
- createPackageSchema / updatePackageSchema
- createStaffSchema / updateStaffSchema
- createReservationSchema / updateReservationSchema
- createPaymentHeaderSchema / updatePaymentHeaderSchema
- createPaymentDetailSchema / updatePaymentDetailSchema
- createPackageDestinationSchema / updatePackageDestinationSchema
- createStaffPackageSchema / updateStaffPackageSchema
*/

// ==================== FUNCIONES DE UTILIDAD ====================
/*
FUNCIONES JWT:
- generateToken(payload) // Generar JWT
- verifyToken(token) // Verificar y decodificar JWT
- decodeToken(token) // Solo decodificar sin verificar
- authenticateToken // Middleware para proteger rutas
- authorizeRole(...roles) // Middleware para autorizar por rol

FUNCIONES DE VALIDACIÓN:
- validateSchema(schema, source) // Middleware para validar
- validateData(schema, data) // Función para validar datos
- errorHandler // Middleware centralizado de errores
- notFoundHandler // Middleware para rutas no encontradas
*/

// ==================== VARIABLES DE ENTORNO RECOMENDADAS ====================
/*
En tu archivo .env:

JWT_SECRET=tu-clave-secreta-super-segura-aqui
JWT_EXPIRATION=24h
NODE_ENV=development
PORT=3000
*/

// ==================== PRÓXIMOS PASOS ====================
/*
1. Integrar validaciones en cada controlador
2. Proteger rutas sensibles con authenticateToken
3. Implementar bcrypt para hashear contraseñas (en auth.controller.js)
4. Configurar CORS adecuadamente para producción
5. Agregar rate limiting en rutas públicas
6. Implementar refresh tokens para mayor seguridad
*/

export default {};
