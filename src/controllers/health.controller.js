import { getRedisStatus } from "../config/redis.js";

export const getHealth = (req, res) => {
  const redis = getRedisStatus();

  res.json({
    success: true,
    message: "API funcionando",
    environment: process.env.NODE_ENV || "development",
    redis: {
      configured: redis.configured,
      connected: redis.connected,
      status: redis.connected ? "✅ Activo" : redis.configured ? "⚠️ Configurado pero sin conexión" : "❌ No configurado (sin REDIS_URL)",
      cache_routes: redis.connected
        ? ["GET /api/destinations", "GET /api/packages", "GET /api/states", "GET /api/municipalities"]
        : [],
      note: redis.connected
        ? "Las respuestas llevan el header X-Cache: HIT (caché) o MISS (base de datos)"
        : "Usando fallback en memoria. Configura REDIS_URL para activar Redis.",
    },
    timestamp: new Date().toISOString(),
  });
};

