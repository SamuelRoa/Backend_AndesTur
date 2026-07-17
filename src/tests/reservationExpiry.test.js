import { expirePastReservations } from "../utils/reservationExpiry.js";
import { reservationsModel } from "../models/reservations.models.js";
import { jest } from "@jest/globals";

describe("Reservation Expiry", () => {
  test("expirePastReservations should update status to expired for pending/partial with past dates", async () => {
    const updateSpy = jest.spyOn(reservationsModel, "update").mockResolvedValue([2]);
    const result = await expirePastReservations();
    expect(updateSpy).toHaveBeenCalled();
    expect(result).toBe(2);
    updateSpy.mockRestore();
  });
});
