import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { customersModel } from "../models/customers.models.js";
import { _resetMemoryStore } from "../middleware/reservationLimit.middleware.js";

describe("Reservation Query Rate Limiting Integration Test", () => {
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

  test("Allows 10 reservation query attempts, blocks the 11th, and unblocks after 1 minute", async () => {
    // Mock customersModel.findOne to return null (returns 404, not found)
    jest.spyOn(customersModel, "findOne").mockResolvedValue(null);

    let currentTime = 1700000000000;
    jest.spyOn(Date, "now").mockImplementation(() => currentTime);

    const payload = { email: "customer@example.com", dni: "12345678" };

    // 10 queries allowed (returns 404 since customer not found)
    for (let i = 1; i <= 10; i++) {
      await request(app)
        .post("/api/reservations/query")
        .send(payload)
        .expect(404);
    }

    // 11th query is blocked (429 status code)
    const blockedRes = await request(app)
      .post("/api/reservations/query")
      .send(payload)
      .expect(429);

    expect(blockedRes.body).toEqual({
      success: false,
      message: "Demasiadas consultas de reservas. Por favor, intenta de nuevo en 60 segundos.",
      error: {
        code: "TOO_MANY_REQUESTS",
        time_remaining_seconds: 60
      }
    });

    // Advance time by 30 seconds to check remaining time formatting
    currentTime += 30 * 1000;

    const blockedResHalfway = await request(app)
      .post("/api/reservations/query")
      .send(payload)
      .expect(429);

    expect(blockedResHalfway.body).toEqual({
      success: false,
      message: "Demasiadas consultas de reservas. Por favor, intenta de nuevo en 30 segundos.",
      error: {
        code: "TOO_MANY_REQUESTS",
        time_remaining_seconds: 30
      }
    });

    // Advance time by another 30 seconds and 1 second (total 1 minute and 1 second)
    currentTime += 30 * 1000 + 1000;

    // The 12th query should be allowed through again (returning 404)
    await request(app)
      .post("/api/reservations/query")
      .send(payload)
      .expect(404);
  });
});
