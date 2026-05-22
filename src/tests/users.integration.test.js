import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { usersModel } from "../models/users.models.js";
import { rolesModel } from "../models/roles.models.js";
import { generateToken } from "../middleware/auth.middleware.js";

describe("Users endpoints (mocked models)", () => {
  afterEach(() => jest.restoreAllMocks());

  test("GET /api/users - list users", async () => {
    jest.spyOn(usersModel, "findAll").mockResolvedValue([{ id_user: 1, username: "u1", email: "u1@example.com" }]);
    const res = await request(app).get("/api/users").expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/users - create user", async () => {
    const payload = { username: "newuser", email: `new_${Date.now()}@test.com`, password: "Password1!" };
    jest.spyOn(usersModel, "create").mockImplementation(async (obj) => ({ id_user: 11, ...obj }));
    const res = await request(app).post("/api/users").send(payload).expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id_user");
  });

  test("GET /api/users/:id - get by id", async () => {
    jest.spyOn(usersModel, "findByPk").mockResolvedValue({ id_user: 2, username: "u2", email: "u2@example.com" });
    const res = await request(app).get("/api/users/2").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id_user", 2);
  });

  test("PUT /api/users/:id - update user", async () => {
    jest.spyOn(usersModel, "update").mockResolvedValue([1]);
    jest.spyOn(usersModel, "findByPk").mockResolvedValue({ id_user: 3, username: "updated", email: "upd@example.com" });
    const res = await request(app).put("/api/users/3").send({ username: "updated" }).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("username", "updated");
  });

  test("DELETE /api/users/:id - delete user", async () => {
    jest.spyOn(usersModel, "destroy").mockResolvedValue(1);
    const res = await request(app).delete("/api/users/4").expect(200);
    expect(res.body.success).toBe(true);
  });
});
