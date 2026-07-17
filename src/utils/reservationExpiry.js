import { Op } from "sequelize";
import { reservationsModel } from "../models/reservations.models.js";

/**
 * Busca y expira automáticamente todas las reservaciones en estado "pending" o "partial"
 * cuya fecha de viaje sea anterior a la fecha actual.
 * @returns {Promise<number>} Número de reservaciones expiradas
 */
export const expirePastReservations = async () => {
  try {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const [affectedCount] = await reservationsModel.update(
      { pay_state: "expired" },
      {
        where: {
          travel_date: { [Op.lt]: todayStr },
          pay_state: { [Op.in]: ["pending", "partial"] },
        },
      }
    );

    if (affectedCount > 0) {
      console.log(`[Auto-Expiry] ${affectedCount} reservación(es) pasadas han sido marcadas como expiradas.`);
    }
    return affectedCount;
  } catch (err) {
    console.error("Error al expirar reservaciones pasadas:", err.message);
    return 0;
  }
};
