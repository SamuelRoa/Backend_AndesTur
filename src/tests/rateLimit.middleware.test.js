import { jest } from '@jest/globals';
import request from "supertest";
import express from "express";

// Variables para controlar el comportamiento del mock de Redis
let mockConnected = true;
let mockBlockData = null;
let mockIncrValue = 1;
let mockOffensesValue = 1;
const mockRedisFunctions = {
  get: jest.fn(async (key) => {
    if (key.includes("rate:block:")) {
      return mockBlockData ? JSON.stringify(mockBlockData) : null;
    }
    return null;
  }),
  incr: jest.fn(async (key) => {
    if (key.includes("rate:offenses:")) {
      return mockOffensesValue;
    }
    return mockIncrValue;
  }),

  expire: jest.fn(async () => {
    return true;
  }),
  set: jest.fn(async () => {
    return "OK";
  }),
  del: jest.fn(async () => {
    return 1;
  })
};

// Mock del modulo config/redis.js antes de importar
jest.unstable_mockModule("../config/redis.js", () => ({
  client: mockRedisFunctions,
  getRedisStatus: jest.fn(() => ({
    configured: true,
    connected: mockConnected
  }))
}));

describe("Rate Limiting Middleware con Redis", () => {
  let app;
  let redisRateLimiter;

  beforeAll(async () => {
    // Importamos dinámicamente los módulos mockeados
    const rateLimitMod = await import("../middleware/rateLimit.middleware.js");
    redisRateLimiter = rateLimitMod.redisRateLimiter;

    app = express();
    app.get("/api/test-limit", redisRateLimiter, (req, res) => {
      res.json({ success: true, message: "OK" });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnected = true;
    mockBlockData = null;
    mockIncrValue = 1;
    mockOffensesValue = 1;
  });


  test("Debería permitir la petición si está por debajo del límite", async () => {
    mockIncrValue = 50; // 50 solicitudes
    const res = await request(app).get("/api/test-limit").expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("OK");
    expect(mockRedisFunctions.incr).toHaveBeenCalled();
  });

  test("Debería bloquear con 429 si excede el límite (1ra infracción)", async () => {
    mockIncrValue = 101; // Supera las 100 solicitudes
    const res = await request(app).get("/api/test-limit").expect(429);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("suspendida temporalmente");
    expect(res.body.error).toBeDefined();
    expect(res.body.error.offense_level).toBe(1);
    expect(res.body.error.block_duration_minutes).toBe(15);
  });

  test("Debería bloquear inmediatamente si la IP ya está marcada como bloqueada", async () => {
    // Simulamos un bloqueo activo de nivel 2 (24 horas)
    mockBlockData = {
      isBlocked: true,
      offenseLevel: 2,
      blockedUntil: Date.now() + 3600000 // 1 hora en el futuro
    };

    const res = await request(app).get("/api/test-limit").expect(429);

    expect(res.body.success).toBe(false);
    expect(res.body.error.offense_level).toBe(2);
    expect(res.body.error.block_duration_minutes).toBe(1440); // 24 horas = 1440 mins
    expect(mockRedisFunctions.incr).not.toHaveBeenCalled(); // No incrementa el contador de peticiones
  });

  test("Debería omitir verificación y permitir acceso si Redis está desconectado", async () => {
    mockConnected = false; // Redis offline

    const res = await request(app).get("/api/test-limit").expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("OK");
    expect(mockRedisFunctions.incr).not.toHaveBeenCalled();
  });
});
