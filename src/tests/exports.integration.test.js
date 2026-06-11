import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { destinationsModel } from "../models/destinations.models.js";

describe("Exports endpoints", () => {
  afterEach(() => jest.restoreAllMocks());

  test("GET /api/exports/destinos/pdf", async () => {
    jest.spyOn(destinationsModel, "findAll").mockResolvedValue([
      {
        id_destination: 1,
        name: "Destino A",
        description: "Desc A",
        Municipality: {
          name: "Municipio A",
          State: {
            name: "Estado A"
          }
        }
      }
    ]);
    const res = await request(app).get("/api/exports/destinos/pdf");
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  test("GET /api/exports/destinos/txt", async () => {
    jest.spyOn(destinationsModel, "findAll").mockResolvedValue([
      {
        id_destination: 1,
        name: "Destino A",
        description: "Desc A",
        Municipality: {
          name: "Municipio A",
          State: {
            name: "Estado A"
          }
        }
      }
    ]);
    const res = await request(app).get("/api/exports/destinos/txt");
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('Municipio A');
    expect(res.text).toContain('Estado A');
    expect(res.text).toContain('Destino A');
  });

  test("GET /api/exports/destinos/excel", async () => {
    jest.spyOn(destinationsModel, "findAll").mockResolvedValue([
      {
        id_destination: 1,
        name: "Destino A",
        description: "Desc A",
        Municipality: {
          name: "Municipio A",
          State: {
            name: "Estado A"
          }
        }
      }
    ]);
    const res = await request(app).get("/api/exports/destinos/excel");
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
});
