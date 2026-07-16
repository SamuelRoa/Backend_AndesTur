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
}, 5 * 60 * 1000).unref();

/**
 * Middleware para limitar intentos de login.
 * Máximo 10 intentos en 5 minutos.
 * Si se excede, se suspende la IP por 10 minutos.
 */
export const loginRateLimiter = async (req, res, next) => {
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
      const blockKey = `login:block:${ip}`;
      const limitKey = `login:limit:${ip}`;

      // 1. Verificar si la IP está bloqueada actualmente
      const isBlocked = await client.get(blockKey);
      if (isBlocked) {
        const ttl = await client.ttl(blockKey);
        const timeLeftSeconds = ttl > 0 ? ttl : 600;

        return res.status(429).json({
          success: false,
          message: "Demasiados intentos de inicio de sesión. IP suspendida por 10 minutos.",
          error: {
            code: "TOO_MANY_REQUESTS",
            time_remaining_seconds: timeLeftSeconds,
          },
        });
      }

      // 2. Incrementar el contador de intentos en la ventana de 5 minutos
      const count = await client.incr(limitKey);
      if (count === 1) {
        await client.expire(limitKey, 300); // Expiración en 5 minutos (300 segundos)
      }

      // 3. Validar si excede el límite de 10 peticiones
      if (count > 10) {
        // Bloquear la IP por 10 minutos (600 segundos)
        await client.set(blockKey, "blocked", { EX: 600 });
        await client.del(limitKey); // Limpiar intentos para evitar acumulados extra

        return res.status(429).json({
          success: false,
          message: "Demasiados intentos de inicio de sesión. IP suspendida por 10 minutos.",
          error: {
            code: "TOO_MANY_REQUESTS",
            time_remaining_seconds: 600,
          },
        });
      }

      return next();
    } catch (error) {
      console.warn("[Login Rate Limit Middleware] Error en Redis, usando fallback de memoria:", error.message);
      // Caída al flujo en memoria
    }
  }

  // Lógica de Fallback en Memoria
  // 1. Verificar si la IP está bloqueada
  const blockTime = memoryStore.blocks.get(ip);
  if (blockTime) {
    if (blockTime > now) {
      const timeLeftSeconds = Math.ceil((blockTime - now) / 1000);
      return res.status(429).json({
        success: false,
        message: "Demasiados intentos de inicio de sesión. IP suspendida por 10 minutos.",
        error: {
          code: "TOO_MANY_REQUESTS",
          time_remaining_seconds: timeLeftSeconds,
        },
      });
    } else {
      memoryStore.blocks.delete(ip);
    }
  }

  // 2. Incrementar intentos
  let attempt = memoryStore.attempts.get(ip);
  if (!attempt || attempt.resetTime <= now) {
    attempt = { count: 1, resetTime: now + 5 * 60 * 1000 };
    memoryStore.attempts.set(ip, attempt);
  } else {
    attempt.count += 1;
  }

  // 3. Validar si excede el límite
  if (attempt.count > 10) {
    memoryStore.blocks.set(ip, now + 10 * 60 * 1000); // Bloqueo por 10 minutos
    memoryStore.attempts.delete(ip); // Limpiar intentos

    return res.status(429).json({
      success: false,
      message: "Demasiados intentos de inicio de sesión. IP suspendida por 10 minutos.",
      error: {
        code: "TOO_MANY_REQUESTS",
        time_remaining_seconds: 600,
      },
    });
  }

  next();
};

// Exportar helper para pruebas de integración
export const _resetMemoryStore = () => {
  memoryStore.attempts.clear();
  memoryStore.blocks.clear();
};
