import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { destinationsModel } from "../models/destinations.models.js";

describe("Destinations endpoints (mocked models)", () => {
  afterEach(() => jest.restoreAllMocks());

  test("GET /api/destinations - list destinations", async () => {
    jest.spyOn(destinationsModel, "findAll").mockResolvedValue([{ id_destination: 1, name: "Dest1" }]);
    const res = await request(app).get("/api/destinations").expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/destinations - create destination", async () => {
    const payload = { id_municipality: 1, description: "Lugar hermoso", name: "Destino X" };
    jest.spyOn(destinationsModel, "create").mockImplementation(async (obj) => ({ id_destination: 10, ...obj }));
    const res = await request(app).post("/api/destinations").send(payload).expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id_destination");
  });

  test("GET /api/destinations/:id - get by id", async () => {
    jest.spyOn(destinationsModel, "findByPk").mockResolvedValue({ id_destination: 2, name: "Dest2" });
    const res = await request(app).get("/api/destinations/2").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id_destination", 2);
  });

  test("PUT /api/destinations/:id - update destination", async () => {
    jest.spyOn(destinationsModel, "update").mockResolvedValue([1]);
    jest.spyOn(destinationsModel, "findByPk").mockResolvedValue({ id_destination: 3, name: "UpdatedDest" });
    const res = await request(app).put("/api/destinations/3").send({ name: "UpdatedDest" }).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("name", "UpdatedDest");
  });

  test("DELETE /api/destinations/:id - delete destination", async () => {
    jest.spyOn(destinationsModel, "destroy").mockResolvedValue(1);
    const res = await request(app).delete("/api/destinations/7").expect(200);
    expect(res.body.success).toBe(true);
  });
});
