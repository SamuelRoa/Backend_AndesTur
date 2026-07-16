import { client, getRedisStatus } from "../config/redis.js";

/**
 * Middleware de Rate Limiting con Redis y Suspensión Escalonada.
 * Límite: 100 peticiones cada 5 minutos por IP.
 * Bloqueo: 
 *   - 1ra infracción: 15 minutos.
 *   - 2da+ infracción (reincidente): 24 horas.
 */
export const redisRateLimiter = async (req, res, next) => {
  try {
    const status = getRedisStatus();
    if (!status.connected || !client) {
      // Fallback resiliente: Si Redis no está disponible, continuar sin aplicar límite
      return next();
    }

    // Obtener la IP del cliente (considerando proxies si está en Render)
    const ip = req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress;

    const blockKey = `rate:block:${ip}`;
    const limitKey = `rate:limit:${ip}`;
    const offenseKey = `rate:offenses:${ip}`;

    // 1. Verificar si la IP está bloqueada actualmente
    const blockDataRaw = await client.get(blockKey);
    if (blockDataRaw) {
      const blockData = JSON.parse(blockDataRaw);
      const now = Date.now();
      const timeLeftMs = blockData.blockedUntil - now;

      if (timeLeftMs > 0) {
        const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);
        const durationMinutes = blockData.offenseLevel === 1 ? 15 : 1440; // 15 min o 24 horas (1440 min)

        return res.status(429).json({
          success: false,
          message: "Tu dirección IP ha sido suspendida temporalmente por exceso de peticiones.",
          error: {
            code: "TOO_MANY_REQUESTS",
            ip: ip,
            offense_level: blockData.offenseLevel,
            block_duration_minutes: durationMinutes,
            time_remaining_seconds: timeLeftSeconds,
            blocked_until: new Date(blockData.blockedUntil).toISOString(),
            detail: blockData.offenseLevel === 1
              ? "Has superado el límite de 100 consultas en 5 minutos. Tu IP ha sido bloqueada temporalmente por 15 minutos."
              : "Suspensión reincidente por abuso reiterado. Tu IP ha sido bloqueada temporalmente por 24 horas."
          }
        });
      } else {
        // El bloqueo expiró, eliminamos la clave de bloqueo
        await client.del(blockKey);
      }
    }

    // 2. Incrementar el contador de peticiones en la ventana actual de 5 minutos (300 segundos)
    const currentCount = await client.incr(limitKey);

    if (currentCount === 1) {
      // Establecer el tiempo de expiración de 5 minutos si es el primer registro de la ventana
      await client.expire(limitKey, 300);
    }

    // 3. Validar si excede el límite de 100 peticiones
    if (currentCount > 100) {
      // Incrementar el número de ofensas/infracciones (expira en 7 días para dar tiempo a limpiar el historial)
      const offenses = await client.incr(offenseKey);
      if (offenses === 1) {
        await client.expire(offenseKey, 604800); // 7 días en segundos
      }

      // Definir duración del bloqueo (15 minutos o 24 horas)
      const blockDurationSeconds = offenses === 1 ? 900 : 86400; // 900s = 15m, 86400s = 24h
      const blockedUntil = Date.now() + (blockDurationSeconds * 1000);

      const blockData = {
        isBlocked: true,
        offenseLevel: offenses,
        blockedUntil: blockedUntil
      };

      // Guardar el bloqueo en Redis
      await client.set(blockKey, JSON.stringify(blockData), {
        EX: blockDurationSeconds
      });

      // Limpiar el contador de solicitudes
      await client.del(limitKey);

      const durationMinutes = offenses === 1 ? 15 : 1440;

      return res.status(429).json({
        success: false,
        message: "Tu dirección IP ha sido suspendida temporalmente por exceso de peticiones.",
        error: {
          code: "TOO_MANY_REQUESTS",
          ip: ip,
          offense_level: offenses,
          block_duration_minutes: durationMinutes,
          time_remaining_seconds: blockDurationSeconds,
          blocked_until: new Date(blockedUntil).toISOString(),
          detail: offenses === 1
            ? "Has superado el límite de 100 consultas en 5 minutos. Tu IP ha sido bloqueada temporalmente por 15 minutos."
            : "Suspensión reincidente por abuso reiterado. Tu IP ha sido bloqueada temporalmente por 24 horas."
        }
      });
    }

    next();
  } catch (error) {
    // Fallback resiliente: Continuar de forma segura si hay fallos en Redis
    console.warn("[Rate Limit Middleware] Error en validación de límites, omitiendo:", error.message);
    next();
  }
};
