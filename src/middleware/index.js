// ==================== MIDDLEWARE INDEX ====================
// Exportar todos los middlewares de forma centralizada

export {
  generateToken,
  verifyToken,
  decodeToken,
  authenticateToken,
  authorizeRole,
  requirePermission,
  authorizeAdmin,
} from "./auth.middleware.js";

export { validateSchema, validateData } from "./validation.middleware.js";

export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
} from "./errorHandler.middleware.js";

export { cacheMiddleware } from "./cache.middleware.js";
export { redisRateLimiter } from "./rateLimit.middleware.js";


