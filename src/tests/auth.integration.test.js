import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { usersModel } from "../models/users.models.js";
import { rolesModel } from "../models/roles.models.js";
import bcrypt from "bcrypt";
import { generateToken } from "../middleware/auth.middleware.js";

describe("Auth endpoints (mocked models)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("POST /api/auth/register - success", async () => {
    jest.spyOn(usersModel, "findOne").mockResolvedValue(null);
    jest.spyOn(rolesModel, "findOne").mockResolvedValue({ id_role: 2, type: "operator" });
    jest.spyOn(usersModel, "create").mockImplementation(async (obj) => ({
      id_user: 10,
      username: obj.username,
      email: obj.email,
      state: obj.state || "active",
    }));

    const payload = { username: "testuser", email: `test_${Date.now()}@test.com`, password: "Password1!" };
    const res = await request(app).post("/api/auth/register").send(payload).expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ username: payload.username, email: payload.email });
    expect(typeof res.body.token).toBe("string");
  });

  test("POST /api/auth/login - success", async () => {
    const fakeUser = { id_user: 5, username: "u", email: "u@example.com", password: "hashed", state: "active", id_role: 2 };
    jest.spyOn(usersModel, "findOne").mockResolvedValue(fakeUser);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
    jest.spyOn(rolesModel, "findByPk").mockResolvedValue({ id_role: 2, type: "operator" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: fakeUser.email, password: "Password1!" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
  });

  test("GET /api/auth/verify - valid token", async () => {
    const payload = { id_user: 99, email: "x@x.com", username: "x", role: "operator" };
    const token = generateToken(payload);

    const res = await request(app).get("/api/auth/verify").set("Authorization", `Bearer ${token}`).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user).toMatchObject(payload);
  });

  test("GET /api/auth/profile - returns profile", async () => {
    const payload = { id_user: 20, email: "p@p.com", username: "p", role: "operator" };
    const token = generateToken(payload);

    jest.spyOn(usersModel, "findByPk").mockResolvedValue({
      id_user: 20,
      email: payload.email,
      username: payload.username,
      state: "active",
      id_role: 2,
      toJSON() { return { id_user: 20, email: payload.email, username: payload.username, state: "active", id_role: 2 }; }
    });
    jest.spyOn(rolesModel, "findByPk").mockResolvedValue({ id_role: 2, type: "operator" });

    const res = await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${token}`).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("role");
  });
});
