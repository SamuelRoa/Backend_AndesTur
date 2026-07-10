import cron from "node-cron";
import { Op } from "sequelize";
import { trashModel } from "../models/trash.models.js";

const runCleanup = async () => {
  try {
    const now = new Date();
    const deleted = await trashModel.destroy({
      where: {
        expires_at: { [Op.lte]: now },
      },
    });
    if (deleted > 0) {
      console.log(`Papelera: ${deleted} elemento(s) eliminados automáticamente por expiración`);
    }
  } catch (error) {
    console.error("Error en limpieza automática de papelera:", error.message);
  }
};

export const startTrashCleanupTask = () => {
  if (process.env.NODE_ENV === "test") return null;
  const task = cron.schedule("0 3 * * *", async () => {
    console.log("Ejecutando limpieza automática de papelera...");
    await runCleanup();
  }, { scheduled: true });

  task.start();
  return task;
};

export { runCleanup };
