import { jest } from '@jest/globals';
import request from "supertest";
import app from "../server.js";
import { reservationsModel } from "../models/reservations.models.js";
import { customersModel } from "../models/customers.models.js";
import { packagesModel } from "../models/packages.models.js";
import nodemailer from "nodemailer";

describe("Reservations Endpoints (mocked models)", () => {
  let sendMailMock;

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: "test-message-id" });
    jest.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail: sendMailMock,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("GET /api/reservations - list reservations", async () => {
    jest.spyOn(reservationsModel, "findAll").mockResolvedValue([{ id_reservation: 1, id_package: 2 }]);
    const res = await request(app).get("/api/reservations").expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/reservations/pre-reservation - create new customer and pre-reservation", async () => {
    const payload = {
      dni: "987654321",
      name: "Maria",
      lastname: "Gomez",
      phone_number: "3109876543",
      email: "maria.gomez@example.com",
      id_package: 5,
    };

    const mockPackage = { id_package: 5, name: "Tour Sierra Nevada", price: 500.0 };
    const mockCustomer = { id_customer: 10, dni: "987654321", name: "Maria", lastname: "Gomez", email: "maria.gomez@example.com" };
    const mockReservation = { id_reservation: 22, id_package: 5, id_customer: 10, pay_state: "pending", reservation_date: new Date().toISOString() };

    jest.spyOn(packagesModel, "findByPk").mockResolvedValue(mockPackage);
    jest.spyOn(customersModel, "findOne").mockResolvedValue(null);
    jest.spyOn(customersModel, "create").mockResolvedValue(mockCustomer);
    jest.spyOn(reservationsModel, "create").mockResolvedValue(mockReservation);

    const res = await request(app)
      .post("/api/reservations/pre-reservation")
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.customer).toHaveProperty("id_customer", 10);
    expect(res.body.data.reservation).toHaveProperty("id_reservation", 22);
    expect(res.body.data.reservation).toHaveProperty("pay_state", "pending");
    expect(sendMailMock).toHaveBeenCalled();
  });

  test("POST /api/reservations/pre-reservation - reuse existing customer", async () => {
    const payload = {
      dni: "12345678",
      name: "Juan",
      lastname: "Perez Updated",
      phone_number: "+573001234567",
      email: "juan.perez@example.com",
      id_package: 3,
    };

    const mockPackage = { id_package: 3, name: "Tour Chicamocha", price: 300.0 };
    const existingCustomer = {
      id_customer: 1,
      dni: "12345678",
      name: "Juan",
      lastname: "Perez",
      email: "juan@example.com",
      update: jest.fn().mockResolvedValue(true),
    };
    const mockReservation = { id_reservation: 23, id_package: 3, id_customer: 1, pay_state: "pending", reservation_date: new Date().toISOString() };

    jest.spyOn(packagesModel, "findByPk").mockResolvedValue(mockPackage);
    jest.spyOn(customersModel, "findOne").mockResolvedValue(existingCustomer);
    jest.spyOn(reservationsModel, "create").mockResolvedValue(mockReservation);

    const res = await request(app)
      .post("/api/reservations/pre-reservation")
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(existingCustomer.update).toHaveBeenCalledWith({
      name: "Juan",
      lastname: "Perez Updated",
      phone_number: "+573001234567",
      email: "juan.perez@example.com",
    });
    expect(res.body.data.reservation).toHaveProperty("id_reservation", 23);
    expect(sendMailMock).toHaveBeenCalled();
  });

  test("PUT /api/reservations/:id - trigger validation email when pay_state becomes paid", async () => {
    const mockCustomer = { id_customer: 10, name: "Maria", email: "maria@example.com" };
    const mockPackage = { id_package: 5, name: "Tour Sierra Nevada", price: 500.0 };

    const mockReservationBefore = {
      id_reservation: 22,
      id_package: 5,
      id_customer: 10,
      pay_state: "pending",
      Customer: mockCustomer,
      Package: mockPackage,
    };

    const mockReservationAfter = {
      id_reservation: 22,
      id_package: 5,
      id_customer: 10,
      pay_state: "paid",
      Customer: mockCustomer,
      Package: mockPackage,
    };

    jest.spyOn(reservationsModel, "findByPk")
      .mockResolvedValueOnce(mockReservationBefore) // Before update
      .mockResolvedValueOnce(mockReservationAfter); // After update

    jest.spyOn(reservationsModel, "update").mockResolvedValue([1]);

    const res = await request(app)
      .put("/api/reservations/22")
      .send({ pay_state: "paid" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("pay_state", "paid");
    expect(sendMailMock).toHaveBeenCalled();
  });
});
