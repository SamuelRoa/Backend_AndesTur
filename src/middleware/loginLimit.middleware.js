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
 * Helper para enviar la respuesta de suspensión formateada con el tiempo restante
 */
const sendSuspendedResponse = (res, timeLeftSeconds) => {
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  let timeString = "";

  if (minutes > 0) {
    timeString += `${minutes} minuto${minutes > 1 ? "s" : ""}`;
  }
  if (seconds > 0) {
    if (timeString) timeString += " y ";
    timeString += `${seconds} segundo${seconds > 1 ? "s" : ""}`;
  }
  if (!timeString) {
    timeString = "unos segundos";
  }

  return res.status(429).json({
    success: false,
    message: `Tu dirección IP ha sido suspendida temporalmente por exceso de intentos de inicio de sesión incorrectos. Por favor, intenta de nuevo en ${timeString}.`,
    error: {
      code: "TOO_MANY_REQUESTS",
      time_remaining_seconds: timeLeftSeconds,
    },
  });
};

/**
 * Helper para registrar un intento fallido (401)
 */
const trackFailedAttempt = async (ip, redisAvailable) => {
  const now = Date.now();

  if (redisAvailable) {
    try {
      const limitKey = `login:limit:${ip}`;
      const blockKey = `login:block:${ip}`;

      const count = await client.incr(limitKey);
      if (count === 1) {
        await client.expire(limitKey, 300); // Expiración en 5 minutos (300 segundos)
      }

      // Al cumplir 10 o más intentos fallidos
      if (count >= 10) {
        await client.set(blockKey, "blocked", { EX: 600 }); // Bloquear por 10 minutos (600s)
        await client.del(limitKey); // Limpiar contador
      }
      return;
    } catch (err) {
      console.warn("[Login Rate Limit] Error incrementando en Redis, usando memoria:", err.message);
    }
  }

  // Fallback en Memoria
  let attempt = memoryStore.attempts.get(ip);
  if (!attempt || attempt.resetTime <= now) {
    attempt = { count: 1, resetTime: now + 5 * 60 * 1000 };
    memoryStore.attempts.set(ip, attempt);
  } else {
    attempt.count += 1;
  }

  if (attempt.count >= 10) {
    memoryStore.blocks.set(ip, now + 10 * 60 * 1000); // Bloqueo por 10 minutos
    memoryStore.attempts.delete(ip); // Limpiar intentos
  }
};

/**
 * Middleware para limitar intentos de login incorrectos.
 * Solo se acumulan intentos fallidos (cuando la respuesta es 401).
 * Si se acumulan más de 10 intentos fallidos en 5 minutos, se suspende la IP por 10 minutos.
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

  // 1. Verificar si la IP está bloqueada actualmente
  if (redisAvailable) {
    try {
      const blockKey = `login:block:${ip}`;
      const isBlocked = await client.get(blockKey);
      if (isBlocked) {
        const ttl = await client.ttl(blockKey);
        const timeLeftSeconds = ttl > 0 ? ttl : 600;
        return sendSuspendedResponse(res, timeLeftSeconds);
      }
    } catch (error) {
      console.warn("[Login Rate Limit Middleware] Error en Redis al verificar bloqueo:", error.message);
    }
  }

  // Verificar bloqueo en memoria (si Redis no está disponible o falló la verificación)
  const blockTime = memoryStore.blocks.get(ip);
  if (blockTime) {
    if (blockTime > now) {
      const timeLeftSeconds = Math.ceil((blockTime - now) / 1000);
      return sendSuspendedResponse(res, timeLeftSeconds);
    } else {
      memoryStore.blocks.delete(ip);
    }
  }

  // 2. Interceptar res.json para rastrear los intentos fallidos (código 401)
  const originalJson = res.json;
  res.json = function (body) {
    // Restaurar original json para evitar ciclos infinitos
    res.json = originalJson;

    // Solo se consideran intentos incorrectos/fallidos los que retornan 401 (Credenciales inválidas)
    if (res.statusCode === 401) {
      trackFailedAttempt(ip, redisAvailable).catch((err) => {
        console.error("[Login Rate Limit Middleware] Error al registrar intento fallido:", err.message);
      });
    }

    return res.json(body);
  };

  next();
};

// Exportar helper para pruebas de integración
export const _resetMemoryStore = () => {
  memoryStore.attempts.clear();
  memoryStore.blocks.clear();
};
