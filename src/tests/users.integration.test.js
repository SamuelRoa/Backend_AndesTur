import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { usersModel } from "../models/users.models.js";
import { rolesModel } from "../models/roles.models.js";
import { generateToken } from "../middleware/auth.middleware.js";

const adminToken = generateToken({
  id_user: 1,
  email: "admin@andestur.com",
  username: "admin",
  role: "admin",
});

describe("Users endpoints (mocked models)", () => {
  afterEach(() => jest.restoreAllMocks());

  test("GET /api/users - list users (admin)", async () => {
    jest.spyOn(usersModel, "findAll").mockResolvedValue([{ id_user: 1, username: "u1", email: "u1@example.com" }]);
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/users - rejects non-admin", async () => {
    const operatorToken = generateToken({
      id_user: 2,
      email: "op@test.com",
      username: "operator",
      role: "operator",
    });
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${operatorToken}`)
      .expect(403);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/users - create user (admin)", async () => {
    const payload = { username: "newuser", email: `new_${Date.now()}@test.com`, password: "Password1!" };
    jest.spyOn(usersModel, "create").mockImplementation(async (obj) => ({ id_user: 11, ...obj }));
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id_user");
  });

  test("GET /api/users/:id - get by id (admin)", async () => {
    jest.spyOn(usersModel, "findByPk").mockResolvedValue({ id_user: 2, username: "u2", email: "u2@example.com" });
    const res = await request(app)
      .get("/api/users/2")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id_user", 2);
  });

  test("PUT /api/users/:id - update user (admin)", async () => {
    jest.spyOn(usersModel, "update").mockResolvedValue([1]);
    jest.spyOn(usersModel, "findByPk").mockResolvedValue({ id_user: 3, username: "updated", email: "upd@example.com" });
    const res = await request(app)
      .put("/api/users/3")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ username: "updated" })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("username", "updated");
  });

  test("DELETE /api/users/:id - delete user (admin)", async () => {
    jest.spyOn(usersModel, "destroy").mockResolvedValue(1);
    const res = await request(app)
      .delete("/api/users/4")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  test("GET /api/users/profile - own profile (any authenticated user)", async () => {
    const payload = { id_user: 20, email: "p@p.com", username: "p", role: "operator" };
    const token = generateToken(payload);

    jest.spyOn(usersModel, "findByPk").mockResolvedValue({
      id_user: 20,
      email: payload.email,
      username: payload.username,
      state: "active",
      id_role: 2,
    });
    jest.spyOn(rolesModel, "findByPk").mockResolvedValue({ id_role: 2, type: "operator" });

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("role");
  });
});
