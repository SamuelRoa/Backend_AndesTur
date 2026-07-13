import { describe, expect, it } from "@jest/globals";
import { simulatePayment } from "../services/paymentSimulator.service.js";

describe("simulatePayment", () => {
  it("aprueba una tarjeta válida de prueba", () => {
    const result = simulatePayment({
      payment_method: "card",
      amount: 120,
      cardNumber: "4111111111111111",
      expiry: "12/30",
      cvv: "123",
    });

    expect(result.approved).toBe(true);
    expect(result.message).toContain("aprobado");
    expect(result.reference).toMatch(/^SIM-/);
  });

  it("rechaza una tarjeta inválida", () => {
    const result = simulatePayment({
      payment_method: "card",
      amount: 120,
      cardNumber: "4111111111111112",
      expiry: "12/30",
      cvv: "123",
    });

    expect(result.approved).toBe(false);
    expect(result.status).toBe("rejected");
  });

  it("aprueba zelle cuando el identificador de pago está presente", () => {
    const result = simulatePayment({
      payment_method: "zelle",
      amount: 80,
      zelleIdentifier: "cliente@ejemplo.com",
    });

    expect(result.approved).toBe(true);
    expect(result.status).toBe("approved");
  });
});
