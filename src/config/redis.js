import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;
let isReady = false;
let client = null;

if (redisUrl) {
  const options = {
    url: redisUrl,
  };

  // Render Redis key-value uses rediss:// (TLS secure protocol)
  if (redisUrl.startsWith("rediss://")) {
    options.socket = {
      tls: true,
      rejectUnauthorized: false,
    };
  }

  client = createClient(options);

  client.on("connect", () => {
    console.log("🔄 Intentando conectar a Redis...");
  });

  client.on("ready", () => {
    isReady = true;
    console.log("✅ Conectado a Redis de forma exitosa");
  });

  client.on("error", (err) => {
    isReady = false;
    console.error("⚠️ Error en el cliente de Redis:", err.message);
  });

  client.on("end", () => {
    isReady = false;
    console.log("❌ Conexión de Redis finalizada");
  });

  // Conectar de forma asíncrona para evitar bloquear el arranque del servidor
  client.connect().catch((err) => {
    console.warn("⚠️ No se pudo conectar a Redis. Continuando sin caché:", err.message);
    isReady = false;
  });
} else {
  console.warn("⚠️ Variable REDIS_URL no definida. Continuando sin caché.");
}

/**
 * Obtener datos de la caché por su clave
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
export const getCache = async (key) => {
  if (!isReady || !client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Error al leer caché para key ${key}:`, err.message);
    return null;
  }
};

/**
 * Guardar datos en caché con un tiempo de vida (TTL) específico
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlInSeconds 
 * @returns {Promise<boolean>}
 */
export const setCache = async (key, value, ttlInSeconds = 1800) => {
  if (!isReady || !client) return false;
  try {
    await client.set(key, JSON.stringify(value), {
      EX: ttlInSeconds,
    });
    return true;
  } catch (err) {
    console.error(`Error al escribir caché para key ${key}:`, err.message);
    return false;
  }
};

/**
 * Eliminar todas las llaves en caché que coincidan con un patrón (ej: 'destinations:*')
 * @param {string} pattern 
 * @returns {Promise<boolean>}
 */
export const deleteCachePattern = async (pattern) => {
  if (!isReady || !client) return false;
  try {
    const keys = await client.keys(pattern);
    if (keys && keys.length > 0) {
      await client.del(keys);
      console.log(`🧹 Caché eliminada para el patrón: ${pattern} (${keys.length} llaves)`);
    }
    return true;
  } catch (err) {
    console.error(`Error al eliminar caché para patrón ${pattern}:`, err.message);
    return false;
  }
};

/**
 * Eliminar una llave específica de la caché
 * @param {string} key 
 * @returns {Promise<boolean>}
 */
export const clearCache = async (key) => {
  if (!isReady || !client) return false;
  try {
    await client.del(key);
    return true;
  } catch (err) {
    console.error(`Error al eliminar caché para key ${key}:`, err.message);
    return false;
  }
};

// Exportar estado actual para verificación
export const getRedisStatus = () => ({
  configured: !!redisUrl,
  connected: isReady,
});

export { client, isReady };

