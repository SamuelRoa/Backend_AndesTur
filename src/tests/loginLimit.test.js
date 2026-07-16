import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { usersModel } from "../models/users.models.js";
import { rolesModel } from "../models/roles.models.js";
import bcrypt from "bcrypt";
import { _resetMemoryStore } from "../middleware/loginLimit.middleware.js";

describe("Login Rate Limiting Integration Test", () => {
  let originalNow;

  beforeAll(() => {
    originalNow = Date.now;
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    _resetMemoryStore();
  });

  test("Allows 10 incorrect login attempts, blocks the 11th, and unblocks after 10 minutes", async () => {
    // Mock standard usersModel findOne to return null (invalid credentials, returns 401)
    jest.spyOn(usersModel, "findOne").mockResolvedValue(null);

    let currentTime = 1700000000000;
    jest.spyOn(Date, "now").mockImplementation(() => currentTime);

    const payload = { email: "rate_limit_test@example.com", password: "Password1!" };

    // 10 incorrect attempts allowed (status code 401)
    for (let i = 1; i <= 10; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .send(payload)
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Credenciales inválidas");
    }

    // 11th attempt is blocked (429 status code) with dynamic message indicating 10 minutes remaining
    const blockedRes = await request(app)
      .post("/api/auth/login")
      .send(payload)
      .expect(429);

    expect(blockedRes.body).toEqual({
      success: false,
      message: "Tu dirección IP ha sido suspendida temporalmente por exceso de intentos de inicio de sesión incorrectos. Por favor, intenta de nuevo en 10 minutos.",
      error: {
        code: "TOO_MANY_REQUESTS",
        time_remaining_seconds: 600
      }
    });

    // Advance time by 5 minutes to test remaining time format
    currentTime += 5 * 60 * 1000;

    const blockedResHalfway = await request(app)
      .post("/api/auth/login")
      .send(payload)
      .expect(429);

    expect(blockedResHalfway.body).toEqual({
      success: false,
      message: "Tu dirección IP ha sido suspendida temporalmente por exceso de intentos de inicio de sesión incorrectos. Por favor, intenta de nuevo en 5 minutos.",
      error: {
        code: "TOO_MANY_REQUESTS",
        time_remaining_seconds: 300
      }
    });

    // Advance time by another 5 minutes and 1 second (total 10 minutes and 1 second)
    currentTime += 5 * 60 * 1000 + 1000;

    // The 12th request should be allowed through again (returning 401 since it is still incorrect credentials)
    const afterBlockRes = await request(app)
      .post("/api/auth/login")
      .send(payload)
      .expect(401);
  });

  test("Allows consecutive successful logins without any rate limiting", async () => {
    // Mock user model and auth helpers to return success (status 200)
    const fakeUser = { id_user: 5, username: "adminuser", email: "admin@example.com", password: "hashed_password", state: "active", id_role: 1 };
    jest.spyOn(usersModel, "findOne").mockResolvedValue(fakeUser);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
    jest.spyOn(rolesModel, "findByPk").mockResolvedValue({ id_role: 1, type: "admin" });

    const payload = { email: "admin@example.com", password: "CorrectPassword1!" };

    // 15 successful login attempts should all succeed (no rate limit block)
    for (let i = 1; i <= 15; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Login exitoso");
    }
  });
});
