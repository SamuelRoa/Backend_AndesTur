// ==================== ERROR HANDLER MIDDLEWARE ====================
// Manejo centralizado de errores

import { ZodError } from "zod";

/**
 * Clase personalizada para errores de aplicación
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware para manejar todos los errores
 * Debe ser el último middleware en la pila
 */
export const errorHandler = (err, req, res, next) => {
  // Valor por defecto
  let statusCode = err.statusCode || 500;
  let message = err.message || "Error interno del servidor";
  let response = {
    success: false,
    message,
  };

  // ==================== ERRORES ZOD ====================
  if (err instanceof ZodError) {
    statusCode = 400;
    response.message = "Error en validación de datos";
    response.errors = err.errors.map((error) => ({
      field: error.path.join("."),
      message: error.message,
      code: error.code,
    }));
  }

  // ==================== ERRORES SEQUELIZE ====================
  // Unique constraint violation
  else if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    response.message = `Valor duplicado en campo(s): ${err.fields.join(", ")}`;
    response.fields = err.fields;
  }

  // Validation error
  else if (err.name === "SequelizeValidationError") {
    statusCode = 400;
    response.message = "Error en validación de base de datos";
    response.errors = err.errors.map((error) => ({
      field: error.path,
      message: error.message,
      type: error.type,
    }));
  }

  // Foreign key constraint error
  else if (err.name === "SequelizeForeignKeyConstraintError") {
    statusCode = 400;
    response.message = `Referencia inválida: ${err.table || "tabla desconocida"}`;
  }

  // Database connection error
  else if (err.name === "SequelizeConnectionError") {
    statusCode = 503;
    response.message = "Error de conexión a la base de datos";
  }

  // ==================== ERRORES JWT ====================
  else if (err.message && err.message.includes("jwt")) {
    statusCode = 401;
    response.message = "Token no válido o expirado";
  }

  // ==================== ERRORES PERSONALIZADOS ====================
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.message = err.message;
  }

  // ==================== ERRORES GENÉRICOS ====================
  else {
    statusCode = err.statusCode || 500;
    response.message = err.message || "Error interno del servidor";

    // En desarrollo, incluir stack trace
    if (process.env.NODE_ENV === "development") {
      response.stack = err.stack;
    }
  }

  // Enviar respuesta
  res.status(statusCode).json(response);
};

/**
 * Middleware para capturar rutas no encontradas
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
};

/**
 * Wrapper para funciones async en rutas
 * Evita tener que hacer try-catch en cada controlador
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
