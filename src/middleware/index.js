// ==================== MIDDLEWARE INDEX ====================
// Exportar todos los middlewares de forma centralizada

export {
  generateToken,
  verifyToken,
  decodeToken,
  authenticateToken,
  authorizeRole,
} from "./auth.middleware.js";

export { validateSchema, validateData } from "./validation.middleware.js";

export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
} from "./errorHandler.middleware.js";
