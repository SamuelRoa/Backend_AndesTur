import { client, getRedisStatus } from "../config/redis.js";

// Estructura en memoria para fallback cuando Redis no esté disponible
const memoryStore = {
  attempts: new Map(), // ip -> { count: number, resetTime: number }
  blocks: new Map(),    // ip -> blockUntilTime (timestamp)
};

// Limpieza periódica para evitar fugas de memoria
setInterval(() => {
  const now = Date.now();
  for (const [ip, blockTime] of memoryStore.blocks.entries()) {
    if (blockTime <= now) {
      memoryStore.blocks.delete(ip);
    }
  }
  for (const [ip, attempt] of memoryStore.attempts.entries()) {
    if (attempt.resetTime <= now) {
      memoryStore.attempts.delete(ip);
    }
  }
}, 60 * 1000).unref();

/**
 * Helper para enviar la respuesta de suspensión formateada con el tiempo restante en segundos
 */
const sendSuspendedResponse = (res, timeLeftSeconds) => {
  const timeString = `${timeLeftSeconds} segundo${timeLeftSeconds !== 1 ? "s" : ""}`;
  return res.status(429).json({
    success: false,
    message: `Demasiadas consultas de reservas. Por favor, intenta de nuevo en ${timeString}.`,
    error: {
      code: "TOO_MANY_REQUESTS",
      time_remaining_seconds: timeLeftSeconds,
    },
  });
};

/**
 * Middleware para limitar consultas de reservas.
 * Máximo 10 consultas en 1 minuto.
 * Si se excede, se suspende la IP por 1 minuto (60 segundos).
 */
export const reservationQueryRateLimiter = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress;
  const now = Date.now();

  let redisAvailable = false;
  try {
    const status = getRedisStatus();
    redisAvailable = status.connected && client;
  } catch (err) {
    // getRedisStatus no disponible o falló
  }

  if (redisAvailable) {
    try {
      const blockKey = `reservation:block:${ip}`;
      const limitKey = `reservation:limit:${ip}`;

      // 1. Verificar si la IP está bloqueada actualmente
      const isBlocked = await client.get(blockKey);
      if (isBlocked) {
        const ttl = await client.ttl(blockKey);
        const timeLeftSeconds = ttl > 0 ? ttl : 60;
        return sendSuspendedResponse(res, timeLeftSeconds);
      }

      // 2. Incrementar el contador de intentos en la ventana de 1 minuto
      const count = await client.incr(limitKey);
      if (count === 1) {
        await client.expire(limitKey, 60); // Expiración en 1 minuto (60 segundos)
      }

      // 3. Validar si excede el límite de 10 peticiones
      if (count > 10) {
        // Bloquear la IP por 1 minuto (60 segundos)
        await client.set(blockKey, "blocked", { EX: 60 });
        await client.del(limitKey); // Limpiar intentos para evitar acumulados extra

        return sendSuspendedResponse(res, 60);
      }

      return next();
    } catch (error) {
      console.warn("[Reservation Rate Limit Middleware] Error en Redis, usando fallback de memoria:", error.message);
      // Caída al flujo en memoria
    }
  }

  // Lógica de Fallback en Memoria
  // 1. Verificar si la IP está bloqueada
  const blockTime = memoryStore.blocks.get(ip);
  if (blockTime) {
    if (blockTime > now) {
      const timeLeftSeconds = Math.ceil((blockTime - now) / 1000);
      return sendSuspendedResponse(res, timeLeftSeconds);
    } else {
      memoryStore.blocks.delete(ip);
    }
  }

  // 2. Incrementar intentos
  let attempt = memoryStore.attempts.get(ip);
  if (!attempt || attempt.resetTime <= now) {
    attempt = { count: 1, resetTime: now + 60 * 1000 };
    memoryStore.attempts.set(ip, attempt);
  } else {
    attempt.count += 1;
  }

  // 3. Validar si excede el límite
  if (attempt.count > 10) {
    memoryStore.blocks.set(ip, now + 60 * 1000); // Bloqueo por 1 minuto (60 segundos)
    memoryStore.attempts.delete(ip); // Limpiar intentos

    return sendSuspendedResponse(res, 60);
  }

  next();
};

// Exportar helper para pruebas de integración
export const _resetMemoryStore = () => {
  memoryStore.attempts.clear();
  memoryStore.blocks.clear();
};
