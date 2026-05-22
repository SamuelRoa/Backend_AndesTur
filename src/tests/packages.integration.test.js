import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { packagesModel } from "../models/packages.models.js";

describe("Packages endpoints (mocked models)", () => {
  afterEach(() => jest.restoreAllMocks());

  test("GET /api/packages - list packages", async () => {
    jest.spyOn(packagesModel, "findAll").mockResolvedValue([{ id_package: 1, name: "Pack1" }]);
    const res = await request(app).get("/api/packages").expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/packages - create package", async () => {
    const payload = {
      name: "Test Package",
      description: "Descripción de prueba",
      departure_date: new Date(Date.now() + 86400000).toISOString(),
      return_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      price: 100.5,
    };
    jest.spyOn(packagesModel, "create").mockImplementation(async (obj) => ({ id_package: 12, ...obj }));
    const res = await request(app).post("/api/packages").send(payload).expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id_package");
  });

  test("GET /api/packages/:id - get by id", async () => {
    jest.spyOn(packagesModel, "findByPk").mockResolvedValue({ id_package: 2, name: "Pack2" });
    const res = await request(app).get("/api/packages/2").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id_package", 2);
  });

  test("PUT /api/packages/:id - update package", async () => {
    jest.spyOn(packagesModel, "update").mockResolvedValue([1]);
    jest.spyOn(packagesModel, "findByPk").mockResolvedValue({ id_package: 3, name: "Updated" });
    const res = await request(app).put("/api/packages/3").send({ name: "Updated" }).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("name", "Updated");
  });

  test("DELETE /api/packages/:id - delete package", async () => {
    jest.spyOn(packagesModel, "destroy").mockResolvedValue(1);
    const res = await request(app).delete("/api/packages/5").expect(200);
    expect(res.body.success).toBe(true);
  });
});
