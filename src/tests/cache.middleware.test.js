import { jest } from '@jest/globals';
import request from "supertest";
import express from "express";

// Mock del cliente de redis antes de importar
jest.unstable_mockModule("redis", () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn().mockRejectedValue(new Error("Redis connection failed")),
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  })),
}));

// Mock del modulo auth.middleware para simular verifyToken
jest.unstable_mockModule("../middleware/auth.middleware.js", () => ({
  verifyToken: jest.fn((token) => {
    if (token === "valid-admin-token") {
      return { success: true, data: { role: "admin" } };
    }
    return { success: false, message: "Token inválido" };
  }),
}));

describe("Caché Middleware y Fallback Resiliente", () => {
  let app;
  let cacheMiddleware;

  beforeAll(async () => {
    // Importamos dinámicamente los módulos mockeados
    const cacheMod = await import("../middleware/cache.middleware.js");
    cacheMiddleware = cacheMod.cacheMiddleware;

    app = express();
    app.use(express.json());

    // Endpoint de prueba con caché
    app.get(
      "/test-cache",
      cacheMiddleware("test", 60),
      (req, res) => {
        res.json({ success: true, data: "base-de-datos" });
      }
    );
  });

  test("Debería funcionar normalmente (fallback) si Redis no está disponible", async () => {
    // Como mockeamos que connect falla, Redis no estará listo (isReady = false)
    const res = await request(app).get("/test-cache").expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBe("base-de-datos");
  });
});
