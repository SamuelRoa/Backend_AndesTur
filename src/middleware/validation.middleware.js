// ==================== VALIDATION MIDDLEWARE ====================
// Validación de esquemas Zod

import { ZodError } from "zod";

/**
 * Middleware para validar datos contra un esquema Zod
 * @param {Object} schema - Esquema Zod
 * @param {string} source - "body" | "query" | "params"
 * @returns {Function} Middleware
 */
export const validateSchema = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validated = schema.parse(dataToValidate);

      // Adjuntar datos validados para usar en el controlador
      req.bodyValidated = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
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

      next(error);
    }
  };
};

/**
 * Validar datos manualmente contra un esquema
 * @param {Object} schema - Esquema Zod
 * @param {*} data - Datos a validar
 * @returns {Object} {success: boolean, data?: validated, errors?: formattedErrors}
 */
export const validateData = (schema, data) => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));

      return { success: false, errors: formattedErrors };
    }

    return { success: false, errors: [{ message: "Error desconocido" }] };
  }
};
