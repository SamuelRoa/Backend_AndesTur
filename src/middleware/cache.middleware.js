import { getCache, setCache, getRedisStatus } from "../config/redis.js";
import { verifyToken } from "./auth.middleware.js";

/**
 * Middleware para almacenar y recuperar respuestas JSON desde Redis
 * @param {string} prefix - Prefijo para las claves de caché (ej: 'destinations', 'packages')
 * @param {number} ttlInSeconds - Tiempo de expiración del caché en segundos (por defecto 30 minutos)
 */
export const cacheMiddleware = (prefix, ttlInSeconds = 1800) => {
  return async (req, res, next) => {
    try {
      const status = getRedisStatus();
      if (!status.connected) {
        res.setHeader("X-Cache", "BYPASS");
        return next();
      }

      const authHeader = req.headers.authorization || req.headers.Authorization;
      let isAdminRequest = false;
      if (authHeader) {
        const token = authHeader.replace(/^(Bearer|bearer)\s+/, "").trim();
        if (token) {
          isAdminRequest = verifyToken(token).success;
        }
      }

      // Generar una clave única basada en el endpoint, parámetros de consulta y rol de admin
      const cacheKey = `cache:${prefix}:${req.originalUrl}:admin=${isAdminRequest}`;

      // Intentar obtener de la caché
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        // Enviar respuesta cacheada directamente
        res.setHeader("X-Cache", "HIT");
        return res.json(cachedData);
      }

      // Interceptar la respuesta json para guardarla en la caché antes de enviarla
      res.setHeader("X-Cache", "MISS");
      const originalJson = res.json;
      res.json = (body) => {
        // Solo cachear si la respuesta es exitosa (código de estado 200-299)
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success) {
          setCache(cacheKey, body, ttlInSeconds).catch((err) => {
            console.error(`[Cache Middleware] Error al guardar en Redis (${cacheKey}):`, err.message);
          });
        }
        return originalJson.call(res, body);
      };

      next();
    } catch (error) {
      // En caso de cualquier error imprevisto, continuar sin bloquear el request (fallback resiliente)
      console.warn("[Cache Middleware] Error en middleware de caché, omitiendo:", error.message);
      res.setHeader("X-Cache", "BYPASS");
      next();
    }
  };
};

