import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { usersModel } from "../models/users.models.js";
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

  test("Allows 10 login attempts, blocks the 11th, and unblocks after 10 minutes", async () => {
    // Mock standard usersModel findOne to return null to bypass actual database queries
    jest.spyOn(usersModel, "findOne").mockResolvedValue(null);

    let currentTime = 1700000000000;
    jest.spyOn(Date, "now").mockImplementation(() => currentTime);

    const payload = { email: "rate_limit_test@example.com", password: "Password1!" };

    // 10 attempts allowed (returning validation failure or bad credentials, status code 400 or 401)
    for (let i = 1; i <= 10; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .send(payload);
      
      expect([400, 401]).toContain(res.status);
    }

    // 11th attempt is blocked (429 status code)
    const blockedRes = await request(app)
      .post("/api/auth/login")
      .send(payload)
      .expect(429);

    expect(blockedRes.body).toEqual({
      success: false,
      message: "Demasiados intentos de inicio de sesión. IP suspendida por 10 minutos.",
      error: {
        code: "TOO_MANY_REQUESTS",
        time_remaining_seconds: 600
      }
    });

    // Advance time by 10 minutes and 1 second
    currentTime += 10 * 60 * 1000 + 1000;

    // The 12th request should be allowed through again (returning 400 or 401)
    const afterBlockRes = await request(app)
      .post("/api/auth/login")
      .send(payload);
      
    expect([400, 401]).toContain(afterBlockRes.status);
  });
});
