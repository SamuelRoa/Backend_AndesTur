import { z } from "zod";

// ==================== MIDDLEWARE DE VALIDACIÓN DE SCHEMA ====================
/**
 * Middleware genérico para validar datos usando Zod
 * @param {z.ZodSchema} schema - Schema de Zod para validar
 * @param {string} source - Dónde obtener datos: 'body', 'query', 'params'
 */
export const validateSchema = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validated = schema.parse(dataToValidate);
      req[`${source}Validated`] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: "Error en validación de datos",
          errors: formattedErrors,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Error desconocido en validación",
        error: error.message,
      });
    }
  };
};

// ==================== FUNCIÓN DE VALIDACIÓN MANUAL ====================
/**
 * Valida datos contra un schema de Zod
 * @param {z.ZodSchema} schema - Schema de Zod
 * @param {any} data - Datos a validar
 * @returns {{success: boolean, data?: any, errors?: array}}
 */
export const validateData = (schema, data) => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return { success: false, errors: formattedErrors };
    }
    return { success: false, errors: [{ message: error.message }] };
  }
};

// ==================== MIDDLEWARE DE MANEJO DE ERRORES ====================
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Error de Zod en try-catch
  if (err instanceof z.ZodError) {
    const formattedErrors = err.errors.map((error) => ({
      field: error.path.join("."),
      message: error.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: formattedErrors,
    });
  }

  // Error de base de datos (Sequelize)
  if (err.name === "SequelizeUniqueConstraintError") {
    const fields = err.errors.map((e) => e.path).join(", ");
    return res.status(409).json({
      success: false,
      message: `Valor duplicado en campo(s): ${fields}`,
    });
  }

  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Error de validación en base de datos",
      errors,
    });
  }

  // Error de JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado",
    });
  }

  // Error genérico
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// ==================== CLASE DE ERROR PERSONALIZADO ====================
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// ==================== MIDDLEWARE PARA ERRORES 404 ====================
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
};
