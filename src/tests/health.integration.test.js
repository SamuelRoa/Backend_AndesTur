import request from "supertest";
import app from "../server.js";
import { healthSchema } from "../validations/schemas.js";

describe("GET /api - Health endpoint", () => {
  test("should respond 200 and match health schema", async () => {
    const res = await request(app).get("/api").expect(200);
    expect(() => healthSchema.parse(res.body)).not.toThrow();
    expect(res.body.success).toBe(true);
    expect(typeof res.body.message).toBe("string");
  });
});
