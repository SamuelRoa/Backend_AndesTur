import cron from "node-cron";
import { expirePastReservations } from "../utils/reservationExpiry.js";

export const startExpireReservationsTask = () => {
  if (process.env.NODE_ENV === "test") return null;

  // Ejecutar todos los días a las 12:05 AM
  const task = cron.schedule(
    "5 0 * * *",
    async () => {
      console.log("[Cron] Ejecutando expiración automática de reservaciones...");
      await expirePastReservations();
    },
    { scheduled: true }
  );

  task.start();
  return task;
};
